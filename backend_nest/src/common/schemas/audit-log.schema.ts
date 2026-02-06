import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  REFRESH_TOKEN = 'refresh_token',
  OAUTH_LOGIN = 'oauth_login',
  FAILED_LOGIN = 'failed_login',
  ACCOUNT_LOCKED = 'account_locked',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, enum: AuditAction, index: true })
  action!: AuditAction;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ index: true })
  email?: string;

  @Prop({ required: true })
  ipAddress!: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true })
  success!: boolean;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for performance
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ email: 1, createdAt: -1 });
AuditLogSchema.index({ success: 1, createdAt: -1 });

AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
