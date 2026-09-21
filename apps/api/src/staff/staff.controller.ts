import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { StaffService } from './staff.service.js';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.staffService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Get(':id/today-tasks')
  getTodayTasks(@Param('id') id: string) {
    return this.staffService.getTodayTasks(id);
  }

  @Get(':id/upcoming-tasks')
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  getUpcomingTasks(
    @Param('id') id: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.staffService.getUpcomingTasks(id, days ?? 7);
  }

  @Get(':id/plants')
  getAssignedPlants(@Param('id') id: string) {
    return this.staffService.getAssignedPlants(id);
  }
}
