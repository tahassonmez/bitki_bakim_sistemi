import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { ChatService } from './chat.service.js';
import { SendGroupMessageDto } from './dto/send-group-message.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('contacts')
  getContacts(@Req() request: AuthenticatedRequest) {
    return this.service.getContacts(request.user.id);
  }

  @Get('contacts/:id')
  getContact(@Param('id') id: string) {
    return this.service.getContact(id);
  }

  @Get('conversations')
  getConversations(@Req() request: AuthenticatedRequest) {
    return this.service.getConversations(request.user.id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() request: AuthenticatedRequest) {
    return this.service.getUnreadCount(request.user.id);
  }

  @Get('messages/:staffId')
  getMessages(
    @Req() request: AuthenticatedRequest,
    @Param('staffId') staffId: string,
    @Query('before') before?: string,
  ) {
    return this.service.getMessages(request.user.id, staffId, before);
  }

  @Post('messages')
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
  sendMessage(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SendMessageDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.service.sendMessage(request.user.id, dto, file);
  }

  @Post('messages/:staffId/read')
  markRead(
    @Req() request: AuthenticatedRequest,
    @Param('staffId') staffId: string,
  ) {
    return this.service.markRead(request.user.id, staffId);
  }

  // --- Ortak (genel) sohbet: tüm aktif personelin otomatik üyesi olduğu tek
  // bir yayın odası (bkz. ChatService).

  @Get('group/unread-count')
  getGroupUnreadCount(@Req() request: AuthenticatedRequest) {
    return this.service.getGroupUnreadCount(request.user.id);
  }

  @Get('group/messages')
  getGroupMessages(@Query('before') before?: string) {
    return this.service.getGroupMessages(before);
  }

  @Post('group/messages')
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
  sendGroupMessage(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SendGroupMessageDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.service.sendGroupMessage(request.user.id, dto, file);
  }

  @Post('group/read')
  markGroupRead(@Req() request: AuthenticatedRequest) {
    return this.service.markGroupRead(request.user.id);
  }
}
