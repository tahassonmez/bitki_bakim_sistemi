import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
}
