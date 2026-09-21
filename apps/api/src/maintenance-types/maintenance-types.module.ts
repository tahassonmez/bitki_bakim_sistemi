import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MaintenanceTypesController } from './maintenance-types.controller.js';
import { MaintenanceTypesService } from './maintenance-types.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MaintenanceTypesController],
  providers: [MaintenanceTypesService],
})
export class MaintenanceTypesModule {}
