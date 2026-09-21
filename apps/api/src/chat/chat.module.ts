import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StorageModule } from '../storage/storage.module.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), StorageModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
