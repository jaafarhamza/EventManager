import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AdminService } from './admin.service';
import { User } from '../modules/users/schemas/user.schema';
import { Event } from '../modules/events/schemas/event.schema';
import { Reservation } from '../modules/reservations/schemas/reservation.schema';
import { EventStatus } from '../common/enums/event-status.enum';
import { ReservationStatus } from '../common/enums/reservation-status.enum';

describe('AdminService', () => {
  let service: AdminService;

  const mockEventId = new Types.ObjectId();

  const mockUserModel = {
    countDocuments: jest.fn(),
  };

  const mockEventModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockReservationModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it.skip('should return dashboard statistics structure', async () => {
      // Arrange
      mockUserModel.countDocuments.mockResolvedValue(150);
      mockEventModel.countDocuments
        .mockResolvedValueOnce(10) // draft
        .mockResolvedValueOnce(25) // published
        .mockResolvedValueOnce(5) // canceled
        .mockResolvedValueOnce(40); // total

      // Mock aggregate for reservations count
      mockReservationModel.aggregate.mockResolvedValueOnce([
        { _id: ReservationStatus.PENDING, count: 30 },
        { _id: ReservationStatus.CONFIRMED, count: 80 },
        { _id: ReservationStatus.REFUSED, count: 10 },
        { _id: ReservationStatus.CANCELED, count: 5 },
      ]);

      // Mock aggregate for events (3 calls: getAverageFillRate, getUpcomingEvents, getPopularEvents)
      mockEventModel.aggregate
        .mockResolvedValueOnce([{ _id: null, averageFillRate: 65.5 }]) // getAverageFillRate
        .mockResolvedValueOnce([]) // getUpcomingEvents
        .mockResolvedValueOnce([]); // getPopularEvents

      // Act
      const result = await service.getDashboardStats();

      // Assert - Just verify the structure is correct
      expect(result).toBeDefined();
      expect(result.eventsCount).toBeDefined();
      expect(result.eventsCount.total).toBe(40);
      expect(result.eventsCount.draft).toBe(10);
      expect(result.eventsCount.published).toBe(25);
      expect(result.eventsCount.canceled).toBe(5);
      expect(result.averageFillRate).toBe(65.5);
      expect(result.reservationsCount).toBeDefined();
      expect(result.upcomingEvents).toEqual([]);
      expect(result.popularEvents).toEqual([]);
    });

    it('should handle zero average fill rate', async () => {
      // Arrange
      mockUserModel.countDocuments.mockResolvedValue(0);
      mockEventModel.countDocuments.mockResolvedValue(0);
      mockEventModel.aggregate.mockResolvedValue([]);
      mockReservationModel.aggregate.mockResolvedValue([]);

      // Act
      const result = await service.getDashboardStats();

      // Assert
      expect(result.averageFillRate).toBe(0);
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      // Arrange
      const event = {
        _id: mockEventId,
        title: 'Test Event',
        description: 'Test Description',
        date: new Date('2026-12-31'),
        location: 'Test Location',
        capacity: 100,
        availableSeats: 30,
        status: EventStatus.PUBLISHED,
      };

      mockEventModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(event),
        }),
      });

      const reservations = [
        {
          status: ReservationStatus.CONFIRMED,
          userId: { name: 'John Doe', email: 'john@example.com' },
          createdAt: new Date(),
        },
      ];

      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(reservations),
            }),
          }),
        }),
      });

      // Act
      const result = await service.getEventStats(mockEventId.toString());

      // Assert
      expect(result.eventId).toBe(mockEventId.toString());
      expect(result.eventTitle).toBe('Test Event');
      expect(result.fillRate).toBe(70);
      expect(result.participants).toHaveLength(1);
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      mockEventModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(
        service.getEventStats(mockEventId.toString()),
      ).rejects.toThrow('Event not found');
    });
  });
});
