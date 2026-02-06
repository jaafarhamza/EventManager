import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { RefuseReservationDto } from './dto/refuse-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(UserRole.PARTICIPANT, UserRole.ADMIN)
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.reservationsService.create(
      createReservationDto,
      user,
      req.ip || 'unknown',
      req.headers['user-agent'],
    );
  }

  @Get()
  async findAll(
    @Query('eventId') eventId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: ReservationStatus,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    // If user is not admin, filter by their own userId
    if (user && user.role !== UserRole.ADMIN) {
      return this.reservationsService.findAll(eventId, user.id, status);
    }

    return this.reservationsService.findAll(eventId, userId, status);
  }

  @Get(':id')
  @Roles(UserRole.PARTICIPANT, UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.findOne(id, user);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN)
  async confirm(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.reservationsService.confirm(
      id,
      user,
      req.ip || 'unknown',
      req.headers['user-agent'],
    );
  }

  @Patch(':id/refuse')
  @Roles(UserRole.ADMIN)
  async refuse(
    @Param('id') id: string,
    @Body() refuseDto: RefuseReservationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.reservationsService.refuse(
      id,
      refuseDto.reason,
      user,
      req.ip || 'unknown',
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @Roles(UserRole.PARTICIPANT, UserRole.ADMIN)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() cancelDto: CancelReservationDto,
    @Req() req: Request,
  ) {
    return this.reservationsService.cancel(
      id,
      user,
      req.ip || 'unknown',
      req.headers['user-agent'],
      cancelDto.reason,
    );
  }
}
