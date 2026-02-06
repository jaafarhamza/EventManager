import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
} from '../schemas/audit-log.schema';

interface AuditLogData {
  action: AuditAction;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.auditLogModel.create(data);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getUserLogs(userId: string, limit = 50) {
    return this.auditLogModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getFailedLoginAttempts(email: string, minutes = 15) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return this.auditLogModel
      .countDocuments({
        email,
        action: AuditAction.FAILED_LOGIN,
        success: false,
        createdAt: { $gte: since },
      })
      .exec();
  }

  async getSuspiciousActivity(hours = 24) {
    const since = new Date(Date.now() - hours * 3600 * 1000);

    return this.auditLogModel
      .aggregate([
        {
          $match: {
            success: false,
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: '$email',
            failedAttempts: { $sum: 1 },
            actions: { $push: '$action' },
          },
        },
        {
          $match: {
            failedAttempts: { $gte: 5 },
          },
        },
        {
          $sort: { failedAttempts: -1 },
        },
      ])
      .exec();
  }

  async cleanupOldLogs(days = 90) {
    const cutoffDate = new Date(Date.now() - days * 24 * 3600 * 1000);

    const result = await this.auditLogModel
      .deleteMany({
        createdAt: { $lt: cutoffDate },
      })
      .exec();

    return result.deletedCount;
  }
}
