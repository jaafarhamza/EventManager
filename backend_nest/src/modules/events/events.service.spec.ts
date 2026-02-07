import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { EventsService } from './events.service';
import { Event } from './schemas/event.schema';
import { EventStatus } from '../../common/enums/event-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

describe('EventsService', () => {
  let service: EventsService;

  const mockUserId = new Types.ObjectId();
  const mockEventId = new Types.ObjectId();

  // Helper to create mock event
  const createMockEvent = (overrides = {}) => ({
    _id: mockEventId,
    title: 'Test Event',
    description: 'Test event description',
    date: new Date('2026-12-31T10:00:00Z'),
    location: 'Test Location',
    capacity: 100,
    availableSeats: 100,
    status: EventStatus.DRAFT,
    createdBy: mockUserId,
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
  });

  // Mock implementations
  const mockEventModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createEventDto = {
      title: 'New Event',
      description: 'New event description',
      date: '2026-12-31T10:00:00Z',
      location: 'New Location',
      capacity: 50,
    };

    it('should successfully create an event', async () => {
      // Arrange
      const savedEvent = {
        _id: new Types.ObjectId(),
        ...createEventDto,
        date: new Date(createEventDto.date),
        status: EventStatus.DRAFT,
        availableSeats: createEventDto.capacity,
        createdBy: mockUserId,
        save: jest.fn().mockResolvedValue(this),
      };

      // Create a mock constructor that returns savedEvent
      const MockEventConstructor = jest
        .fn()
        .mockImplementation(() => savedEvent);
      Object.assign(MockEventConstructor, mockEventModel);

      // Replace the eventModel in service
      Object.defineProperty(service, 'eventModel', {
        value: MockEventConstructor,
        writable: true,
      });

      // Act
      const result = await service.create(
        createEventDto,
        mockUserId.toString(),
      );

      // Assert
      expect(result).toBeDefined();
      expect(savedEvent.save).toHaveBeenCalled();
      expect(MockEventConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createEventDto.title,
          status: EventStatus.DRAFT,
          availableSeats: createEventDto.capacity,
        }),
      );
    });

    it('should throw BadRequestException if date is in the past', async () => {
      // Arrange
      const pastEventDto = {
        ...createEventDto,
        date: '2020-01-01T10:00:00Z',
      };

      // Act & Assert
      await expect(
        service.create(pastEventDto, mockUserId.toString()),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(pastEventDto, mockUserId.toString()),
      ).rejects.toThrow('Event date must be in the future');
    });

    it('should throw BadRequestException if date is now', async () => {
      // Arrange
      const now = new Date();
      const nowEventDto = {
        ...createEventDto,
        date: now.toISOString(),
      };

      // Act & Assert
      await expect(
        service.create(nowEventDto, mockUserId.toString()),
      ).rejects.toThrow('Event date must be in the future');
    });
  });

  describe('findAll', () => {
    it('should return all PUBLISHED events for non-admin users', async () => {
      // Arrange
      const events = [
        createMockEvent({ status: EventStatus.PUBLISHED }),
        createMockEvent({ status: EventStatus.PUBLISHED }),
      ];

      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(events),
          }),
        }),
      });

      // Act
      const result = await service.findAll(UserRole.PARTICIPANT);

      // Assert
      expect(result).toEqual(events);
      expect(mockEventModel.find).toHaveBeenCalledWith({
        status: EventStatus.PUBLISHED,
      });
    });

    it('should return all events for admin users', async () => {
      // Arrange
      const events = [
        createMockEvent({ status: EventStatus.DRAFT }),
        createMockEvent({ status: EventStatus.PUBLISHED }),
        createMockEvent({ status: EventStatus.CANCELED }),
      ];

      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(events),
          }),
        }),
      });

      // Act
      const result = await service.findAll(UserRole.ADMIN);

      // Assert
      expect(result).toEqual(events);
      expect(mockEventModel.find).toHaveBeenCalledWith({});
    });

    it('should return events sorted by date', async () => {
      // Arrange
      const sortMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      mockEventModel.find.mockReturnValue({
        sort: sortMock,
      });

      // Act
      await service.findAll(UserRole.ADMIN);

      // Assert
      expect(sortMock).toHaveBeenCalledWith({ date: 1 });
    });
  });

  describe('findOne', () => {
    it('should return event for valid ID and admin user', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.DRAFT });
      mockEventModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(event),
        }),
      });

      // Act
      const result = await service.findOne(
        mockEventId.toString(),
        UserRole.ADMIN,
      );

      // Assert
      expect(result).toEqual(event);
    });

    it('should return PUBLISHED event for non-admin user', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.PUBLISHED });
      mockEventModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(event),
        }),
      });

      // Act
      const result = await service.findOne(
        mockEventId.toString(),
        UserRole.PARTICIPANT,
      );

      // Assert
      expect(result).toEqual(event);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(
        service.findOne('invalid-id', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.findOne('invalid-id', UserRole.ADMIN),
      ).rejects.toThrow('Invalid event ID');
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(
        service.findOne(mockEventId.toString(), UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-admin tries to access DRAFT event', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.DRAFT });
      mockEventModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(event),
        }),
      });

      // Act & Assert
      await expect(
        service.findOne(mockEventId.toString(), UserRole.PARTICIPANT),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne(mockEventId.toString(), UserRole.PARTICIPANT),
      ).rejects.toThrow('You do not have access to this event');
    });

    it('should throw ForbiddenException if non-admin tries to access CANCELED event', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.CANCELED });
      mockEventModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(event),
        }),
      });

      // Act & Assert
      await expect(
        service.findOne(mockEventId.toString(), UserRole.PARTICIPANT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateEventDto = {
      title: 'Updated Event',
      description: 'Updated description',
    };

    it('should successfully update an event', async () => {
      // Arrange
      const event = createMockEvent();
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.update(
        mockEventId.toString(),
        updateEventDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(event.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(
        service.update('invalid-id', updateEventDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.update(mockEventId.toString(), updateEventDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to update CANCELED event', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.CANCELED });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(
        service.update(mockEventId.toString(), updateEventDto),
      ).rejects.toThrow('Cannot modify a canceled event');
    });

    it('should throw BadRequestException if new date is in the past', async () => {
      // Arrange
      const event = createMockEvent();
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      const pastDateDto = {
        date: '2020-01-01T10:00:00Z',
      };

      // Act & Assert
      await expect(
        service.update(mockEventId.toString(), pastDateDto),
      ).rejects.toThrow('Event date must be in the future');
    });

    it('should throw BadRequestException if reducing capacity below confirmed reservations', async () => {
      // Arrange
      const event = createMockEvent({
        capacity: 100,
        availableSeats: 30, // 70 confirmed reservations
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      const capacityDto = {
        capacity: 50, // Less than 70 confirmed
      };

      // Act & Assert
      await expect(
        service.update(mockEventId.toString(), capacityDto),
      ).rejects.toThrow('Cannot reduce capacity below 70');
    });

    it('should successfully reduce capacity if above confirmed reservations', async () => {
      // Arrange
      const event = createMockEvent({
        capacity: 100,
        availableSeats: 50, // 50 confirmed reservations
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      const capacityDto = {
        capacity: 80, // More than 50 confirmed
      };

      // Act
      await service.update(mockEventId.toString(), capacityDto);

      // Assert
      expect(event.save).toHaveBeenCalled();
      // New available seats should be 80 - 50 = 30
    });
  });

  describe('publish', () => {
    it('should successfully publish a DRAFT event', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.DRAFT,
        date: new Date('2026-12-31T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.publish(mockEventId.toString());

      // Assert
      expect(result).toBeDefined();
      expect(event.status).toBe(EventStatus.PUBLISHED);
      expect(event.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(service.publish('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.publish(mockEventId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if event is not DRAFT', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.PUBLISHED });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(service.publish(mockEventId.toString())).rejects.toThrow(
        'Only DRAFT events can be published',
      );
    });

    it('should throw BadRequestException if event date is in the past', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.DRAFT,
        date: new Date('2020-01-01T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(service.publish(mockEventId.toString())).rejects.toThrow(
        'Cannot publish past events',
      );
    });
  });

  describe('cancel', () => {
    it('should successfully cancel a PUBLISHED event', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.PUBLISHED });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.cancel(mockEventId.toString());

      // Assert
      expect(result).toBeDefined();
      expect(event.status).toBe(EventStatus.CANCELED);
      expect(event.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(service.cancel('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.cancel(mockEventId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if event is not PUBLISHED', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.DRAFT });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(service.cancel(mockEventId.toString())).rejects.toThrow(
        'Only PUBLISHED events can be canceled',
      );
    });

    it('should throw BadRequestException if event is already CANCELED', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.CANCELED });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(service.cancel(mockEventId.toString())).rejects.toThrow(
        'Only PUBLISHED events can be canceled',
      );
    });
  });

  describe('calculateAvailableSeats', () => {
    it('should return available seats for valid event', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 75 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.calculateAvailableSeats(
        mockEventId.toString(),
      );

      // Assert
      expect(result).toBe(75);
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.calculateAvailableSeats(mockEventId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('decrementSeats', () => {
    it('should successfully decrement available seats', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 50 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      await service.decrementSeats(mockEventId.toString());

      // Assert
      expect(event.availableSeats).toBe(49);
      expect(event.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.decrementSeats(mockEventId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no available seats', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 0 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(
        service.decrementSeats(mockEventId.toString()),
      ).rejects.toThrow('No available seats');
    });
  });

  describe('decrementSeatsAtomic', () => {
    it('should atomically decrement seats for PUBLISHED event with available seats', async () => {
      // Arrange
      const updatedEvent = createMockEvent({
        availableSeats: 49,
        status: EventStatus.PUBLISHED,
      });

      mockEventModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedEvent),
      });

      // Act
      const result = await service.decrementSeatsAtomic(mockEventId.toString());

      // Assert
      expect(result).toEqual(updatedEvent);
      expect(mockEventModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockEventId.toString(),
          availableSeats: { $gt: 0 },
          status: EventStatus.PUBLISHED,
        },
        {
          $inc: { availableSeats: -1 },
        },
        {
          new: true,
        },
      );
    });

    it('should return null if no seats available', async () => {
      // Arrange
      mockEventModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.decrementSeatsAtomic(mockEventId.toString());

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if event is not PUBLISHED', async () => {
      // Arrange
      mockEventModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.decrementSeatsAtomic(mockEventId.toString());

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('incrementSeats', () => {
    it('should successfully increment available seats', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 50, capacity: 100 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      await service.incrementSeats(mockEventId.toString());

      // Assert
      expect(event.availableSeats).toBe(51);
      expect(event.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.incrementSeats(mockEventId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already at capacity', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 100, capacity: 100 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act & Assert
      await expect(
        service.incrementSeats(mockEventId.toString()),
      ).rejects.toThrow('Cannot exceed capacity');
    });
  });

  describe('incrementSeatsAtomic', () => {
    it('should atomically increment seats if below capacity', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 50, capacity: 100 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      const updatedEvent = createMockEvent({
        availableSeats: 51,
        capacity: 100,
      });
      mockEventModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedEvent),
      });

      // Act
      const result = await service.incrementSeatsAtomic(mockEventId.toString());

      // Assert
      expect(result).toEqual(updatedEvent);
      expect(mockEventModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockEventId.toString(),
          availableSeats: { $lt: 100 },
        },
        {
          $inc: { availableSeats: 1 },
        },
        {
          new: true,
        },
      );
    });

    it('should return null if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.incrementSeatsAtomic(mockEventId.toString());

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if already at capacity', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 100, capacity: 100 });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      mockEventModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.incrementSeatsAtomic(mockEventId.toString());

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('canBeReserved', () => {
    it('should return true for PUBLISHED event with available seats in future', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.PUBLISHED,
        availableSeats: 50,
        date: new Date('2026-12-31T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.canBeReserved(mockEventId.toString());

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.canBeReserved(mockEventId.toString());

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if event is DRAFT', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.DRAFT,
        availableSeats: 50,
        date: new Date('2026-12-31T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.canBeReserved(mockEventId.toString());

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if event is CANCELED', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.CANCELED,
        availableSeats: 50,
        date: new Date('2026-12-31T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.canBeReserved(mockEventId.toString());

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if no available seats', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.PUBLISHED,
        availableSeats: 0,
        date: new Date('2026-12-31T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.canBeReserved(mockEventId.toString());

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if event date is in the past', async () => {
      // Arrange
      const event = createMockEvent({
        status: EventStatus.PUBLISHED,
        availableSeats: 50,
        date: new Date('2020-01-01T10:00:00Z'),
      });
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      // Act
      const result = await service.canBeReserved(mockEventId.toString());

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return event statistics', async () => {
      // Arrange
      mockEventModel.countDocuments
        .mockResolvedValueOnce(10) // draft
        .mockResolvedValueOnce(25) // published
        .mockResolvedValueOnce(5) // canceled
        .mockResolvedValueOnce(40); // total

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result).toEqual({
        draft: 10,
        published: 25,
        canceled: 5,
        total: 40,
      });
      expect(mockEventModel.countDocuments).toHaveBeenCalledTimes(4);
    });

    it('should return zero statistics if no events', async () => {
      // Arrange
      mockEventModel.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result).toEqual({
        draft: 0,
        published: 0,
        canceled: 0,
        total: 0,
      });
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming events within default 30 days', async () => {
      // Arrange
      const upcomingEvents = [
        createMockEvent({
          status: EventStatus.PUBLISHED,
          date: new Date('2026-03-01T10:00:00Z'),
        }),
        createMockEvent({
          status: EventStatus.PUBLISHED,
          date: new Date('2026-03-15T10:00:00Z'),
        }),
      ];

      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(upcomingEvents),
          }),
        }),
      });

      // Act
      const result = await service.getUpcoming();

      // Assert
      expect(result).toEqual(upcomingEvents);
      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EventStatus.PUBLISHED,
          date: {
            $gte: expect.any(Date) as Date,
            $lte: expect.any(Date) as Date,
          },
        }),
      );
    });

    it('should return upcoming events within custom days', async () => {
      // Arrange
      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      await service.getUpcoming(60);

      // Assert
      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EventStatus.PUBLISHED,
        }),
      );
    });

    it('should limit results to 10 events', async () => {
      // Arrange
      const limitMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      // Act
      await service.getUpcoming();

      // Assert
      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it('should sort events by date ascending', async () => {
      // Arrange
      const sortMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      mockEventModel.find.mockReturnValue({
        sort: sortMock,
      });

      // Act
      await service.getUpcoming();

      // Assert
      expect(sortMock).toHaveBeenCalledWith({ date: 1 });
    });

    it('should return empty array if no upcoming events', async () => {
      // Arrange
      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      const result = await service.getUpcoming();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
