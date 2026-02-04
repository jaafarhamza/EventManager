import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReservationStatus } from '../../../common/enums';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Prop({ type: Date, default: null })
  canceledAt: Date | null;

  @Prop({ type: String, default: null })
  cancelReason: string | null;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Indexes
ReservationSchema.index({ userId: 1, eventId: 1 });
ReservationSchema.index({ eventId: 1, status: 1 });
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ createdAt: -1 });

// index to prevent duplicate active reservations
ReservationSchema.index(
  { userId: 1, eventId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
  },
);

// Ensure virtuals are included in JSON
ReservationSchema.set('toJSON', {
  virtuals: true,
});
