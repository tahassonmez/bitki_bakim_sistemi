import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlantDto {
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
}
