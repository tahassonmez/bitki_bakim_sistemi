import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateNextMaintenanceDate } from './calculate-next-maintenance-date.js';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto.js';

export interface FindAllMaintenanceLogsFilters {
  customerId?: string;
  locationId?: string;
  plantId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class MaintenanceLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(plantId: string, dto: CreateMaintenanceLogDto) {
    return this.prisma.$transaction(async (tx) => {
      const plant = await tx.plant.findUniqueOrThrow({
        where: { id: plantId },
      });
      await tx.staff.findUniqueOrThrow({ where: { id: dto.staffId } });
      const logDate = new Date(dto.date);

      const log = await tx.maintenanceLog.create({
        data: {
          plantId,
          staffId: dto.staffId,
          date: logDate,
          notes: dto.notes,
          actions: { create: dto.typeIds.map((typeId) => ({ typeId })) },
          products: dto.products
            ? {
                create: dto.products.map((product) => ({
                  productId: product.productId,
                  quantityUsed: product.quantityUsed,
                })),
              }
            : undefined,
        },
        include: {
          staff: { select: { id: true, fullName: true, email: true } },
          actions: { include: { type: true } },
          products: { include: { product: true } },
        },
      });

      await tx.plant.update({
        where: { id: plantId },
        data: {
          lastMaintenanceDate: logDate,
          nextMaintenanceDate: calculateNextMaintenanceDate(
            logDate,
            plant.careFrequencyDays,
          ),
        },
      });
      return log;
    });
  }

  findByPlant(plantId: string) {
    return this.prisma.maintenanceLog.findMany({
      where: { plantId },
      orderBy: { date: 'desc' },
      include: {
        staff: { select: { id: true, fullName: true, email: true } },
        actions: { include: { type: true } },
        products: { include: { product: true } },
        photos: true,
      },
    });
  }

  async findAllGlobal(filters: FindAllMaintenanceLogsFilters) {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize =
      filters.pageSize && filters.pageSize > 0
        ? Math.min(Math.floor(filters.pageSize), 100)
        : 30;

    const where: Prisma.MaintenanceLogWhereInput = {};
    if (filters.plantId) where.plantId = filters.plantId;
    if (filters.customerId || filters.locationId) {
      where.plant = {
        locationId: filters.locationId,
        location: filters.customerId
          ? { customerId: filters.customerId }
          : undefined,
      };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.date = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`) : undefined,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.maintenanceLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          staff: { select: { id: true, fullName: true, email: true } },
          actions: { include: { type: true } },
          products: { include: { product: true } },
          photos: true,
          plant: { include: { location: { include: { customer: true } } } },
        },
      }),
      this.prisma.maintenanceLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
