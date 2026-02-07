import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AuthRefreshTokenService } from './auth-refresh.service';
import { RefreshToken } from './schemas/refresh-token.schema';
import { PasswordResetToken } from './schemas/password-reset-token.schema';
import { UserRole } from '../common/enums/user-role.enum';
import { UserDocument } from '../modules/users/schemas/user.schema';

describe('AuthRefreshTokenService', () => {
  let service: AuthRefreshTokenService;

  const mockUserId = new Types.ObjectId();

  const createMockUser = (overrides = {}) => ({
    _id: mockUserId,
    email: 'test@example.com',
    role: UserRole.PARTICIPANT,
    ...overrides,
  });

  const mockRefreshTokenModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockPasswordResetTokenModel = {
    deleteMany: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string): string | undefined => {
      const config: Record<string, string> = {
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRATION: '7d',
        JWT_REFRESH_EXPIRATION_DAYS: '7',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRefreshTokenService,
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: getModelToken(PasswordResetToken.name),
          useValue: mockPasswordResetTokenModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthRefreshTokenService>(AuthRefreshTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRefreshToken', () => {
    it('should generate and store a new refresh token', async () => {
      // Arrange
      const user = createMockUser();
      const newToken = 'new-refresh-token';
      mockJwtService.sign.mockReturnValue(newToken);
      mockRefreshTokenModel.create.mockResolvedValue({});

      // Act
      const result = await service.generateRefreshToken(user as UserDocument);

      // Assert
      expect(result).toBe(newToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUserId.toString(),
          email: 'test@example.com',
          role: UserRole.PARTICIPANT,
        }),
        expect.objectContaining({
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        }),
      );
      expect(mockRefreshTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: newToken,
          userId: mockUserId,
          isRevoked: false,
        }),
      );
    });

    it('should revoke old token when rotating', async () => {
      // Arrange
      const user = createMockUser();
      const oldToken = 'old-refresh-token';
      const newToken = 'new-refresh-token';
      mockJwtService.sign.mockReturnValue(newToken);
      mockRefreshTokenModel.create.mockResolvedValue({});
      mockRefreshTokenModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Act
      await service.generateRefreshToken(user as UserDocument, oldToken);

      // Assert
      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token: oldToken },
        expect.objectContaining({
          isRevoked: true,
          replacedByToken: newToken,
        }),
      );
    });

    it('should throw error if JWT_REFRESH_SECRET is not defined', async () => {
      // Arrange
      const user = createMockUser();
      mockConfigService.get.mockReturnValue(undefined);

      // Act & Assert
      await expect(
        service.generateRefreshToken(user as UserDocument),
      ).rejects.toThrow('JWT_REFRESH_SECRET is not defined');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      // Arrange
      const user = createMockUser();
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      // Ensure config returns values
      mockConfigService.get.mockImplementation(
        (key: string): string | undefined => {
          const config: Record<string, string> = {
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_REFRESH_EXPIRATION: '7d',
            JWT_REFRESH_EXPIRATION_DAYS: '7',
          };
          return config[key];
        },
      );

      mockJwtService.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      mockRefreshTokenModel.create.mockResolvedValue({});

      // Act
      const result = await service.generateTokenPair(user as UserDocument);

      // Assert
      expect(result).toEqual({
        accessToken,
        refreshToken,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should rotate refresh token when provided', async () => {
      // Arrange
      const user = createMockUser();
      const oldRefreshToken = 'old-refresh-token';

      // Ensure config returns values
      mockConfigService.get.mockImplementation(
        (key: string): string | undefined => {
          const config: Record<string, string> = {
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_REFRESH_EXPIRATION: '7d',
            JWT_REFRESH_EXPIRATION_DAYS: '7',
          };
          return config[key];
        },
      );

      mockJwtService.sign.mockReturnValue('new-token');
      mockRefreshTokenModel.create.mockResolvedValue({});
      mockRefreshTokenModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Act
      await service.generateTokenPair(user as UserDocument, oldRefreshToken);

      // Assert
      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should return true for valid token', async () => {
      // Arrange
      const token = 'valid-token';
      const validToken = {
        token,
        userId: mockUserId,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(validToken),
      });

      // Act
      const result = await service.validateRefreshToken(
        token,
        mockUserId.toString(),
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRefreshTokenModel.findOne).toHaveBeenCalledWith({
        token,
        userId: mockUserId,
        isRevoked: false,
        expiresAt: { $gt: expect.any(Date) as Date },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.validateRefreshToken('invalid-token', mockUserId.toString()),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateRefreshToken('invalid-token', mockUserId.toString()),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      // Arrange
      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.validateRefreshToken('revoked-token', mockUserId.toString()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Arrange
      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.validateRefreshToken('expired-token', mockUserId.toString()),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      // Arrange
      const token = 'token-to-revoke';
      mockRefreshTokenModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Act
      await service.revokeRefreshToken(token);

      // Assert
      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token },
        expect.objectContaining({
          isRevoked: true,
          revokedAt: expect.any(Date) as Date,
        }),
      );
    });

    it('should revoke token with replacement', async () => {
      // Arrange
      const token = 'old-token';
      const replacedBy = 'new-token';
      mockRefreshTokenModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      // Act
      await service.revokeRefreshToken(token, replacedBy);

      // Assert
      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token },
        expect.objectContaining({
          isRevoked: true,
          replacedByToken: replacedBy,
        }),
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      // Arrange
      mockRefreshTokenModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      // Act
      await service.revokeAllUserTokens(mockUserId.toString());

      // Assert
      expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
        { userId: mockUserId.toString(), isRevoked: false },
        expect.objectContaining({
          isRevoked: true,
          revokedAt: expect.any(Date) as Date,
        }),
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      // Arrange
      mockRefreshTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      });

      // Act
      await service.cleanupExpiredTokens();

      // Assert
      expect(mockRefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        expiresAt: { $lt: expect.any(Date) as Date },
      });
    });
  });

  describe('cleanupOldRevokedTokens', () => {
    it('should delete old revoked tokens', async () => {
      // Arrange
      mockRefreshTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 10 }),
      });

      // Act
      await service.cleanupOldRevokedTokens();

      // Assert
      expect(mockRefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        isRevoked: true,
        revokedAt: { $lt: expect.any(Date) as Date },
      });
    });
  });

  describe('cleanupExpiredPasswordResetTokens', () => {
    it('should delete expired password reset tokens', async () => {
      // Arrange
      mockPasswordResetTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 3 }),
      });

      // Act
      await service.cleanupExpiredPasswordResetTokens();

      // Assert
      expect(mockPasswordResetTokenModel.deleteMany).toHaveBeenCalledWith({
        expiresAt: { $lt: expect.any(Date) as Date },
      });
    });
  });
});
