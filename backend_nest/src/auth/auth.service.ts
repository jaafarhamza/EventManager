import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthRefreshTokenService } from './auth-refresh.service';
import { EmailService } from './email.service';
import { AuditService } from '../common/services/audit.service';
import { AuditAction } from '../common/schemas/audit-log.schema';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from './schemas/password-reset-token.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PasswordResetToken.name)
    private passwordResetTokenModel: Model<PasswordResetTokenDocument>,
    private jwtService: JwtService,
    private authRefreshTokenService: AuthRefreshTokenService,
    private configService: ConfigService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.PARTICIPANT,
    });

    const savedUser = await newUser.save();

    // Generate token pair
    const tokens =
      await this.authRefreshTokenService.generateTokenPair(savedUser);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser._id.toString(),
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();

    if (!user) {
      // Log failed login attempt
      await this.auditService.log({
        action: AuditAction.FAILED_LOGIN,
        email,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: false,
        errorMessage: 'User not found',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user registered with OAuth
    if (user.provider !== 'local' || !user.password) {
      // Log failed login attempt
      await this.auditService.log({
        action: AuditAction.FAILED_LOGIN,
        userId: user._id.toString(),
        email: user.email,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: false,
        errorMessage: 'OAuth user attempted password login',
      });

      throw new UnauthorizedException('Please login with Google');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await this.auditService.log({
        action: AuditAction.FAILED_LOGIN,
        userId: user._id.toString(),
        email: user.email,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: false,
        errorMessage: 'Invalid password',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token pair
    const tokens = await this.authRefreshTokenService.generateTokenPair(user);

    // Log successful login
    await this.auditService.log({
      action: AuditAction.LOGIN,
      userId: user._id.toString(),
      email: user.email,
      ipAddress: 'unknown',
      userAgent: 'unknown',
      success: true,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Validate the refresh token
    await this.authRefreshTokenService.validateRefreshToken(
      refreshToken,
      userId,
    );

    // Get user
    const user = await this.validateUser(userId);

    // Generate new token pair and rotate refresh token
    const tokens = await this.authRefreshTokenService.generateTokenPair(
      user,
      refreshToken,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async verifyRefreshToken(userId: string, refreshToken: string) {
    // Validate the refresh token exists and is valid
    await this.authRefreshTokenService.validateRefreshToken(
      refreshToken,
      userId,
    );

    // Get user
    const user = await this.validateUser(userId);

    // Return user info and refresh token for the controller
    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.authRefreshTokenService.revokeAllUserTokens(userId);
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user with password
    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user registered with OAuth
    if (user.provider !== 'local' || !user.password) {
      throw new BadRequestException('Cannot change password for OAuth users');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
      10,
    );
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Revoke all refresh tokens for security
    await this.authRefreshTokenService.revokeAllUserTokens(userId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.userModel.findOne({ email }).exec();

    const successMessage =
      'If the email exists, a password reset code has been sent';

    if (!user) {
      return { message: successMessage };
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code before storing
    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // Code expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing reset codes for this user
    await this.passwordResetTokenModel
      .updateMany(
        { userId: user._id, isUsed: false },
        { isUsed: true, usedAt: new Date() },
      )
      .exec();

    // Store the hashed code
    await this.passwordResetTokenModel.create({
      code: hashedCode,
      userId: user._id,
      expiresAt,
      isUsed: false,
      attempts: 0,
    });

    // Send email with the code
    try {
      await this.emailService.sendPasswordResetCode(
        user.email,
        user.firstName,
        resetCode,
      );
    } catch {
      throw new BadRequestException(
        'Failed to send reset email. Please try again later.',
      );
    }

    return { message: successMessage };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;

    // Find user by email
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('Invalid code or email');
    }

    // Hash the code to compare with stored hash
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Find valid reset code
    const resetTokenDoc = await this.passwordResetTokenModel
      .findOne({
        code: hashedCode,
        userId: user._id,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!resetTokenDoc) {
      // Check if there's a code with too many attempts
      const existingCode = await this.passwordResetTokenModel
        .findOne({
          userId: user._id,
          isUsed: false,
          expiresAt: { $gt: new Date() },
        })
        .exec();

      if (existingCode) {
        existingCode.attempts += 1;

        // Lock after 5 failed attempts
        if (existingCode.attempts >= 5) {
          existingCode.isUsed = true;
          existingCode.usedAt = new Date();
          await existingCode.save();
          throw new BadRequestException(
            'Too many failed attempts. Please request a new code.',
          );
        }

        await existingCode.save();
      }

      throw new BadRequestException('Invalid or expired code');
    }

    // Hash new password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
      10,
    );
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Mark code as used
    resetTokenDoc.isUsed = true;
    resetTokenDoc.usedAt = new Date();
    await resetTokenDoc.save();

    // Revoke all refresh tokens for security
    await this.authRefreshTokenService.revokeAllUserTokens(user._id.toString());

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  async googleLogin(req: { user?: unknown }) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    const googleUser = req.user as {
      email: string;
      firstName: string;
      lastName: string;
      picture: string;
    };

    const { email, firstName, lastName, picture } = googleUser;

    // Check if user exists
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      // Create new user with Google OAuth
      user = await this.userModel.create({
        email,
        firstName,
        lastName,
        picture,
        provider: 'google',
        providerId: email,
        isEmailVerified: true,
        role: UserRole.PARTICIPANT,
      });
    } else {
      if (user.provider === 'local') {
        user.provider = 'google';
        user.providerId = email;
        user.picture = picture;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Generate token pair
    const tokens = await this.authRefreshTokenService.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        picture: user.picture,
        provider: user.provider,
      },
    };
  }
}
