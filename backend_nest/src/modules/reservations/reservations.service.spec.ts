import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ReservationsService } from './reservations.service';
import { Reservation } from './schemas/reservation.schema';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';
import { EventStatus } from '../../common/enums/event-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { EventsService } from '../events/events.service';
import { AuditService } from '../../common/services/audit.service';
import { PdfService } from '../../common/services/pdf.service';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const mockUserId = new Types.ObjectId();
  const mockEventId = new Types.ObjectId();
  const mockReservationId = new Types.ObjectId();

  // Helper to create mock user
  const createMockUser = (overrides = {}) => ({
    id: mockUserId.toString(),
    email: 'test@example.com',
    role: UserRole.PARTICIPANT,
    ...overrides,
  });

  // Helper to create mock event
  const createMockEvent = (overrides = {}) => ({
    _id: mockEventId,
    title: 'Test Event',
    description: 'Test event description',
    date: new Date('2026-12-31T10:00:00Z'),
    location: 'Test Location',
    capacity: 100,
    availableSeats: 50,
    status: EventStatus.PUBLISHED,
    createdBy: new Types.ObjectId(),
    ...overrides,
  });

  // Helper to create mock reservation
  const createMockReservation = (overrides = {}) => ({
    _id: mockReservationId,
    eventId: mockEventId,
    userId: mockUserId,
    status: ReservationStatus.PENDING,
    canceledAt: null,
    cancelReason: null,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toString: jest.fn().mockReturnValue(mockReservationId.toString()),
    ...overrides,
  });

  // Mock implementations
  const mockReservationModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };

  const mockEventsService = {
    findOne: jest.fn(),
    decrementSeatsAtomic: jest.fn(),
    incrementSeatsAtomic: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockPdfService = {
    generateTicket: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createReservationDto = {
      eventId: mockEventId.toString(),
    };
    const user = createMockUser();
    const ipAddress = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should successfully create a reservation', async () => {
      // Arrange
      const event = createMockEvent();
      const savedReservation = {
        _id: new Types.ObjectId(),
        eventId: mockEventId,
        userId: mockUserId,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue(this),
      };

      mockEventsService.findOne.mockResolvedValue(event);
      mockReservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockEventsService.decrementSeatsAtomic.mockResolvedValue(event);

      // Create a mock constructor
      const MockReservationConstructor = jest
        .fn()
        .mockImplementation(() => savedReservation);
      Object.assign(MockReservationConstructor, mockReservationModel);

      Object.defineProperty(service, 'reservationModel', {
        value: MockReservationConstructor,
        writable: true,
      });

      // Act
      const result = await service.create(
        createReservationDto,
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(result).toBeDefined();
      expect(savedReservation.save).toHaveBeenCalled();
      expect(mockEventsService.decrementSeatsAtomic).toHaveBeenCalledWith(
        mockEventId.toString(),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_created',
          success: true,
        }),
      );
    });

    it('should throw BadRequestException for invalid event ID', async () => {
      // Arrange
      const invalidDto = { eventId: 'invalid-id' };

      // Act & Assert
      await expect(
        service.create(invalidDto, user, ipAddress, userAgent),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(invalidDto, user, ipAddress, userAgent),
      ).rejects.toThrow('Invalid event ID');
    });

    it('should throw BadRequestException if event is not PUBLISHED', async () => {
      // Arrange
      const event = createMockEvent({ status: EventStatus.DRAFT });
      mockEventsService.findOne.mockResolvedValue(event);

      // Act & Assert
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow('Event is not available for reservation');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_failed',
          success: false,
        }),
      );
    });

    it('should throw BadRequestException if event is full', async () => {
      // Arrange
      const event = createMockEvent({ availableSeats: 0 });
      mockEventsService.findOne.mockResolvedValue(event);

      // Act & Assert
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow('Event is full');
    });

    it('should throw BadRequestException if event date has passed', async () => {
      // Arrange
      const event = createMockEvent({ date: new Date('2020-01-01T10:00:00Z') });
      mockEventsService.findOne.mockResolvedValue(event);

      // Act & Assert
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow('Event date has passed');
    });

    it('should throw ConflictException if user already has active reservation', async () => {
      // Arrange
      const event = createMockEvent();
      const existingReservation = createMockReservation();

      mockEventsService.findOne.mockResolvedValue(event);
      mockReservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingReservation),
      });

      // Act & Assert
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow(
        'You already have an active reservation for this event',
      );
    });

    it('should throw BadRequestException if atomic decrement fails', async () => {
      // Arrange
      const event = createMockEvent();
      mockEventsService.findOne.mockResolvedValue(event);
      mockReservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockEventsService.decrementSeatsAtomic.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow('Event is full or no longer available');
    });

    it('should rollback seat decrement if reservation save fails', async () => {
      // Arrange
      const event = createMockEvent();
      const failingReservation = {
        _id: new Types.ObjectId(),
        eventId: mockEventId,
        userId: mockUserId,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockEventsService.findOne.mockResolvedValue(event);
      mockReservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockEventsService.decrementSeatsAtomic.mockResolvedValue(event);
      mockEventsService.incrementSeatsAtomic.mockResolvedValue(event);

      const MockReservationConstructor = jest
        .fn()
        .mockImplementation(() => failingReservation);
      Object.assign(MockReservationConstructor, mockReservationModel);

      Object.defineProperty(service, 'reservationModel', {
        value: MockReservationConstructor,
        writable: true,
      });

      // Act & Assert
      await expect(
        service.create(createReservationDto, user, ipAddress, userAgent),
      ).rejects.toThrow('Database error');
      expect(mockEventsService.incrementSeatsAtomic).toHaveBeenCalledWith(
        mockEventId.toString(),
      );
    });
  });

  describe('findMyReservations', () => {
    it('should return user reservations sorted by creation date', async () => {
      // Arrange
      const reservations = [
        createMockReservation(),
        createMockReservation({ status: ReservationStatus.CONFIRMED }),
      ];

      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(reservations),
            }),
          }),
        }),
      });

      // Act
      const result = await service.findMyReservations(mockUserId.toString());

      // Assert
      expect(result).toEqual(reservations);
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        userId: mockUserId,
      });
    });

    it('should return empty array if user has no reservations', async () => {
      // Arrange
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Act
      const result = await service.findMyReservations(mockUserId.toString());

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all reservations without filters', async () => {
      // Arrange
      const reservations = [createMockReservation()];

      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(reservations),
            }),
          }),
        }),
      });

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(reservations);
      expect(mockReservationModel.find).toHaveBeenCalledWith({});
    });

    it('should filter by eventId', async () => {
      // Arrange
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Act
      await service.findAll(mockEventId.toString());

      // Assert
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        eventId: mockEventId,
      });
    });

    it('should filter by userId', async () => {
      // Arrange
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Act
      await service.findAll(undefined, mockUserId.toString());

      // Assert
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        userId: mockUserId,
      });
    });

    it('should filter by status', async () => {
      // Arrange
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Act
      await service.findAll(undefined, undefined, ReservationStatus.CONFIRMED);

      // Assert
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        status: ReservationStatus.CONFIRMED,
      });
    });

    it('should filter by multiple criteria', async () => {
      // Arrange
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Act
      await service.findAll(
        mockEventId.toString(),
        mockUserId.toString(),
        ReservationStatus.PENDING,
      );

      // Assert
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        eventId: mockEventId,
        userId: mockUserId,
        status: ReservationStatus.PENDING,
      });
    });

    it('should throw BadRequestException for invalid eventId', async () => {
      // Act & Assert
      await expect(service.findAll('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll('invalid-id')).rejects.toThrow(
        'Invalid event ID',
      );
    });

    it('should throw BadRequestException for invalid userId', async () => {
      // Act & Assert
      await expect(service.findAll(undefined, 'invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll(undefined, 'invalid-id')).rejects.toThrow(
        'Invalid user ID',
      );
    });
  });

  describe('findOne', () => {
    const user = createMockUser();

    it('should return reservation for valid ID', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(reservation),
          }),
        }),
      });

      // Act
      const result = await service.findOne(mockReservationId.toString());

      // Assert
      expect(result).toEqual(reservation);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Invalid reservation ID',
      );
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // Arrange
      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.findOne(mockReservationId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin to access any reservation', async () => {
      // Arrange
      const adminUser = createMockUser({ role: UserRole.ADMIN });
      const reservation = createMockReservation({
        userId: new Types.ObjectId(), // Different user
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(reservation),
          }),
        }),
      });

      // Act
      const result = await service.findOne(
        mockReservationId.toString(),
        adminUser,
      );

      // Assert
      expect(result).toEqual(reservation);
    });

    it('should throw ForbiddenException if non-admin tries to access other user reservation', async () => {
      // Arrange
      const reservation = createMockReservation({
        userId: new Types.ObjectId(), // Different user
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(reservation),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.findOne(mockReservationId.toString(), user),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne(mockReservationId.toString(), user),
      ).rejects.toThrow('You do not have access to this reservation');
    });

    it('should allow user to access their own reservation', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(reservation),
          }),
        }),
      });

      // Act
      const result = await service.findOne(mockReservationId.toString(), user);

      // Assert
      expect(result).toEqual(reservation);
    });
  });

  describe('confirm', () => {
    const user = createMockUser({ role: UserRole.ADMIN });
    const ipAddress = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should successfully confirm a PENDING reservation', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act
      const result = await service.confirm(
        mockReservationId.toString(),
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(result).toBeDefined();
      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservation.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_confirmed',
          success: true,
        }),
      );
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(
        service.confirm('invalid-id', user, ipAddress, userAgent),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // Arrange
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.confirm(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is not PENDING', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.confirm(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow('Only PENDING reservations can be confirmed');
    });

    it('should throw BadRequestException if reservation is REFUSED', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.REFUSED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.confirm(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow('Only PENDING reservations can be confirmed');
    });

    it('should throw BadRequestException if reservation is CANCELED', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.CANCELED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.confirm(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow('Only PENDING reservations can be confirmed');
    });
  });

  describe('refuse', () => {
    const user = createMockUser({ role: UserRole.ADMIN });
    const ipAddress = '127.0.0.1';
    const userAgent = 'test-agent';
    const reason = 'Event capacity changed';

    it('should successfully refuse a PENDING reservation', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });
      mockEventsService.incrementSeatsAtomic.mockResolvedValue(
        createMockEvent(),
      );

      // Act
      const result = await service.refuse(
        mockReservationId.toString(),
        reason,
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(result).toBeDefined();
      expect(reservation.status).toBe(ReservationStatus.REFUSED);
      expect(reservation.cancelReason).toBe(reason);
      expect(reservation.save).toHaveBeenCalled();
      expect(mockEventsService.incrementSeatsAtomic).toHaveBeenCalledWith(
        mockEventId.toString(),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_refused',
          success: true,
        }),
      );
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(
        service.refuse('invalid-id', reason, user, ipAddress, userAgent),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // Arrange
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.refuse(
          mockReservationId.toString(),
          reason,
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is not PENDING', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.refuse(
          mockReservationId.toString(),
          reason,
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow('Only PENDING reservations can be refused');
    });

    it('should log error if incrementSeatsAtomic fails', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });
      mockEventsService.incrementSeatsAtomic.mockResolvedValue(null);

      // Act
      await service.refuse(
        mockReservationId.toString(),
        reason,
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_refused',
          success: false,
          errorMessage: 'Failed to increment seats after refusal',
        }),
      );
    });
  });

  describe('cancel', () => {
    const user = createMockUser();
    const ipAddress = '127.0.0.1';
    const userAgent = 'test-agent';
    const reason = 'User changed plans';

    it('should successfully cancel a PENDING reservation', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act
      const result = await service.cancel(
        mockReservationId.toString(),
        user,
        ipAddress,
        userAgent,
        reason,
      );

      // Assert
      expect(result).toBeDefined();
      expect(reservation.status).toBe(ReservationStatus.CANCELED);
      expect(reservation.cancelReason).toBe(reason);
      expect(reservation.canceledAt).toBeInstanceOf(Date);
      expect(reservation.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_canceled',
          success: true,
        }),
      );
    });

    it('should successfully cancel a CONFIRMED reservation and increment seats', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });
      mockEventsService.incrementSeatsAtomic.mockResolvedValue(
        createMockEvent(),
      );

      // Act
      const result = await service.cancel(
        mockReservationId.toString(),
        user,
        ipAddress,
        userAgent,
        reason,
      );

      // Assert
      expect(result).toBeDefined();
      expect(reservation.status).toBe(ReservationStatus.CANCELED);
      expect(mockEventsService.incrementSeatsAtomic).toHaveBeenCalledWith(
        mockEventId.toString(),
      );
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(
        service.cancel('invalid-id', user, ipAddress, userAgent),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // Arrange
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.cancel(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-admin tries to cancel other user reservation', async () => {
      // Arrange
      const reservation = createMockReservation({
        userId: new Types.ObjectId(), // Different user
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.cancel(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.cancel(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(
        'You do not have permission to cancel this reservation',
      );
    });

    it('should allow admin to cancel any reservation', async () => {
      // Arrange
      const adminUser = createMockUser({ role: UserRole.ADMIN });
      const reservation = createMockReservation({
        userId: new Types.ObjectId(), // Different user
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act
      const result = await service.cancel(
        mockReservationId.toString(),
        adminUser,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(result).toBeDefined();
      expect(reservation.status).toBe(ReservationStatus.CANCELED);
    });

    it('should throw BadRequestException if reservation is already CANCELED', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.CANCELED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.cancel(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(
        'Only PENDING or CONFIRMED reservations can be canceled',
      );
    });

    it('should throw BadRequestException if reservation is REFUSED', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.REFUSED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act & Assert
      await expect(
        service.cancel(
          mockReservationId.toString(),
          user,
          ipAddress,
          userAgent,
        ),
      ).rejects.toThrow(
        'Only PENDING or CONFIRMED reservations can be canceled',
      );
    });

    it('should not increment seats if canceling PENDING reservation', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.PENDING,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act
      await service.cancel(
        mockReservationId.toString(),
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(mockEventsService.incrementSeatsAtomic).not.toHaveBeenCalled();
    });

    it('should log error if incrementSeatsAtomic fails for CONFIRMED reservation', async () => {
      // Arrange
      const reservation = createMockReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });
      mockEventsService.incrementSeatsAtomic.mockResolvedValue(null);

      // Act
      await service.cancel(
        mockReservationId.toString(),
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reservation_canceled',
          success: false,
          errorMessage: 'Failed to increment seats after cancellation',
        }),
      );
    });

    it('should use default reason if none provided', async () => {
      // Arrange
      const reservation = createMockReservation();
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // Act
      await service.cancel(
        mockReservationId.toString(),
        user,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            reason: 'No reason provided',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('generateTicket', () => {
    const user = createMockUser();

    it('should successfully generate ticket for CONFIRMED reservation', async () => {
      // Arrange
      const populatedReservation = {
        _id: mockReservationId,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        eventId: {
          _id: mockEventId,
          title: 'Test Event',
          description: 'Test Description',
          date: new Date('2026-12-31T10:00:00Z'),
          location: 'Test Location',
        },
        userId: {
          _id: mockUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
        },
      };

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(populatedReservation),
            }),
          }),
        }),
      });

      const pdfBuffer = Buffer.from('pdf-content');
      mockPdfService.generateTicket.mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateTicket(
        mockReservationId.toString(),
        user,
      );

      // Assert
      expect(result).toEqual(pdfBuffer);
      expect(mockPdfService.generateTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          reservationId: mockReservationId.toString(),
          eventTitle: 'Test Event',
          participantName: 'John Doe',
          reservationStatus: 'CONFIRMÉ',
        }),
      );
    });

    it('should throw BadRequestException for invalid ID', async () => {
      // Act & Assert
      await expect(service.generateTicket('invalid-id', user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // Arrange
      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.generateTicket(mockReservationId.toString(), user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-admin tries to download other user ticket', async () => {
      // Arrange
      const populatedReservation = {
        _id: mockReservationId,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        eventId: {
          _id: mockEventId,
          title: 'Test Event',
          description: 'Test Description',
          date: new Date('2026-12-31T10:00:00Z'),
          location: 'Test Location',
        },
        userId: {
          _id: new Types.ObjectId(), // Different user
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
      };

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(populatedReservation),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.generateTicket(mockReservationId.toString(), user),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.generateTicket(mockReservationId.toString(), user),
      ).rejects.toThrow('You do not have permission to download this ticket');
    });

    it('should allow admin to download any ticket', async () => {
      // Arrange
      const adminUser = createMockUser({ role: UserRole.ADMIN });
      const populatedReservation = {
        _id: mockReservationId,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        eventId: {
          _id: mockEventId,
          title: 'Test Event',
          description: 'Test Description',
          date: new Date('2026-12-31T10:00:00Z'),
          location: 'Test Location',
        },
        userId: {
          _id: new Types.ObjectId(), // Different user
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
      };

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(populatedReservation),
            }),
          }),
        }),
      });

      const pdfBuffer = Buffer.from('pdf-content');
      mockPdfService.generateTicket.mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateTicket(
        mockReservationId.toString(),
        adminUser,
      );

      // Assert
      expect(result).toEqual(pdfBuffer);
    });

    it('should throw BadRequestException if reservation is not CONFIRMED', async () => {
      // Arrange
      const populatedReservation = {
        _id: mockReservationId,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
        eventId: {
          _id: mockEventId,
          title: 'Test Event',
          description: 'Test Description',
          date: new Date('2026-12-31T10:00:00Z'),
          location: 'Test Location',
        },
        userId: {
          _id: mockUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
        },
      };

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(populatedReservation),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.generateTicket(mockReservationId.toString(), user),
      ).rejects.toThrow('Ticket is only available for confirmed reservations');
    });

    it('should throw BadRequestException if reservation is CANCELED', async () => {
      // Arrange
      const populatedReservation = {
        _id: mockReservationId,
        status: ReservationStatus.CANCELED,
        createdAt: new Date(),
        eventId: {
          _id: mockEventId,
          title: 'Test Event',
          description: 'Test Description',
          date: new Date('2026-12-31T10:00:00Z'),
          location: 'Test Location',
        },
        userId: {
          _id: mockUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
        },
      };

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(populatedReservation),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.generateTicket(mockReservationId.toString(), user),
      ).rejects.toThrow('Ticket is only available for confirmed reservations');
    });
  });
});
