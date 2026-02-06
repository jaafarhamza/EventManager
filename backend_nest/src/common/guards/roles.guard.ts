import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminUser } from '../decorators/current-user.decorator';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuditService } from '../services/audit.service';
import { Request } from 'express';
import { AuditAction } from '../../common/schemas/audit-log.schema';

interface AuthenticatedRequest extends Request {
  user: AdminUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);

    if (!hasRole) {
      await this.auditService.log({
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        userId: user.id,
        email: user.email,
        ipAddress: request.ip ?? '',
        userAgent: request.headers['user-agent'] ?? 'unknown',
        success: false,
        errorMessage: `User with role ${user.role} attempted to access endpoint requiring roles: ${requiredRoles.join(
          ', ',
        )}`,
        metadata: {
          endpoint: request.url,
          method: request.method,
          requiredRoles,
          userRole: user.role,
        },
      });

      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
