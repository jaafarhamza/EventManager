import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../../common/enums/event-status.enum';

export class EventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

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
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
