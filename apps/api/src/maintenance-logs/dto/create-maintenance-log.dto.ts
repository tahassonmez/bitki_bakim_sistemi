import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class MaintenanceProductDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityUsed?: number;
}

export class CreateMaintenanceLogDto {
  @IsDateString()
  date!: string;

  @IsString()
  staffId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  typeIds!: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceProductDto)
  products?: MaintenanceProductDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
