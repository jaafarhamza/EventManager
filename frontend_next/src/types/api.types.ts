// ============================================
// Enums
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELED = 'CANCELED',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REFUSED = 'REFUSED',
  CANCELED = 'CANCELED',
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  picture?: string;
  provider?: 'local' | 'google';
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Auth Types
// ============================================

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Event Types
// ============================================

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  availableSeats: number;
  status: EventStatus;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  capacity?: number;
}

// ============================================
// Reservation Types
// ============================================

export interface Reservation {
  _id: string;
  eventId: string | Event;
  userId: string | User;
  status: ReservationStatus;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  eventId: string;
}

export interface CancelReservationDto {
  reason?: string;
}

export interface RefuseReservationDto {
  reason: string;
}

// ============================================
// Admin Types
// ============================================

export interface DashboardStats {
  eventsCount: {
    draft: number;
    published: number;
    canceled: number;
    total: number;
  };
  reservationsCount: {
    pending: number;
    confirmed: number;
    refused: number;
    canceled: number;
    total: number;
  };
  averageFillRate: number;
  upcomingEvents: Event[];
  popularEvents: (Event & {
    reservationsCount: number;
    fillRate: number;
  })[];
}

export interface EventStats {
  eventId: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventLocation: string;
  capacity: number;
  availableSeats: number;
  status: EventStatus;
  reservationsCount: {
    pending: number;
    confirmed: number;
    refused: number;
    canceled: number;
    total: number;
  };
  fillRate: number;
  participants: Array<{
    name: string;
    email: string;
    status: string;
    reservedAt: string;
  }>;
}

// ============================================
// API Error Types
// ============================================

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ApiErrorResponse {
  response?: {
    data: ApiError;
    status: number;
    statusText: string;
  };
  message: string;
}

// ============================================
// Query Parameters
// ============================================

export interface ReservationQueryParams {
  eventId?: string;
  userId?: string;
  status?: ReservationStatus;
}
