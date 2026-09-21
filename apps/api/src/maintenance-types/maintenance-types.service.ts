import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto.js';
import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto.js';

@Injectable()
export class MaintenanceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(activeOnly = true) {
    return this.prisma.maintenanceType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateMaintenanceTypeDto) {
    try {
      return await this.prisma.maintenanceType.create({ data: dto });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('Maintenance type already exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateMaintenanceTypeDto) {
    await this.ensureExists(id);
    return this.prisma.maintenanceType.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    return this.prisma.maintenanceType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async ensureExists(id: string) {
    const type = await this.prisma.maintenanceType.findUnique({
      where: { id },
    });
    if (!type) throw new NotFoundException('Maintenance type not found');
    return type;
  }
}
