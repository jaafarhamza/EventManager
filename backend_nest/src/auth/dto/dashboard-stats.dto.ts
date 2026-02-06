import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../common/enums';

export class EventsCountDto {
  @ApiProperty({ example: 5 })
  draft!: number;

  @ApiProperty({ example: 15 })
  published!: number;

  @ApiProperty({ example: 2 })
  canceled!: number;

  @ApiProperty({ example: 22 })
  total!: number;
}

export class ReservationsCountDto {
  @ApiProperty({ example: 10 })
  pending!: number;

  @ApiProperty({ example: 45 })
  confirmed!: number;

  @ApiProperty({ example: 5 })
  refused!: number;

  @ApiProperty({ example: 3 })
  canceled!: number;

  @ApiProperty({ example: 63 })
  total!: number;
}

export class PopularEventDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  availableSeats!: number;

  @ApiProperty({ enum: EventStatus })
  status!: EventStatus;

  @ApiProperty()
  reservationsCount!: number;

  @ApiProperty({ example: 75.5 })
  fillRate!: number;
}

export class UpcomingEventDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  availableSeats!: number;

  @ApiProperty({ enum: EventStatus })
  status!: EventStatus;

  @ApiProperty()
  reservationsCount!: number;
}

export class DashboardStatsDto {
  @ApiProperty({ type: EventsCountDto })
  eventsCount!: EventsCountDto;

  @ApiProperty({ example: 68.5, description: 'Average fill rate percentage' })
  averageFillRate!: number;

  @ApiProperty({ type: ReservationsCountDto })
  reservationsCount!: ReservationsCountDto;

  @ApiProperty({ type: [UpcomingEventDto] })
  upcomingEvents!: UpcomingEventDto[];

  @ApiProperty({ type: [PopularEventDto] })
  popularEvents!: PopularEventDto[];
}
