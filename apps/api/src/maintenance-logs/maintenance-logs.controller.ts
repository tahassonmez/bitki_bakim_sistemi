import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto.js';
import { MaintenanceLogsService } from './maintenance-logs.service.js';

@ApiTags('maintenance-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/maintenance-logs')
export class MaintenanceLogsController {
  constructor(private readonly service: MaintenanceLogsService) {}

  @Post()
  create(
    @Param('plantId') plantId: string,
    @Body() dto: CreateMaintenanceLogDto,
  ) {
    return this.service.create(plantId, dto);
  }

  @Get()
  findByPlant(@Param('plantId') plantId: string) {
    return this.service.findByPlant(plantId);
  }
}
