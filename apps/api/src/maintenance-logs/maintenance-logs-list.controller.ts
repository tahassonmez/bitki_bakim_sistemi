import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { MaintenanceLogsService } from './maintenance-logs.service.js';

@ApiTags('maintenance-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('maintenance-logs')
export class MaintenanceLogsListController {
  constructor(private readonly service: MaintenanceLogsService) {}

  @Get()
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('locationId') locationId?: string,
    @Query('plantId') plantId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.service.findAllGlobal({
      customerId,
      locationId,
      plantId,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });
  }
}
