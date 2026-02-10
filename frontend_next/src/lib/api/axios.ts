import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Token getters and setters
export const setTokens = (access: string, refresh: string, userRole?: string) => {
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    // Store tokens in cookies for proxy access
    document.cookie = `accessToken=${access}; path=/; max-age=900; SameSite=Strict`;
    document.cookie = `refreshToken=${refresh}; path=/; max-age=604800; SameSite=Strict`;
    
    if (userRole) {
      document.cookie = `userRole=${userRole}; path=/; max-age=604800; SameSite=Strict`;
    }
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Always check fresh from storage
  let token = localStorage.getItem('accessToken');
  
  // If not in localStorage, try to get from cookies
  if (!token) {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
      // Store in localStorage for future use
      if (token) {
        localStorage.setItem('accessToken', token);
      }
    }
  } else {
    const cookies = document.cookie.split(';');
    const hasCookie = cookies.some(c => c.trim().startsWith('accessToken='));
    
    if (!hasCookie) {
      clearTokens();
      token = null;
    }
  }
  
  return token;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Always check fresh from storage
  let token = localStorage.getItem('refreshToken');
  
  // If not in localStorage, try to get from cookies
  if (!token) {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('refreshToken='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
      // Store in localStorage for future use
      if (token) {
        localStorage.setItem('refreshToken', token);
      }
    }
  } else {
    const cookies = document.cookie.split(';');
    const hasCookie = cookies.some(c => c.trim().startsWith('refreshToken='));
    
    if (!hasCookie) {
      clearTokens();
      token = null;
    }
  }
  
  return token;
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear cookies
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
    document.cookie = 'userRole=; path=/; max-age=0';
  }
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const token = getAccessToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Avoid infinite loops
      if (originalRequest.url?.includes('/auth/refresh')) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = getRefreshToken();

      if (!refresh) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refresh}`,
            },
            withCredentials: true,
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        setTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      console.error('[Access Denied]', error.response.data);
    }

    // Handle 429 Too Many Requests - Rate limit
    if (error.response?.status === 429) {
      console.error('[Rate Limit Exceeded]', error.response.data);
    }

    // Handle network errors
    if (!error.response) {
      console.error('[Network Error]', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;