import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  receiverId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;
}
