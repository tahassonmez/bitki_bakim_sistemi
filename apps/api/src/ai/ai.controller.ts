import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AiService } from './ai.service.js';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('identify-plant')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        callback(
          null,
          ['image/jpeg', 'image/png', 'image/heic', 'image/webp'].includes(
            file.mimetype,
          ),
        );
      },
    }),
  )
  identifyPlant(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('A supported image file is required');
    return this.aiService.identifyPlant(file);
  }
}
