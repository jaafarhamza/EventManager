import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { EventsModule } from '../events/events.module';
import { AuditService } from '../../common/services/audit.service';
import {
  AuditLog,
  AuditLogSchema,
} from '../../common/schemas/audit-log.schema';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    EventsModule,
  ],
  providers: [ReservationsService, AuditService, PdfService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {}
