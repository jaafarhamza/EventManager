export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },

  // Events
  EVENTS: {
    BASE: '/events',
    BY_ID: (id: string) => `/events/${id}`,
    PUBLISH: (id: string) => `/events/${id}/publish`,
    CANCEL: (id: string) => `/events/${id}/cancel`,
  },

  // Reservations
  RESERVATIONS: {
    BASE: '/reservations',
    BY_ID: (id: string) => `/reservations/${id}`,
    CONFIRM: (id: string) => `/reservations/${id}/confirm`,
    REFUSE: (id: string) => `/reservations/${id}/refuse`,
    TICKET: (id: string) => `/reservations/${id}/ticket`,
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    USER_ROLE: (id: string) => `/admin/users/${id}/role`,
    STATS: '/admin/stats',
    DASHBOARD: '/admin/dashboard',
    EVENT_STATS_PDF: (id: string) => `/admin/events/${id}/stats/pdf`,
  },
} as const;
