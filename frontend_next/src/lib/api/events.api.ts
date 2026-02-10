import axiosInstance from './axios';
import { API_ENDPOINTS } from './endpoints';
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
} from '@/types/api.types';

export const eventsApi = {
  /**
   * Get all events
   */
  getAll: async (): Promise<Event[]> => {
    const response = await axiosInstance.get<Event[]>(
      API_ENDPOINTS.EVENTS.BASE
    );
    return response.data;
  },

  /**
   * Get event by ID
   */
  getById: async (id: string): Promise<Event> => {
    const response = await axiosInstance.get<Event>(
      API_ENDPOINTS.EVENTS.BY_ID(id)
    );
    return response.data;
  },

  /**
   * Create new event (Admin only)
   */
  create: async (data: CreateEventDto): Promise<Event> => {
    const response = await axiosInstance.post<Event>(
      API_ENDPOINTS.EVENTS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Update event (Admin only)
   */
  update: async (id: string, data: UpdateEventDto): Promise<Event> => {
    const response = await axiosInstance.patch<Event>(
      API_ENDPOINTS.EVENTS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Publish event (Admin only)
   */
  publish: async (id: string): Promise<Event> => {
    const response = await axiosInstance.patch<Event>(
      API_ENDPOINTS.EVENTS.PUBLISH(id)
    );
    return response.data;
  },

  /**
   * Cancel event (Admin only)
   */
  cancel: async (id: string): Promise<Event> => {
    const response = await axiosInstance.patch<Event>(
      API_ENDPOINTS.EVENTS.CANCEL(id)
    );
    return response.data;
  },
};
