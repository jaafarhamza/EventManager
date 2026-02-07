import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { User } from '../modules/users/schemas/user.schema';
import { PasswordResetToken } from './schemas/password-reset-token.schema';
import { AuthRefreshTokenService } from './auth-refresh.service';
import { EmailService } from './email.service';
import { AuditService } from '../common/services/audit.service';
import { UserRole } from '../common/enums/user-role.enum';

// Mock external modules
jest.mock('bcrypt');
jest.mock('crypto');

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserId = new Types.ObjectId();
  const mockEmail = 'test@example.com';

  // Helper to create mock user
  const createMockUser = (overrides = {}) => ({
    _id: mockUserId,
    email: mockEmail,
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.PARTICIPANT,
    provider: 'local',
    isEmailVerified: false,
    ...overrides,
  });

  // Mock implementations
  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  };

  const mockPasswordResetTokenModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockAuthRefreshTokenService = {
    generateTokenPair: jest.fn(),
    validateRefreshToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetCode: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'BCRYPT_SALT_ROUNDS') return '10';
      return null;
    }),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup bcrypt mocks using jest.spyOn
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    // Setup crypto mocks
    const mockHashInstance = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashedCode123'),
    };
    jest
      .spyOn(crypto, 'createHash')
      .mockReturnValue(mockHashInstance as unknown as crypto.Hash);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
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
          provide: AuthRefreshTokenService,
          useValue: mockAuthRefreshTokenService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.PARTICIPANT,
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const userId = new Types.ObjectId();
      const savedUser = {
        _id: userId,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
        save: jest.fn().mockResolvedValue({
          _id: userId,
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: registerDto.role,
        }),
      };

      // Create a mock constructor that returns savedUser
      const MockUserConstructor = jest.fn().mockImplementation(() => savedUser);
      // Copy all methods from mockUserModel to the constructor
      Object.assign(MockUserConstructor, mockUserModel);

      // Replace the userModel in service with proper typing
      Object.defineProperty(service, 'userModel', {
        value: MockUserConstructor,
        writable: true,
      });

      mockAuthRefreshTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          id: userId.toString(),
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        }) as Record<string, unknown>,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(savedUser.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(createMockUser()),
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: mockEmail,
      password: 'Password123!',
    };

    it('should return tokens for valid credentials', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockAuthRefreshTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          email: mockEmail,
        }) as Record<string, unknown>,
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          success: true,
        }),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'failed_login',
          errorMessage: 'User not found',
        }),
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'failed_login',
          errorMessage: 'Invalid password',
        }),
      );
    });

    it('should throw UnauthorizedException for OAuth user', async () => {
      // Arrange
      const googleUser = createMockUser({ provider: 'google', password: null });
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(googleUser),
        }),
      });

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        'Please login with Google',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid ID', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      // Act
      const result = await service.validateUser(mockUserId.toString());

      // Assert
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException for invalid ID', async () => {
      // Arrange
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.validateUser('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens', async () => {
      // Arrange
      const user = createMockUser();
      mockAuthRefreshTokenService.validateRefreshToken.mockResolvedValue(true);
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      mockAuthRefreshTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      // Act
      const result = await service.refreshTokens(
        mockUserId.toString(),
        'old-refresh',
      );

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return user info and refresh token for valid token', async () => {
      // Arrange
      const user = createMockUser();
      mockAuthRefreshTokenService.validateRefreshToken.mockResolvedValue(true);
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      // Act
      const result = await service.verifyRefreshToken(
        mockUserId.toString(),
        'valid-refresh-token',
      );

      // Assert
      expect(result).toEqual({
        userId: mockUserId.toString(),
        email: mockEmail,
        role: UserRole.PARTICIPANT,
        refreshToken: 'valid-refresh-token',
      });
      expect(
        mockAuthRefreshTokenService.validateRefreshToken,
      ).toHaveBeenCalledWith('valid-refresh-token', mockUserId.toString());
    });

    it('should throw UnauthorizedException if token validation fails', async () => {
      // Arrange
      mockAuthRefreshTokenService.validateRefreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      // Act & Assert
      await expect(
        service.verifyRefreshToken(mockUserId.toString(), 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      mockAuthRefreshTokenService.validateRefreshToken.mockResolvedValue(true);
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(
        service.verifyRefreshToken(mockUserId.toString(), 'valid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke all tokens', async () => {
      // Arrange
      mockAuthRefreshTokenService.revokeAllUserTokens.mockResolvedValue(
        undefined,
      );

      // Act
      const result = await service.logout(mockUserId.toString());

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(
        mockAuthRefreshTokenService.revokeAllUserTokens,
      ).toHaveBeenCalledWith(mockUserId.toString());
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    };

    it('should successfully change password', async () => {
      // Arrange
      const user = {
        ...createMockUser(),
        save: jest.fn().mockResolvedValue(this),
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // current password correct
        .mockResolvedValueOnce(false); // new password different

      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      mockAuthRefreshTokenService.revokeAllUserTokens.mockResolvedValue(
        undefined,
      );

      // Act
      const result = await service.changePassword(
        mockUserId.toString(),
        changePasswordDto,
      );

      // Assert
      expect(result.message).toContain('Password changed successfully');
      expect(user.save).toHaveBeenCalled();
      expect(
        mockAuthRefreshTokenService.revokeAllUserTokens,
      ).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(
        service.changePassword(mockUserId.toString(), changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for OAuth users', async () => {
      // Arrange
      const googleUser = createMockUser({ provider: 'google', password: null });
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(googleUser),
        }),
      });

      // Act & Assert
      await expect(
        service.changePassword(mockUserId.toString(), changePasswordDto),
      ).rejects.toThrow('Cannot change password for OAuth users');
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.changePassword(mockUserId.toString(), changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw BadRequestException if new password same as current', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // both comparisons return true

      // Act & Assert
      await expect(
        service.changePassword(mockUserId.toString(), changePasswordDto),
      ).rejects.toThrow('New password must be different from current password');
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = { email: mockEmail };

    it('should send reset code for existing user', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockPasswordResetTokenModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      mockPasswordResetTokenModel.create.mockResolvedValue({});
      mockEmailService.sendPasswordResetCode.mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.message).toContain('password reset code has been sent');
      expect(mockPasswordResetTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'hashedCode123',
          userId: mockUserId,
          isUsed: false,
        }),
      );
      expect(mockEmailService.sendPasswordResetCode).toHaveBeenCalled();
    });

    it('should return success message even if user not found', async () => {
      // Arrange
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.message).toContain('password reset code has been sent');
      expect(mockPasswordResetTokenModel.create).not.toHaveBeenCalled();
    });

    it('should invalidate existing reset codes', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockPasswordResetTokenModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      mockPasswordResetTokenModel.create.mockResolvedValue({});
      mockEmailService.sendPasswordResetCode.mockResolvedValue(undefined);

      // Act
      await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(mockPasswordResetTokenModel.updateMany).toHaveBeenCalledWith(
        { userId: mockUserId, isUsed: false },
        expect.objectContaining({ isUsed: true }),
      );
    });

    it('should throw BadRequestException if email fails', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockPasswordResetTokenModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      mockPasswordResetTokenModel.create.mockResolvedValue({});
      mockEmailService.sendPasswordResetCode.mockRejectedValue(
        new Error('Email error'),
      );

      // Act & Assert
      await expect(service.forgotPassword(forgotPasswordDto)).rejects.toThrow(
        'Failed to send reset email',
      );
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      email: mockEmail,
      code: '123456',
      newPassword: 'NewPass123!',
    };

    it('should successfully reset password', async () => {
      // Arrange
      const user = {
        ...createMockUser(),
        save: jest.fn().mockResolvedValue(this),
      };

      const resetToken = {
        code: 'hashedCode123',
        userId: mockUserId,
        isUsed: false,
        attempts: 0,
        save: jest.fn().mockResolvedValue(this),
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockPasswordResetTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(resetToken),
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      mockAuthRefreshTokenService.revokeAllUserTokens.mockResolvedValue(
        undefined,
      );

      // Act
      const result = await service.resetPassword(resetPasswordDto);

      // Assert
      expect(result.message).toContain('Password reset successfully');
      expect(user.save).toHaveBeenCalled();
      expect(resetToken.isUsed).toBe(true);
      expect(resetToken.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found', async () => {
      // Arrange
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid code or email',
      );
    });

    it('should throw BadRequestException if code invalid', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockPasswordResetTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired code',
      );
    });

    it('should lock after 5 failed attempts', async () => {
      // Arrange
      const user = createMockUser();
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const existingToken = {
        attempts: 4,
        isUsed: false,
        save: jest.fn().mockResolvedValue(this),
      };

      mockPasswordResetTokenModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(existingToken),
        });

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Too many failed attempts',
      );
      expect(existingToken.isUsed).toBe(true);
    });
  });

  describe('googleLogin', () => {
    const googleUserData = {
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      picture: 'https://example.com/pic.jpg',
    };

    it('should create new user for first-time Google login', async () => {
      // Arrange
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const newUser = {
        _id: new Types.ObjectId(),
        ...googleUserData,
        provider: 'google',
        role: UserRole.PARTICIPANT,
      };

      mockUserModel.create.mockResolvedValue(newUser);

      mockAuthRefreshTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await service.googleLogin({ user: googleUserData });

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          email: googleUserData.email,
          provider: 'google',
        }) as Record<string, unknown>,
      });
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: googleUserData.email,
          provider: 'google',
          isEmailVerified: true,
        }),
      );
    });

    it('should return existing Google user', async () => {
      // Arrange
      const existingUser = {
        ...createMockUser({ email: googleUserData.email, provider: 'google' }),
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      mockAuthRefreshTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await service.googleLogin({ user: googleUserData });

      // Assert
      expect(result.user.email).toBe(googleUserData.email);
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should convert local user to Google user', async () => {
      // Arrange
      const localUser = {
        ...createMockUser({ email: googleUserData.email, provider: 'local' }),
        save: jest.fn().mockResolvedValue(this),
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(localUser),
      });

      mockAuthRefreshTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      await service.googleLogin({ user: googleUserData });

      // Assert
      expect(localUser.provider).toBe('google');
      expect(localUser.isEmailVerified).toBe(true);
      expect(localUser.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no user data', async () => {
      // Act & Assert
      await expect(service.googleLogin({ user: undefined })).rejects.toThrow(
        'No user from Google',
      );
    });
  });
});
