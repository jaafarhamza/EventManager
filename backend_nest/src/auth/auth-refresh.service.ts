import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from './schemas/password-reset-token.schema';
import { UserDocument } from '../modules/users/schemas/user.schema';
import type { SignOptions } from 'jsonwebtoken';

@Injectable()
export class AuthRefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(PasswordResetToken.name)
    private passwordResetTokenModel: Model<PasswordResetTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateRefreshToken(
    user: UserDocument,
    currentRefreshToken?: string,
  ): Promise<string> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    const expiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
    ) || '7d') as SignOptions['expiresIn'];

    const newRefreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn,
    });

    // Calculate expiration date
    const expirationDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION_DAYS') || '7',
      10,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // If there's a current refresh token, revoke it (rotation)
    if (currentRefreshToken) {
      await this.revokeRefreshToken(currentRefreshToken, newRefreshToken);
    }

    // Store the new refresh token
    await this.refreshTokenModel.create({
      token: newRefreshToken,
      userId: user._id,
      expiresAt,
      isRevoked: false,
    });

    return newRefreshToken;
  }

  async generateTokenPair(
    user: UserDocument,
    currentRefreshToken?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessPayload);

    const refreshToken = await this.generateRefreshToken(
      user,
      currentRefreshToken,
    );

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string, userId: string): Promise<boolean> {
    // Convert userId string to ObjectId for MongoDB query
    const userObjectId = new Types.ObjectId(userId);

    const refreshToken = await this.refreshTokenModel
      .findOne({
        token,
        userId: userObjectId,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return true;
  }

  async revokeRefreshToken(
    token: string,
    replacedByToken?: string,
  ): Promise<void> {
    await this.refreshTokenModel
      .updateOne(
        { token },
        {
          isRevoked: true,
          revokedAt: new Date(),
          replacedByToken,
        },
      )
      .exec();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany(
        { userId, isRevoked: false },
        {
          isRevoked: true,
          revokedAt: new Date(),
        },
      )
      .exec();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenModel
      .deleteMany({
        expiresAt: { $lt: new Date() },
      })
      .exec();
  }

  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldRevokedTokens(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.refreshTokenModel
      .deleteMany({
        isRevoked: true,
        revokedAt: { $lt: thirtyDaysAgo },
      })
      .exec();
  }

  /**
   * Cron job to clean up expired password reset tokens
   * Runs daily at 4 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupExpiredPasswordResetTokens(): Promise<void> {
    await this.passwordResetTokenModel
      .deleteMany({
        expiresAt: { $lt: new Date() },
      })
      .exec();
  }
}
