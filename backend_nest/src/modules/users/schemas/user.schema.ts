import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../../common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: false, select: false })
  password?: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.PARTICIPANT })
  role!: UserRole;

  @Prop({ select: false })
  refreshTokenHash?: string;

  // OAuth fields
  @Prop({ type: String, enum: ['local', 'google'], default: 'local' })
  provider!: string;

  @Prop()
  providerId?: string;

  @Prop()
  picture?: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });

// Virtual for fullName
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', {
  virtuals: true,
});
