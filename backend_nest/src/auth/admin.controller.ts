import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import * as currentUserDecorator from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { PdfService } from '../common/services/pdf.service';
import { AuditService } from '../common/services/audit.service';
import { AuditAction } from '../common/schemas/audit-log.schema';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
    private readonly pdfService: PdfService,
    private readonly auditService: AuditService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getAllUsers(
    @currentUserDecorator.CurrentUser() admin: currentUserDecorator.AdminUser,
  ) {
    return {
      message: 'Admin access granted',
      adminEmail: admin.email,
      users: [],
    };
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  changeUserRole(
    @Param('id') userId: string,
    @Body('role') role: UserRole,
    @currentUserDecorator.CurrentUser() admin: currentUserDecorator.AdminUser,
  ) {
    return {
      message: 'User role updated',
      adminEmail: admin.email,
      userId,
      newRole: role,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getStats(
    @currentUserDecorator.CurrentUser() admin: currentUserDecorator.AdminUser,
  ) {
    return {
      message: 'Admin statistics',
      adminEmail: admin.email,
      stats: {
        totalUsers: 0,
        totalEvents: 0,
        totalReservations: 0,
      },
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics with events and reservations data',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getDashboard(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('events/:id/stats/pdf')
  @ApiOperation({ summary: 'Download event statistics as PDF (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'PDF file with event statistics',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async downloadEventStatsPdf(
    @Param('id') eventId: string,
    @Res() res: Response,
    @currentUserDecorator.CurrentUser() admin: currentUserDecorator.AdminUser,
  ): Promise<void> {
    try {
      // Get event statistics
      const eventStats = await this.adminService.getEventStats(eventId);

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateEventStats(eventStats);

      // Log audit
      await this.auditService.log({
        action: AuditAction.DOWNLOAD_EVENT_STATS_PDF,
        userId: admin.id,
        ipAddress: '0.0.0.0',
        success: true,
        metadata: {
          eventId,
          eventTitle: eventStats.eventTitle,
        },
      });

      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=stats-event-${eventId}-${Date.now()}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found') {
        throw new NotFoundException('Event not found');
      }
      throw error;
    }
  }
}
