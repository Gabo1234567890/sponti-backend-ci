import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PlaceType, Vehicle } from '../entities/challenge.entity';
import { Transform } from 'class-transformer';

export class ListChallengesQueryDto {
  @IsOptional()
  @IsInt()
  minPrice?: number;

  @IsOptional()
  @IsInt()
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  minDuration?: number;

  @IsOptional()
  @IsInt()
  maxDuration?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsEnum(Vehicle, { each: true })
  vehicles?: Array<Vehicle>;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsEnum(PlaceType, { each: true })
  placeTypes?: Array<PlaceType>;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  perPage?: number;
}
