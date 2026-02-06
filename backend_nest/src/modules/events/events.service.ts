import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '../../common/enums/event-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    // Validate that date is in the future
    const eventDate = new Date(createEventDto.date);
    if (eventDate <= new Date()) {
      throw new BadRequestException('Event date must be in the future');
    }

    const event = new this.eventModel({
      ...createEventDto,
      date: eventDate,
      status: EventStatus.DRAFT,
      availableSeats: createEventDto.capacity,
      createdBy: new Types.ObjectId(userId),
    });

    return event.save();
  }

  async findAll(userRole?: UserRole): Promise<Event[]> {
    const filter: Record<string, any> = {};

    if (userRole !== UserRole.ADMIN) {
      filter.status = EventStatus.PUBLISHED;
    }

    const events = await this.eventModel
      .find(filter)
      .sort({ date: 1 })
      .populate('createdBy', 'firstName lastName email')
      .exec();

    return events;
  }

  async findOne(id: string, userRole?: UserRole): Promise<Event> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userRole !== UserRole.ADMIN && event.status !== EventStatus.PUBLISHED) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Cannot modify CANCELED events
    if (event.status === EventStatus.CANCELED) {
      throw new BadRequestException('Cannot modify a canceled event');
    }

    // Validate date if provided
    if (updateEventDto.date) {
      const eventDate = new Date(updateEventDto.date);
      if (eventDate <= new Date()) {
        throw new BadRequestException('Event date must be in the future');
      }
      updateEventDto.date = eventDate.toISOString();
    }

    // If capacity is being reduced, check against confirmed reservations
    if (updateEventDto.capacity && updateEventDto.capacity < event.capacity) {
      const confirmedReservations = event.capacity - event.availableSeats;
      if (updateEventDto.capacity < confirmedReservations) {
        throw new BadRequestException(
          `Cannot reduce capacity below ${confirmedReservations} (number of confirmed reservations)`,
        );
      }
      // Recalculate available seats
      const newAvailableSeats = updateEventDto.capacity - confirmedReservations;
      Object.assign(event, {
        ...updateEventDto,
        availableSeats: newAvailableSeats,
      });
    } else {
      Object.assign(event, updateEventDto);
    }

    return event.save();
  }

  async publish(id: string): Promise<Event> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Can only publish DRAFT events
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT events can be published');
    }

    // Validate that date is still in the future
    if (event.date <= new Date()) {
      throw new BadRequestException('Cannot publish past events');
    }

    event.status = EventStatus.PUBLISHED;
    return event.save();
  }

  async cancel(id: string): Promise<Event> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Can only cancel PUBLISHED events
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Only PUBLISHED events can be canceled');
    }

    event.status = EventStatus.CANCELED;

    return event.save();
  }

  async calculateAvailableSeats(eventId: string): Promise<number> {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event.availableSeats;
  }

  async decrementSeats(eventId: string): Promise<void> {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.availableSeats <= 0) {
      throw new BadRequestException('No available seats');
    }

    event.availableSeats -= 1;
    await event.save();
  }

  async incrementSeats(eventId: string): Promise<void> {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.availableSeats >= event.capacity) {
      throw new BadRequestException('Cannot exceed capacity');
    }

    event.availableSeats += 1;
    await event.save();
  }

  async canBeReserved(eventId: string): Promise<boolean> {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      return false;
    }

    return (
      event.status === EventStatus.PUBLISHED &&
      event.availableSeats > 0 &&
      event.date > new Date()
    );
  }

  async getStatistics() {
    const [draft, published, canceled, total] = await Promise.all([
      this.eventModel.countDocuments({ status: EventStatus.DRAFT }),
      this.eventModel.countDocuments({ status: EventStatus.PUBLISHED }),
      this.eventModel.countDocuments({ status: EventStatus.CANCELED }),
      this.eventModel.countDocuments(),
    ]);

    return {
      draft,
      published,
      canceled,
      total,
    };
  }

  async getUpcoming(days: number = 30): Promise<Event[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.eventModel
      .find({
        status: EventStatus.PUBLISHED,
        date: { $gte: now, $lte: futureDate },
      })
      .sort({ date: 1 })
      .limit(10)
      .exec();
  }
}
