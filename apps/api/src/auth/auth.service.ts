import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const staff = await this.prisma.staff.findUnique({ where: { email: dto.email } });
    if (!staff || !staff.isActive || !(await bcrypt.compare(dto.password, staff.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: staff.id,
      email: staff.email,
      role: staff.role,
    });
    return {
      accessToken,
      staff: {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
      },
    };
  }
}
