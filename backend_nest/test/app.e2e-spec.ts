import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { Connection } from 'mongoose';
import { ConnectionStates } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import type {
  AuthResponse,
  EventResponse,
  ReservationResponse,
} from './types/test-responses.interface';

describe('Event Manager API (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;

  // Test data storage
  let adminToken: string;
  let participantToken: string;
  let participantUserId: string;
  let eventId: string;
  let reservationId: string;

  // Helper function to add delay between tests to avoid rate limiting
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let server: import('http').Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    server = app.getHttpServer() as unknown as import('http').Server;

    // Get MongoDB connection for cleanup
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

    // Clean database before tests
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await mongoConnection.close();
    await app.close();
  });

  async function cleanDatabase() {
    const isConnected =
      mongoConnection.readyState === ConnectionStates.connected;
    if (isConnected) {
      const collections = mongoConnection.collections;
      for (const key in collections) {
        const collection = collections[key];
        if (collection) {
          await collection.deleteMany({});
        }
      }
    }
  }

  // ============================================================================
  // SCENARIO 1: Authentication & Authorization
  // ============================================================================

  describe('Authentication Flow', () => {
    it('should register a new admin user', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'Admin123!@#',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        })
        .expect(201);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe('admin@test.com');
      expect(body.user.role).toBe('ADMIN');
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');

      adminToken = body.accessToken;
    });

    it('should register a new participant user', async () => {
      await delay(100); // Small delay to avoid any potential race conditions

      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'participant@test.com',
          password: 'Participant123!@#',
          firstName: 'Participant',
          lastName: 'User',
          role: 'PARTICIPANT',
        })
        .expect(201);

      const body = response.body as AuthResponse;
      expect(body.user.email).toBe('participant@test.com');
      expect(body.user.role).toBe('PARTICIPANT');

      participantUserId = body.user.id;
      participantToken = body.accessToken;
    });

    it('should not register user with duplicate email', async () => {
      await request(server)
        .post('/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'Admin123!@#',
          firstName: 'Duplicate',
          lastName: 'User',
          role: 'ADMIN',
        })
        .expect(409);
    });

    it('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123!@#',
        })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user.email).toBe('admin@test.com');
    });

    it('should not login with invalid credentials', async () => {
      await request(server)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should not login with non-existent email', async () => {
      await request(server)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  // ============================================================================
  // SCENARIO 2: Event Management (Admin)
  // ============================================================================

  describe('Event Management', () => {
    it('should create an event as admin', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const response = await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tech Conference 2026',
          description:
            'A comprehensive technology conference covering latest trends in software development',
          date: futureDate.toISOString(),
          location: 'Paris Convention Center',
          capacity: 100,
        })
        .expect(201);

      const body = response.body as EventResponse;
      expect(body).toHaveProperty('id');
      expect(body.title).toBe('Tech Conference 2026');
      expect(body.status).toBe('DRAFT');
      expect(body.capacity).toBe(100);
      expect(body.availableSeats).toBe(100);

      eventId = body.id;
    });

    it('should not create event as participant', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          title: 'Unauthorized Event',
          description: 'This should fail',
          date: futureDate.toISOString(),
          location: 'Somewhere',
          capacity: 50,
        })
        .expect(403);
    });

    it('should not create event without authentication', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(server)
        .post('/events')
        .send({
          title: 'Unauthorized Event',
          description: 'This should fail',
          date: futureDate.toISOString(),
          location: 'Somewhere',
          capacity: 50,
        })
        .expect(401);
    });

    it('should get all events (DRAFT not visible to non-admin)', async () => {
      const response = await request(server).get('/events').expect(200);

      const body = response.body as EventResponse[];
      // DRAFT events should not be visible without authentication
      expect(body).toEqual([]);
    });

    it('should get all events including DRAFT as admin', async () => {
      const response = await request(server)
        .get('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as EventResponse[];
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].status).toBe('DRAFT');
    });

    it('should publish the event as admin', async () => {
      const response = await request(server)
        .patch(`/events/${eventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as EventResponse;
      expect(body.status).toBe('PUBLISHED');
    });

    it('should not publish already published event', async () => {
      await request(server)
        .patch(`/events/${eventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should get published event without authentication', async () => {
      const response = await request(server)
        .get(`/events/${eventId}`)
        .expect(200);

      const body = response.body as EventResponse;
      expect(body.id).toBe(eventId);
      expect(body.status).toBe('PUBLISHED');
    });

    it('should update event as admin', async () => {
      const response = await request(server)
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tech Conference 2026 - Updated',
          capacity: 150,
        })
        .expect(200);

      const body = response.body as EventResponse;
      expect(body.title).toBe('Tech Conference 2026 - Updated');
      expect(body.capacity).toBe(150);
    });

    it('should not update event as participant', async () => {
      await request(server)
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          title: 'Hacked Title',
        })
        .expect(403);
    });
  });

  // ============================================================================
  // SCENARIO 3: Reservation Flow
  // ============================================================================

  describe('Reservation Management', () => {
    it('should create a reservation as participant', async () => {
      const response = await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          eventId: eventId,
        })
        .expect(201);

      const body = response.body as ReservationResponse;
      expect(body).toHaveProperty('id');
      expect(body.status).toBe('PENDING');
      expect(body.eventId).toBe(eventId);
      expect(body.userId).toBe(participantUserId);

      reservationId = body.id;
    });

    it('should not create duplicate reservation for same event', async () => {
      await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          eventId: eventId,
        })
        .expect(409);
    });

    it('should not create reservation without authentication', async () => {
      await request(server)
        .post('/reservations')
        .send({
          eventId: eventId,
        })
        .expect(401);
    });

    it('should get participant reservations', async () => {
      const response = await request(server)
        .get('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      const body = response.body as ReservationResponse[];
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].id).toBe(reservationId);
    });

    it('should get all reservations as admin', async () => {
      const response = await request(server)
        .get('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ReservationResponse[];
      expect(body.length).toBeGreaterThan(0);
    });

    it('should confirm reservation as admin', async () => {
      const response = await request(server)
        .patch(`/reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ReservationResponse;
      expect(body.status).toBe('CONFIRMED');
    });

    it('should not confirm already confirmed reservation', async () => {
      await request(server)
        .patch(`/reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should not confirm reservation as participant', async () => {
      await request(server)
        .patch(`/reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);
    });

    it('should download PDF ticket for confirmed reservation', async () => {
      const response = await request(server)
        .get(`/reservations/${reservationId}/ticket`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/pdf/);
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toBeDefined();
    });

    it('should not download ticket without authentication', async () => {
      await request(server)
        .get(`/reservations/${reservationId}/ticket`)
        .expect(401);
    });
  });

  // ============================================================================
  // SCENARIO 4: Business Rules & Edge Cases
  // ============================================================================

  describe('Business Rules', () => {
    let smallEventId: string;
    let secondParticipantToken: string;

    it('should create event with limited capacity', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const response = await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Small Workshop',
          description: 'Limited seats workshop',
          date: futureDate.toISOString(),
          location: 'Small Room',
          capacity: 1,
        })
        .expect(201);

      const body = response.body as EventResponse;
      smallEventId = body.id;

      // Publish the event
      await request(server)
        .patch(`/events/${smallEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should register second participant', async () => {
      await delay(100); // Delay to avoid rate limiting

      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'participant2@test.com',
          password: 'Participant123!@#',
          firstName: 'Second',
          lastName: 'Participant',
          role: 'PARTICIPANT',
        })
        .expect(201);

      const body = response.body as AuthResponse;
      secondParticipantToken = body.accessToken;
    });

    it('should create reservation for small event', async () => {
      await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${secondParticipantToken}`)
        .send({
          eventId: smallEventId,
        })
        .expect(201);
    });

    it('should not create reservation when event is full', async () => {
      await delay(100); // Delay to avoid rate limiting

      // Register third participant
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'participant3@test.com',
          password: 'Participant123!@#',
          firstName: 'Third',
          lastName: 'Participant',
          role: 'PARTICIPANT',
        })
        .expect(201);

      const body = response.body as AuthResponse;
      const thirdParticipantToken = body.accessToken;

      // Try to reserve full event
      await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${thirdParticipantToken}`)
        .send({
          eventId: smallEventId,
        })
        .expect(400);
    });

    it('should not create reservation for non-existent event', async () => {
      await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          eventId: '507f1f77bcf86cd799439011', // Valid ObjectId but doesn't exist
        })
        .expect(404);
    });

    it('should cancel event and handle reservations', async () => {
      const response = await request(server)
        .patch(`/events/${eventId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as EventResponse;
      expect(body.status).toBe('CANCELED');
    });

    it('should not create reservation for canceled event', async () => {
      await delay(100); // Delay to avoid rate limiting

      // Register fourth participant
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'participant4@test.com',
          password: 'Participant123!@#',
          firstName: 'Fourth',
          lastName: 'Participant',
          role: 'PARTICIPANT',
        })
        .expect(201);

      const body = response.body as AuthResponse;
      const fourthParticipantToken = body.accessToken;

      // Try to create reservation for canceled event
      // Expect 403 because non-admin users cannot access CANCELED events
      await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${fourthParticipantToken}`)
        .send({
          eventId: eventId,
        })
        .expect(403);
    });

    it('should not update canceled event', async () => {
      await request(server)
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Should Not Update',
        })
        .expect(400);
    });
  });

  // ============================================================================
  // SCENARIO 5: Reservation Cancellation
  // ============================================================================

  describe('Reservation Cancellation', () => {
    let cancelTestEventId: string;
    let cancelTestReservationId: string;

    it('should create and publish event for cancellation test', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const createResponse = await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Cancellation Test Event',
          description: 'Event for testing cancellation',
          date: futureDate.toISOString(),
          location: 'Test Location',
          capacity: 50,
        })
        .expect(201);

      const body = createResponse.body as EventResponse;
      cancelTestEventId = body.id;

      await request(server)
        .patch(`/events/${cancelTestEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should create and confirm reservation for cancellation', async () => {
      const createResponse = await request(server)
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          eventId: cancelTestEventId,
        })
        .expect(201);

      const body = createResponse.body as ReservationResponse;
      cancelTestReservationId = body.id;

      await request(server)
        .patch(`/reservations/${cancelTestReservationId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should cancel own reservation as participant', async () => {
      const response = await request(server)
        .delete(`/reservations/${cancelTestReservationId}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          reason: 'Cannot attend anymore',
        })
        .expect(200);

      const body = response.body as ReservationResponse;
      expect(body.status).toBe('CANCELED');
    });

    it('should not download ticket for canceled reservation', async () => {
      await request(server)
        .get(`/reservations/${cancelTestReservationId}/ticket`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(400);
    });
  });

  // ============================================================================
  // SCENARIO 6: Validation Tests
  // ============================================================================

  describe('Input Validation', () => {
    it('should reject invalid email format', async () => {
      await delay(100); // Delay to avoid rate limiting

      await request(server)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARTICIPANT',
        })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await delay(100); // Delay to avoid rate limiting

      await request(server)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARTICIPANT',
        })
        .expect(400);
    });

    it('should reject event with past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Past Event',
          description: 'This should fail',
          date: pastDate.toISOString(),
          location: 'Somewhere',
          capacity: 50,
        })
        .expect(400);
    });

    it('should reject event with invalid capacity', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Capacity Event',
          description: 'This should fail',
          date: futureDate.toISOString(),
          location: 'Somewhere',
          capacity: 0,
        })
        .expect(400);
    });

    it('should reject event with missing required fields', async () => {
      await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Incomplete Event',
        })
        .expect(400);
    });
  });
});
