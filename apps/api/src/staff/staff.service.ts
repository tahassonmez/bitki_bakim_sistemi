import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

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
        throw new ConflictException('A staff member with this email already exists');
      }
      throw error;
    }
  }

  private toPublicStaff(staff: { id: string; fullName: string; email: string; phone: string | null; role: Role; isActive: boolean; createdAt: Date }) {
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
