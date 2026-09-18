import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlantStatus } from '@prisma/client';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateBulkPlantsDto } from './dto/create-bulk-plants.dto.js';
import { CreatePlantDto } from './dto/create-plant.dto.js';
import { UpdatePlantStatusDto } from './dto/update-plant-status.dto.js';
import { UpdatePlantDto } from './dto/update-plant.dto.js';
import { PlantsService } from './plants.service.js';

@ApiTags('plants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Post()
  create(@Body() dto: CreatePlantDto) {
    return this.plantsService.create(dto);
  }

  @Post('bulk')
  createBulk(@Body() dto: CreateBulkPlantsDto) {
    return this.plantsService.createBulk(dto);
  }

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: PlantStatus,
    @Query('code') code?: string,
  ) {
    return this.plantsService.findAll({ customerId, locationId, status, code });
  }

  @Get(':id/qrcode')
  async getQrCode(@Param('id') id: string, @Res() response: Response) {
    const buffer = await this.plantsService.getQrCodeBuffer(id);
    response.set({ 'Content-Type': 'image/png' });
    response.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlantDto) {
    return this.plantsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePlantStatusDto) {
    return this.plantsService.updateStatus(id, dto);
  }
}
