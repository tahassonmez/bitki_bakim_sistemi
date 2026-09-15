import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PlantsController } from './plants.controller.js';
import { PlantsService } from './plants.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PlantsController],
  providers: [PlantsService],
  exports: [PlantsService],
})
export class PlantsModule {}
