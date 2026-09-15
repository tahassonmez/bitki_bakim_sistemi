import { PlantStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePlantStatusDto {
  @IsEnum(PlantStatus)
  status!: PlantStatus;
}
