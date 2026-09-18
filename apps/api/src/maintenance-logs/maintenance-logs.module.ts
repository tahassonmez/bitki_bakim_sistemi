import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MaintenanceLogsController } from './maintenance-logs.controller.js';
import { MaintenanceLogsListController } from './maintenance-logs-list.controller.js';
import { MaintenanceLogsService } from './maintenance-logs.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MaintenanceLogsController, MaintenanceLogsListController],
  providers: [MaintenanceLogsService],
  exports: [MaintenanceLogsService],
})
export class MaintenanceLogsModule {}
