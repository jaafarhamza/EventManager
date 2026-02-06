import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
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

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly authService: AuthService) {}

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
}
