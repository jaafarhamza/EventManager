import axiosInstance from './axios';
import { API_ENDPOINTS } from './endpoints';
import type {
  User,
  UserRole,
  DashboardStats,
} from '@/types/api.types';

export const adminApi = {
  /**
   * Get all users (Admin only)
   */
  getAllUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get<User[]>(
      API_ENDPOINTS.ADMIN.USERS
    );
    return response.data;
  },

  /**
   * Change user role (Admin only)
   */
  changeUserRole: async (userId: string, role: UserRole): Promise<User> => {
    const response = await axiosInstance.patch<User>(
      API_ENDPOINTS.ADMIN.USER_ROLE(userId),
      { role }
    );
    return response.data;
  },

  /**
   * Get platform statistics (Admin only)
   */
  getStats: async (): Promise<{
    totalUsers: number;
    totalEvents: number;
    totalReservations: number;
  }> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.STATS);
    return response.data;
  },

  /**
   * Get dashboard statistics (Admin only)
   */
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get<DashboardStats>(
      API_ENDPOINTS.ADMIN.DASHBOARD
    );
    return response.data;
  },

  /**
   * Download event statistics as PDF (Admin only)
   */
  downloadEventStatsPdf: async (eventId: string): Promise<Blob> => {
    const response = await axiosInstance.get<Blob>(
      API_ENDPOINTS.ADMIN.EVENT_STATS_PDF(eventId),
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
