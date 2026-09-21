import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto.js';
import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto.js';
import { MaintenanceTypesService } from './maintenance-types.service.js';

@ApiTags('maintenance-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance-types')
export class MaintenanceTypesController {
  constructor(private readonly service: MaintenanceTypesService) {}

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.service.findAll(activeOnly !== 'false');
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMaintenanceTypeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceTypeDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
