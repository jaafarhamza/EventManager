import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: nodemailer.Transporter;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'test-password',
        SMTP_FROM: 'noreply@example.com',
        SMTP_FROM_NAME: 'Test App',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    } as unknown as nodemailer.Transporter;

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetCode', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const firstName = 'John';
      const code = '123456';

      // Act
      await service.sendPasswordResetCode(email, firstName, code);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('Event Manager') as string,
          to: email,
          subject: expect.stringContaining('Password Reset') as string,
          html: expect.stringContaining(code) as string,
        }),
      );
    });

    it('should include user first name in email', async () => {
      // Arrange
      const email = 'user@example.com';
      const firstName = 'Jane';
      const code = '654321';

      // Act
      await service.sendPasswordResetCode(email, firstName, code);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(firstName) as string,
        }),
      );
    });

    it('should throw error if email sending fails', async () => {
      // Arrange
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP error'),
      );

      // Act & Assert
      await expect(
        service.sendPasswordResetCode('user@example.com', 'John', '123456'),
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('transporter configuration', () => {
    it('should create transporter with correct configuration', () => {
      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: undefined,
        port: undefined,
        secure: false,
        auth: {
          user: undefined,
          pass: undefined,
        },
      });
    });
  });
});
