import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBulkPlantsDto {
  @IsString()
  name!: string;

  @IsString()
  species!: string;

  @IsString()
  locationId!: string;

  @IsOptional()
  @IsString()
  potInfo?: string;

  @IsOptional()
  @IsString()
  sizeInfo?: string;

  @IsInt()
  @Min(1)
  careFrequencyDays!: number;

  @IsInt()
  @Min(1)
  @Max(500)
  quantity!: number;
}
