import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event title',
    example: 'Tech Conference 2026',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Annual technology conference with industry leaders',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @ApiProperty({
    description: 'Event date and time (ISO 8601 format)',
    example: '2026-03-15T14:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({
    description: 'Event location',
    example: 'Paris Convention Center',
  })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({
    description: 'Maximum capacity',
    example: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  capacity!: number;
}
