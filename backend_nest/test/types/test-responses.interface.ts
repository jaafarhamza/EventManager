export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  availableSeats: number;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationResponse {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
