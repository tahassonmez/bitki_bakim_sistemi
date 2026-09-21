import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const staff = await this.prisma.staff.findMany({
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });
    return staff.map((member) => this.toPublicStaff(member));
  }

  async create(dto: CreateStaffDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const staff = await this.prisma.staff.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: dto.role ?? Role.STAFF,
        },
      });
      return this.toPublicStaff(staff);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'A staff member with this email already exists',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staff member not found');

    const data: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      role?: Role;
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const staff = await this.prisma.staff.update({ where: { id }, data });
      return this.toPublicStaff(staff);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'A staff member with this email already exists',
        );
      }
      throw error;
    }
  }

  async getTodayTasks(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { assignedCustomers: { select: { id: true } } },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // STAFF rolündeki personel sadece kendisine atanmış müşterilerin
    // bakımlarını görür. Yöneticiler (ADMIN) için filtre uygulanmaz.
    const assignedCustomerIds = staff.assignedCustomers.map((c) => c.id);

    return this.prisma.plant.findMany({
      where: {
        status: 'ACTIVE',
        nextMaintenanceDate: { lt: tomorrow },
        ...(staff.role === Role.STAFF
          ? { location: { customerId: { in: assignedCustomerIds } } }
          : {}),
      },
      include: { location: { include: { customer: true } } },
      orderBy: [{ nextMaintenanceDate: 'asc' }, { plantCode: 'asc' }],
    });
  }

  async getUpcomingTasks(staffId: string, days = 7) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { assignedCustomers: { select: { id: true } } },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);

    const assignedCustomerIds = staff.assignedCustomers.map((c) => c.id);

    return this.prisma.plant.findMany({
      where: {
        status: 'ACTIVE',
        nextMaintenanceDate: { gte: tomorrow, lte: limit },
        ...(staff.role === Role.STAFF
          ? { location: { customerId: { in: assignedCustomerIds } } }
          : {}),
      },
      include: { location: { include: { customer: true } } },
      orderBy: [{ nextMaintenanceDate: 'asc' }, { plantCode: 'asc' }],
    });
  }

  async getAssignedPlants(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { assignedCustomers: { select: { id: true } } },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    // STAFF rolündeki personel sadece kendisine atanmış müşterilerin
    // bitkilerini görür — bakım tarihine bakılmaksızın, bakmakla yükümlü
    // olduğu tüm bitkilerin tam listesi. Yöneticiler (ADMIN) için filtre
    // uygulanmaz.
    const assignedCustomerIds = staff.assignedCustomers.map((c) => c.id);

    return this.prisma.plant.findMany({
      where: {
        status: 'ACTIVE',
        ...(staff.role === Role.STAFF
          ? { location: { customerId: { in: assignedCustomerIds } } }
          : {}),
      },
      include: { location: { include: { customer: true } } },
      // Müşteri bazında gruplama arayüzde yapılıyor; burada konum ve bitki
      // koduna göre sıralamak yeterli (Prisma'da iki seviyeli ilişki
      // sıralaması yerine tek seviyeli, garanti desteklenen bir sıralama).
      orderBy: [{ location: { name: 'asc' } }, { plantCode: 'asc' }],
    });
  }

  private toPublicStaff(staff: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    };
  }
}
