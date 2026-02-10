import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './config/database.config';
import { AuditLog, AuditLogSchema } from './common/schemas/audit-log.schema';
import { AuditService } from './common/services/audit.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EventsModule } from './modules/events/events.module';
import { ReservationsModule } from './modules/reservations/reservations.module';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        dbName: configService.get<string>('database.name'),
        // Connection options for best practices
        retryWrites: true,
        w: 'majority',
        // Connection pool settings
        maxPoolSize: 10,
        minPoolSize: 2,
        // Timeout settings
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000, // 60 seconds
        limit: 200,
      },
    ]),

    // Audit Log Schema
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    AuthModule,

    EventsModule,

    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuditService],
})
export class AppModule {}
