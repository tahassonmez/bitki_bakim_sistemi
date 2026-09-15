import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LocationsController } from './locations.controller.js';
import { LocationsService } from './locations.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
