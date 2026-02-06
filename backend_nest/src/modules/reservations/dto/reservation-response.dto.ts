import { ReservationStatus } from '../../../common/enums/reservation-status.enum';

export class ReservationResponseDto {
  id!: string;
  eventId!: string;
  userId!: string;
  status!: ReservationStatus;
  createdAt!: Date;
  updatedAt!: Date;
  canceledAt!: Date | null;
  cancelReason!: string | null;
  event?: {
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    capacity: number;
    availableSeats: number;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
