import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './auth.service';
import { AuthRefreshTokenService } from './auth-refresh.service';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import {
  PasswordResetToken,
  PasswordResetTokenSchema,
} from './schemas/password-reset-token.schema';
import { AuditLog, AuditLogSchema } from '../common/schemas/audit-log.schema';
import { AuditService } from '../common/services/audit.service';
import type { SignOptions } from 'jsonwebtoken';

@Module({
  imports: [
    // Import User, RefreshToken, PasswordResetToken, and AuditLog models
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    // Configure Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configure JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRATION',
          ) as SignOptions['expiresIn'],
        },
      }),
    }),

    // Import ScheduleModule for cron jobs
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRefreshTokenService,
    EmailService,
    AuditService,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    AuthRefreshTokenService,
    JwtStrategy,
    JwtRefreshStrategy,
    PassportModule,
  ],
})
export class AuthModule {}
