import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendGroupMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;
}
