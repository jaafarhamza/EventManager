import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;

@Schema({ timestamps: true })
export class PasswordResetToken {
  @Prop({ required: true })
  code!: string; // 6-digit code (hashed)

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  isUsed!: boolean;

  @Prop()
  usedAt?: Date;

  @Prop({ default: 0 })
  attempts!: number; // Track failed attempts
}

export const PasswordResetTokenSchema =
  SchemaFactory.createForClass(PasswordResetToken);

// Indexes for performance
PasswordResetTokenSchema.index({ code: 1 });
PasswordResetTokenSchema.index({ userId: 1, isUsed: 1 });
PasswordResetTokenSchema.index({ expiresAt: 1 }); // For cleanup cron job
