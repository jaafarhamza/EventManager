import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventStatus } from '../../../common/enums';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, minlength: 3, maxlength: 200, trim: true })
  title: string;

  @Prop({ required: true, minlength: 10, trim: true })
  description: string;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ required: true, min: 1, max: 1000 })
  capacity: number;

  @Prop({ required: true, min: 0 })
  availableSeats: number;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes
EventSchema.index({ status: 1, date: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ status: 1 });

// Ensure virtuals are included in JSON
EventSchema.set('toJSON', {
  virtuals: true,
});
