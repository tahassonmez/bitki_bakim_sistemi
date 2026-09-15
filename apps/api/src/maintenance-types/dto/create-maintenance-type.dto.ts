import { IsString } from 'class-validator';

export class CreateMaintenanceTypeDto {
  @IsString()
  name!: string;
}
