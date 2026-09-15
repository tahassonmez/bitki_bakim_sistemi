import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateNextMaintenanceDate } from './calculate-next-maintenance-date.js';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto.js';

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
}
