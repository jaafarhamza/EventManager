import axiosInstance from './axios';
import { API_ENDPOINTS } from './endpoints';
import type {
  Reservation,
  CreateReservationDto,
  CancelReservationDto,
  RefuseReservationDto,
  ReservationQueryParams,
} from '@/types/api.types';

export const reservationsApi = {
  /**
   * Get all reservations
   */
  getAll: async (params?: ReservationQueryParams): Promise<Reservation[]> => {
    const response = await axiosInstance.get<Reservation[]>(
      API_ENDPOINTS.RESERVATIONS.BASE,
      { params }
    );
    return response.data;
  },

  /**
   * Get reservation by ID
   */
  getById: async (id: string): Promise<Reservation> => {
    const response = await axiosInstance.get<Reservation>(
      API_ENDPOINTS.RESERVATIONS.BY_ID(id)
    );
    return response.data;
  },

  /**
   * Create new reservation
   */
  create: async (data: CreateReservationDto): Promise<Reservation> => {
    const response = await axiosInstance.post<Reservation>(
      API_ENDPOINTS.RESERVATIONS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Confirm reservation (Admin only)
   */
  confirm: async (id: string): Promise<Reservation> => {
    const response = await axiosInstance.patch<Reservation>(
      API_ENDPOINTS.RESERVATIONS.CONFIRM(id)
    );
    return response.data;
  },

  /**
   * Refuse reservation (Admin only)
   */
  refuse: async (id: string, data: RefuseReservationDto): Promise<Reservation> => {
    const response = await axiosInstance.patch<Reservation>(
      API_ENDPOINTS.RESERVATIONS.REFUSE(id),
      data
    );
    return response.data;
  },

  /**
   * Cancel reservation
   */
  cancel: async (id: string, data?: CancelReservationDto): Promise<Reservation> => {
    const response = await axiosInstance.delete<Reservation>(
      API_ENDPOINTS.RESERVATIONS.BY_ID(id),
      { data }
    );
    return response.data;
  },

  /**
   * Download reservation ticket as PDF
   */
  downloadTicket: async (id: string): Promise<Blob> => {
    const response = await axiosInstance.get<Blob>(
      API_ENDPOINTS.RESERVATIONS.TICKET(id),
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
