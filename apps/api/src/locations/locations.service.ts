import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLocationDto) {
    await this.prisma.customer.findUniqueOrThrow({
      where: { id: dto.customerId },
    });
    return this.prisma.location.create({ data: dto });
  }

  findAll(customerId?: string) {
    return this.prisma.location.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { plants: true } }, customer: true },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: { customer: true, plants: true },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(id: string, dto: UpdateLocationDto) {
    await this.findOne(id);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.location.delete({ where: { id } });
  }
}
