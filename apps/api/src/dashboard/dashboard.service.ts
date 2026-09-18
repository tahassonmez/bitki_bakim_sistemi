import { Injectable, NotFoundException } from '@nestjs/common';
import { PlantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getUpcoming(days = 7) {
    const today = startOfToday();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);

    return this.prisma.plant.findMany({
      where: {
        status: PlantStatus.ACTIVE,
        nextMaintenanceDate: { gte: today, lte: limit },
      },
      include: { location: { include: { customer: true } } },
      orderBy: { nextMaintenanceDate: 'asc' },
    });
  }

  getOverdue() {
    return this.prisma.plant.findMany({
      where: {
        status: PlantStatus.ACTIVE,
        nextMaintenanceDate: { lt: startOfToday() },
      },
      include: { location: { include: { customer: true } } },
      orderBy: { nextMaintenanceDate: 'asc' },
    });
  }

  async getSummary() {
    const today = startOfToday();
    const [customerCount, plantCount, staffCount, todayMaintenanceCount] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.plant.count({ where: { status: PlantStatus.ACTIVE } }),
        this.prisma.staff.count({ where: { isActive: true } }),
        this.prisma.maintenanceLog.count({ where: { date: { gte: today } } }),
      ]);

    return { customerCount, plantCount, staffCount, todayMaintenanceCount };
  }

  async getActionBreakdown(days = 30) {
    const since = startOfToday();
    since.setDate(since.getDate() - days);

    const counts = await this.prisma.maintenanceLogAction.groupBy({
      by: ['typeId'],
      where: { log: { date: { gte: since } } },
      _count: { _all: true },
    });
    if (!counts.length) return [];

    const types = await this.prisma.maintenanceType.findMany({
      where: { id: { in: counts.map((c) => c.typeId) } },
    });
    const nameById = new Map(types.map((type) => [type.id, type.name]));

    return counts
      .map((c) => ({
        typeId: c.typeId,
        name: nameById.get(c.typeId) ?? 'Bilinmiyor',
        count: c._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  getRecentLogs(limit = 15) {
    return this.prisma.maintenanceLog.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        staff: true,
        actions: { include: { type: true } },
        plant: { include: { location: { include: { customer: true } } } },
      },
    });
  }

  async getTodayTasks(staffId: string) {
    await this.ensureStaff(staffId);
    const tomorrow = startOfTomorrow();

    return this.prisma.plant.findMany({
      where: {
        status: PlantStatus.ACTIVE,
        nextMaintenanceDate: { lt: tomorrow },
      },
      include: { location: { include: { customer: true } } },
      orderBy: [{ nextMaintenanceDate: 'asc' }, { plantCode: 'asc' }],
    });
  }

  async getCustomerSummary(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const today = startOfToday();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    const locationFilter = { location: { customerId } };
    const [plantCount, upcomingCount, overdueCount] = await Promise.all([
      this.prisma.plant.count({
        where: { ...locationFilter, status: PlantStatus.ACTIVE },
      }),
      this.prisma.plant.count({
        where: {
          ...locationFilter,
          status: PlantStatus.ACTIVE,
          nextMaintenanceDate: { gte: today, lte: limit },
        },
      }),
      this.prisma.plant.count({
        where: {
          ...locationFilter,
          status: PlantStatus.ACTIVE,
          nextMaintenanceDate: { lt: today },
        },
      }),
    ]);

    return {
      customer,
      plantCount,
      upcomingCount,
      overdueCount,
    };
  }

  private async ensureStaff(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }
}
