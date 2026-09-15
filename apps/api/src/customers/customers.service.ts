import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { locations: true } } },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        locations: {
          orderBy: { name: 'asc' },
          include: { _count: { select: { plants: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getSummary(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    const customerPlants = {
      location: { customerId: id },
      status: 'ACTIVE' as const,
    };
    const [plantCount, upcomingCount, overdueCount] = await Promise.all([
      this.prisma.plant.count({ where: customerPlants }),
      this.prisma.plant.count({
        where: {
          ...customerPlants,
          nextMaintenanceDate: { gte: today, lte: limit },
        },
      }),
      this.prisma.plant.count({
        where: { ...customerPlants, nextMaintenanceDate: { lt: today } },
      }),
    ]);

    return { customer, plantCount, upcomingCount, overdueCount };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
