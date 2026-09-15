import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PhotosService } from './photos.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

@ApiTags('photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PhotosController {
  constructor(private readonly service: PhotosService) {}

  @Post('maintenance-logs/:id/photos')
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
  upload(
    @Param('id') logId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!file)
      throw new BadRequestException('A supported image file is required');
    return this.service.upload(logId, request.user.id, file);
  }

  @Delete('photos/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
