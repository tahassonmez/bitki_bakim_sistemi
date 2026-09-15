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
