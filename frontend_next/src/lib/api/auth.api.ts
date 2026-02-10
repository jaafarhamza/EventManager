import axiosInstance, { setTokens, clearTokens } from './axios';
import { API_ENDPOINTS } from './endpoints';
import type {
  AuthResponse,
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  TokenRefreshResponse,
} from '@/types/api.types';

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );

    // Store tokens after successful registration
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user.role
      );
    }

    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );

    // Store tokens after successful login
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user.role
      );
    }

    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(
      API_ENDPOINTS.AUTH.LOGOUT
    );

    // Clear tokens after successful logout
    clearTokens();

    return response.data;
  },

  /**
   * Refresh access token
   */
  refresh: async (): Promise<TokenRefreshResponse> => {
    const response = await axiosInstance.post<TokenRefreshResponse>(
      API_ENDPOINTS.AUTH.REFRESH
    );

    // Update tokens after successful refresh
    if (response.data.accessToken && response.data.refreshToken) {
      // Note: userRole should persist from original login
      setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await axiosInstance.patch<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );

    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordDto): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );

    return response.data;
  },

  /**
   * Reset password with code
   */
  resetPassword: async (data: ResetPasswordDto): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );

    return response.data;
  },

  /**
   * Get Google OAuth URL
   */
  getGoogleAuthUrl: (): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}${API_ENDPOINTS.AUTH.GOOGLE}`;
  },
};
