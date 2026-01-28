import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { PlaceType, Vehicle } from '../entities/challenge.entity';
import { Type } from 'class-transformer';

export class CreateChallengeDto {
  @ApiProperty({ maxLength: 25 })
  @IsString()
  @MaxLength(25)
  title: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  @Max(999)
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'Time duration in minutes' })
  @IsInt()
  @Type(() => Number)
  durationMinutes: number;

  @ApiProperty({ example: 'park', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  place: string;

  @ApiProperty({ enum: ['car', 'walking', 'plane', 'train', 'bicycle'] })
  @IsEnum(Vehicle)
  vehicle: Vehicle;

  @ApiProperty({ enum: ['indoor', 'outdoor', 'anywhere'] })
  @IsEnum(PlaceType)
  placeType: PlaceType;
}
