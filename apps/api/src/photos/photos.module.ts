import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StorageModule } from '../storage/storage.module.js';
import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), StorageModule],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
