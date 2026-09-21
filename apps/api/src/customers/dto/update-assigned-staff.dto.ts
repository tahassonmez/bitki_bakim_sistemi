import { IsArray, IsString } from 'class-validator';

export class UpdateAssignedStaffDto {
  @IsArray()
  @IsString({ each: true })
  staffIds!: string[];
}
