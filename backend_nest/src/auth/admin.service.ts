import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../modules/events/schemas/event.schema';
import {
  Reservation,
  ReservationDocument,
} from '../modules/reservations/schemas/reservation.schema';
import { EventStatus, ReservationStatus } from '../common/enums';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // Run all aggregations in parallel for better performance
    const [
      eventsCountByStatus,
      reservationsCountByStatus,
      fillRateData,
      upcomingEvents,
      popularEvents,
    ] = await Promise.all([
      this.getEventsCountByStatus(),
      this.getReservationsCountByStatus(),
      this.getAverageFillRate(),
      this.getUpcomingEvents(),
      this.getPopularEvents(),
    ]);

    return {
      eventsCount: eventsCountByStatus,
      averageFillRate: fillRateData,
      reservationsCount: reservationsCountByStatus,
      upcomingEvents,
      popularEvents,
    };
  }

  private async getEventsCountByStatus() {
    type AggregationResult = {
      _id: EventStatus;
      count: number;
    };

    const result = await this.eventModel.aggregate<AggregationResult>([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      draft: 0,
      published: 0,
      canceled: 0,
      total: 0,
    };

    result.forEach((item) => {
      const status = item._id;
      const count = item.count;

      if (status === EventStatus.DRAFT) counts.draft = count;
      else if (status === EventStatus.PUBLISHED) counts.published = count;
      else if (status === EventStatus.CANCELED) counts.canceled = count;

      counts.total += count;
    });

    return counts;
  }

  private async getReservationsCountByStatus() {
    type AggregationResult = {
      _id: ReservationStatus;
      count: number;
    };

    const result = await this.reservationModel.aggregate<AggregationResult>([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      pending: 0,
      confirmed: 0,
      refused: 0,
      canceled: 0,
      total: 0,
    };

    result.forEach((item) => {
      const status = item._id;
      const count = item.count;

      if (status === ReservationStatus.PENDING) counts.pending = count;
      else if (status === ReservationStatus.CONFIRMED) counts.confirmed = count;
      else if (status === ReservationStatus.REFUSED) counts.refused = count;
      else if (status === ReservationStatus.CANCELED) counts.canceled = count;

      counts.total += count;
    });

    return counts;
  }

  private async getAverageFillRate(): Promise<number> {
    type AggregationResult = {
      fillRate: number;
    };

    const result = await this.eventModel.aggregate<AggregationResult>([
      {
        $match: {
          status: { $in: [EventStatus.PUBLISHED, EventStatus.CANCELED] },
        },
      },
      {
        $project: {
          capacity: 1,
          availableSeats: 1,
          reservedSeats: {
            $subtract: ['$capacity', '$availableSeats'],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          totalReserved: { $sum: '$reservedSeats' },
        },
      },
      {
        $project: {
          fillRate: {
            $cond: {
              if: { $eq: ['$totalCapacity', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalReserved', '$totalCapacity'] },
                  100,
                ],
              },
            },
          },
        },
      },
    ]);

    if (result.length === 0) return 0;

    return Math.round(result[0].fillRate * 100) / 100;
  }

  private async getUpcomingEvents() {
    type AggregationResult = {
      _id: Types.ObjectId;
      title: string;
      date: Date;
      location: string;
      capacity: number;
      availableSeats: number;
      status: EventStatus;
      reservationsCount: number;
    };

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const result = await this.eventModel.aggregate<AggregationResult>([
      {
        $match: {
          status: EventStatus.PUBLISHED,
          date: {
            $gte: now,
            $lte: thirtyDaysFromNow,
          },
        },
      },
      {
        $lookup: {
          from: 'reservations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'reservations',
        },
      },
      {
        $addFields: {
          reservationsCount: { $size: '$reservations' },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          date: 1,
          location: 1,
          capacity: 1,
          availableSeats: 1,
          status: 1,
          reservationsCount: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $limit: 10,
      },
    ]);

    return result.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      date: event.date,
      location: event.location,
      capacity: event.capacity,
      availableSeats: event.availableSeats,
      status: event.status,
      reservationsCount: event.reservationsCount,
    }));
  }

  private async getPopularEvents() {
    type AggregationResult = {
      _id: Types.ObjectId;
      title: string;
      date: Date;
      location: string;
      capacity: number;
      availableSeats: number;
      status: EventStatus;
      reservationsCount: number;
      fillRate: number;
    };

    const result = await this.eventModel.aggregate<AggregationResult>([
      {
        $match: {
          status: { $in: [EventStatus.PUBLISHED, EventStatus.CANCELED] },
        },
      },
      {
        $lookup: {
          from: 'reservations',
          localField: '_id',
          foreignField: 'eventId',
          pipeline: [
            {
              $match: {
                status: { $in: [ReservationStatus.CONFIRMED] },
              },
            },
          ],
          as: 'confirmedReservations',
        },
      },
      {
        $addFields: {
          reservationsCount: { $size: '$confirmedReservations' },
          reservedSeats: {
            $subtract: ['$capacity', '$availableSeats'],
          },
        },
      },
      {
        $addFields: {
          fillRate: {
            $cond: {
              if: { $eq: ['$capacity', 0] },
              then: 0,
              else: {
                $multiply: [{ $divide: ['$reservedSeats', '$capacity'] }, 100],
              },
            },
          },
        },
      },
      {
        $match: {
          reservationsCount: { $gt: 0 },
        },
      },
      {
        $sort: { reservationsCount: -1, fillRate: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          date: 1,
          location: 1,
          capacity: 1,
          availableSeats: 1,
          status: 1,
          reservationsCount: 1,
          fillRate: 1,
        },
      },
    ]);

    return result.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      date: event.date,
      location: event.location,
      capacity: event.capacity,
      availableSeats: event.availableSeats,
      status: event.status,
      reservationsCount: event.reservationsCount,
      fillRate: Math.round(event.fillRate * 100) / 100,
    }));
  }

  async getEventStats(eventId: string) {
    const event = await this.eventModel
      .findById(eventId)
      .select('title description date location capacity availableSeats status')
      .lean();

    if (!event) {
      throw new Error('Event not found');
    }

    // Get all reservations for this event with user details
    const reservations = await this.reservationModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .populate('userId', 'name email')
      .select('status createdAt userId')
      .sort({ createdAt: -1 })
      .lean<
        Array<{
          status: string;
          createdAt: Date;
          userId: { name: string; email: string };
        }>
      >();

    // Count reservations by status
    const reservationsCount = {
      pending: 0,
      confirmed: 0,
      refused: 0,
      canceled: 0,
      total: reservations.length,
    };

    const participants: Array<{
      name: string;
      email: string;
      status: string;
      reservedAt: Date;
    }> = [];

    reservations.forEach((reservation) => {
      const status = reservation.status as ReservationStatus;

      if (status === ReservationStatus.PENDING) reservationsCount.pending++;
      else if (status === ReservationStatus.CONFIRMED)
        reservationsCount.confirmed++;
      else if (status === ReservationStatus.REFUSED)
        reservationsCount.refused++;
      else if (status === ReservationStatus.CANCELED)
        reservationsCount.canceled++;

      // Add to participants list
      participants.push({
        name: reservation.userId.name,
        email: reservation.userId.email,
        status: reservation.status,
        reservedAt: reservation.createdAt,
      });
    });

    // Calculate fill rate
    const reservedSeats = event.capacity - event.availableSeats;
    const fillRate =
      event.capacity > 0
        ? Math.round((reservedSeats / event.capacity) * 10000) / 100
        : 0;

    return {
      eventId: event._id.toString(),
      eventTitle: event.title,
      eventDescription: event.description,
      eventDate: event.date,
      eventLocation: event.location,
      capacity: event.capacity,
      availableSeats: event.availableSeats,
      status: event.status,
      reservationsCount,
      fillRate,
      participants,
    };
  }
}
