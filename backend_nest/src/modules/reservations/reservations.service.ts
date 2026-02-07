import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';
import { EventsService } from '../events/events.service';
import { EventStatus } from '../../common/enums/event-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditService } from '../../common/services/audit.service';
import { AuditAction } from '../../common/schemas/audit-log.schema';
import { PdfService } from '../../common/services/pdf.service';
import { Event } from '../events/schemas/event.schema';
import { User } from '../users/schemas/user.schema';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    private eventsService: EventsService,
    private auditService: AuditService,
    private pdfService: PdfService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    user: AuthenticatedUser,
    ipAddress: string,
    userAgent?: string,
  ): Promise<Reservation> {
    const { eventId } = createReservationDto;

    // Validate eventId format
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('Invalid event ID');
    }

    try {
      // 1. Verify event exists and get details
      const event = await this.eventsService.findOne(eventId);

      // 2. Verify event is PUBLISHED
      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestException('Event is not available for reservation');
      }

      // 3. Verify event has available seats
      if (event.availableSeats <= 0) {
        throw new BadRequestException('Event is full');
      }

      // 4. Verify event date is in the future
      if (event.date <= new Date()) {
        throw new BadRequestException('Event date has passed');
      }

      // 5. Check for duplicate active reservation
      const existingReservation = await this.reservationModel
        .findOne({
          userId: new Types.ObjectId(user.id),
          eventId: new Types.ObjectId(eventId),
          status: {
            $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
          },
        })
        .exec();

      if (existingReservation) {
        throw new ConflictException(
          'You already have an active reservation for this event',
        );
      }

      // 6. Atomically decrement availableSeats and check if seats are available
      const updatedEvent =
        await this.eventsService.decrementSeatsAtomic(eventId);

      if (!updatedEvent) {
        throw new BadRequestException('Event is full or no longer available');
      }

      // 7. Create reservation after successful seat decrement
      try {
        const reservation = new this.reservationModel({
          eventId: new Types.ObjectId(eventId),
          userId: new Types.ObjectId(user.id),
          status: ReservationStatus.PENDING,
        });

        await reservation.save();

        // Audit log success
        await this.auditService.log({
          action: AuditAction.RESERVATION_CREATED,
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          success: true,
          metadata: {
            reservationId: reservation._id.toString(),
            eventId,
            eventTitle: event.title,
          },
        });

        return reservation;
      } catch (error) {
        // If reservation creation fails, rollback the seat decrement
        await this.eventsService.incrementSeatsAtomic(eventId);
        throw error;
      }
    } catch (error) {
      // Audit log failure
      await this.auditService.log({
        action: AuditAction.RESERVATION_FAILED,
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          eventId,
        },
      });

      throw error;
    }
  }

  async findMyReservations(userId: string): Promise<Reservation[]> {
    return this.reservationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate(
        'eventId',
        'title description date location capacity availableSeats status',
      )
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(
    eventId?: string,
    userId?: string,
    status?: ReservationStatus,
  ): Promise<Reservation[]> {
    const filter: Record<string, unknown> = {};

    if (eventId) {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new BadRequestException('Invalid event ID');
      }
      filter.eventId = new Types.ObjectId(eventId);
    }

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (status) {
      filter.status = status;
    }

    return this.reservationModel
      .find(filter)
      .populate(
        'eventId',
        'title description date location capacity availableSeats status',
      )
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user?: AuthenticatedUser): Promise<Reservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel
      .findById(id)
      .populate(
        'eventId',
        'title description date location capacity availableSeats status',
      )
      .populate('userId', 'firstName lastName email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Check permissions if user is provided
    if (user && user.role !== UserRole.ADMIN) {
      if (reservation.userId.toString() !== user.id) {
        throw new ForbiddenException(
          'You do not have access to this reservation',
        );
      }
    }

    return reservation;
  }

  async confirm(
    id: string,
    user: AuthenticatedUser,
    ipAddress: string,
    userAgent?: string,
  ): Promise<Reservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel.findById(id).exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Can only confirm PENDING reservations
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'Only PENDING reservations can be confirmed',
      );
    }

    reservation.status = ReservationStatus.CONFIRMED;
    const result = await reservation.save();

    // Audit log
    await this.auditService.log({
      action: AuditAction.RESERVATION_CONFIRMED,
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      success: true,
      metadata: {
        reservationId: id,
        participantId: reservation.userId.toString(),
        eventId: reservation.eventId.toString(),
      },
    });

    return result;
  }

  async refuse(
    id: string,
    reason: string,
    user: AuthenticatedUser,
    ipAddress: string,
    userAgent?: string,
  ): Promise<Reservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel.findById(id).exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Can only refuse PENDING reservations
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Only PENDING reservations can be refused');
    }

    // Update reservation status
    reservation.status = ReservationStatus.REFUSED;
    reservation.cancelReason = reason;
    await reservation.save();

    // Atomically increment available seats
    const updatedEvent = await this.eventsService.incrementSeatsAtomic(
      reservation.eventId.toString(),
    );

    if (!updatedEvent) {
      // Log error via audit service if increment fails
      await this.auditService.log({
        action: AuditAction.RESERVATION_REFUSED,
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Failed to increment seats after refusal',
        metadata: {
          reservationId: id,
          eventId: reservation.eventId.toString(),
        },
      });
    }

    // Audit log success
    await this.auditService.log({
      action: AuditAction.RESERVATION_REFUSED,
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      success: true,
      metadata: {
        reservationId: id,
        participantId: reservation.userId.toString(),
        eventId: reservation.eventId.toString(),
        reason,
      },
    });

    return reservation;
  }

  async cancel(
    id: string,
    user: AuthenticatedUser,
    ipAddress: string,
    userAgent?: string,
    reason?: string,
  ): Promise<Reservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel.findById(id).exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Check permissions
    if (
      user.role !== UserRole.ADMIN &&
      reservation.userId.toString() !== user.id
    ) {
      throw new ForbiddenException(
        'You do not have permission to cancel this reservation',
      );
    }

    // Can only cancel PENDING or CONFIRMED reservations
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Only PENDING or CONFIRMED reservations can be canceled',
      );
    }

    const wasConfirmed = reservation.status === ReservationStatus.CONFIRMED;

    // Update reservation status
    reservation.status = ReservationStatus.CANCELED;
    reservation.canceledAt = new Date();
    reservation.cancelReason = reason || null;
    await reservation.save();

    // Increment available seats only if reservation was CONFIRMED
    if (wasConfirmed) {
      const updatedEvent = await this.eventsService.incrementSeatsAtomic(
        reservation.eventId.toString(),
      );

      if (!updatedEvent) {
        // Log error via audit service if increment fails
        await this.auditService.log({
          action: AuditAction.RESERVATION_CANCELED,
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          success: false,
          errorMessage: 'Failed to increment seats after cancellation',
          metadata: {
            reservationId: id,
            eventId: reservation.eventId.toString(),
          },
        });
      }
    }

    // Audit log success
    await this.auditService.log({
      action: AuditAction.RESERVATION_CANCELED,
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      success: true,
      metadata: {
        reservationId: id,
        eventId: reservation.eventId.toString(),
        wasConfirmed,
        reason: reason || 'No reason provided',
      },
    });

    return reservation;
  }

  async generateTicket(id: string, user: AuthenticatedUser): Promise<Buffer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    type PopulatedReservation = Omit<Reservation, 'eventId' | 'userId'> & {
      _id: Types.ObjectId;
      eventId: Event & { _id: Types.ObjectId };
      userId: User & { _id: Types.ObjectId };
      createdAt: Date;
    };

    const reservation = await this.reservationModel
      .findById(id)
      .populate<{ eventId: Event & { _id: Types.ObjectId } }>('eventId')
      .populate<{ userId: User & { _id: Types.ObjectId } }>('userId')
      .lean<PopulatedReservation>()
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const reservationUserId = reservation.userId._id.toString();

    if (user.role !== UserRole.ADMIN && reservationUserId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to download this ticket',
      );
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Ticket is only available for confirmed reservations',
      );
    }

    const pdfBuffer = await this.pdfService.generateTicket({
      reservationId: reservation._id.toString(),
      eventTitle: reservation.eventId.title,
      eventDescription: reservation.eventId.description,
      eventDate: reservation.eventId.date,
      eventLocation: reservation.eventId.location,
      participantName: `${reservation.userId.firstName} ${reservation.userId.lastName}`,
      participantEmail: reservation.userId.email,
      reservationStatus: 'CONFIRMÉ',
      createdAt: reservation.createdAt,
    });

    return pdfBuffer;
  }
}
