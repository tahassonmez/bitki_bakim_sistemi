import { IsOptional, IsString } from 'class-validator';

export class UpdateMaintenanceTypeDto {
  @IsOptional()
  @IsString()
  name?: string;
}
