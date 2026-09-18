import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantStatus, Prisma } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBulkPlantsDto } from './dto/create-bulk-plants.dto.js';
import { CreatePlantDto } from './dto/create-plant.dto.js';
import { UpdatePlantStatusDto } from './dto/update-plant-status.dto.js';
import { UpdatePlantDto } from './dto/update-plant.dto.js';

@Injectable()
export class PlantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreatePlantDto) {
    await this.ensureLocation(dto.locationId);
    return this.prisma.$transaction(async (tx) => {
      const [plantCode] = await this.generatePlantCodes(1, tx);
      return tx.plant.create({
        data: {
          plantCode,
          name: dto.name,
          species: dto.species,
          locationId: dto.locationId,
          potInfo: dto.potInfo,
          sizeInfo: dto.sizeInfo,
          careFrequencyDays: dto.careFrequencyDays,
        },
      });
    });
  }

  async createBulk(dto: CreateBulkPlantsDto) {
    await this.ensureLocation(dto.locationId);
    return this.prisma.$transaction(async (tx) => {
      const codes = await this.generatePlantCodes(dto.quantity, tx);
      const plants = [];
      for (const plantCode of codes) {
        plants.push(
          await tx.plant.create({
            data: {
              plantCode,
              name: dto.name,
              species: dto.species,
              locationId: dto.locationId,
              potInfo: dto.potInfo,
              sizeInfo: dto.sizeInfo,
              careFrequencyDays: dto.careFrequencyDays,
            },
          }),
        );
      }
      return plants;
    });
  }

  findAll(filters: {
    customerId?: string;
    locationId?: string;
    status?: PlantStatus;
    code?: string;
  }) {
    const where: Prisma.PlantWhereInput = {
      status: filters.status,
      locationId: filters.locationId,
      location: filters.customerId
        ? { customerId: filters.customerId }
        : undefined,
    };
    if (filters.code) {
      where.plantCode = { equals: filters.code, mode: 'insensitive' };
    }

    return this.prisma.plant.findMany({
      where,
      orderBy: { plantCode: 'asc' },
      include: { location: { include: { customer: true } } },
    });
  }

  async findOne(id: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id },
      include: {
        location: { include: { customer: true } },
        maintenanceLogs: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            staff: { select: { id: true, fullName: true, email: true } },
            actions: { include: { type: true } },
            products: { include: { product: true } },
            photos: true,
          },
        },
      },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    return { ...plant, recentLogs: plant.maintenanceLogs };
  }

  async update(id: string, dto: UpdatePlantDto) {
    await this.findOne(id);
    if (dto.locationId) await this.ensureLocation(dto.locationId);
    return this.prisma.plant.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, dto: UpdatePlantStatusDto) {
    await this.findOne(id);
    return this.prisma.plant.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async getQrCodeBuffer(id: string) {
    const plant = await this.prisma.plant.findUnique({ where: { id } });
    if (!plant) throw new NotFoundException('Plant not found');
    const baseUrl =
      this.config.get<string>('WEB_APP_BASE_URL') ?? 'http://localhost:3000';
    return QRCode.toBuffer(`${baseUrl}/plants/${plant.id}`, {
      type: 'png',
      width: 400,
      margin: 2,
    });
  }

  private async ensureLocation(locationId: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException('Location not found');
  }

  private async generatePlantCodes(
    count: number,
    tx: Prisma.TransactionClient,
  ) {
    const last = await tx.plant.findFirst({ orderBy: { plantCode: 'desc' } });
    let nextNumber = last ? Number(last.plantCode.split('-')[1]) + 1 : 1;
    return Array.from(
      { length: count },
      () => `WSK-${String(nextNumber++).padStart(6, '0')}`,
    );
  }
}
