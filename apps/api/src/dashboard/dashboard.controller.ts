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
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('upcoming')
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  getUpcoming(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.dashboardService.getUpcoming(days ?? 7);
  }

  @Get('overdue')
  getOverdue() {
    return this.dashboardService.getOverdue();
  }

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('action-breakdown')
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  getActionBreakdown(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.dashboardService.getActionBreakdown(days ?? 30);
  }

  @Get('recent-logs')
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  getRecentLogs(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getRecentLogs(limit ?? 15);
  }
}
