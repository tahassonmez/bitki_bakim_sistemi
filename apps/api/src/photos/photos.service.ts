import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(logId: string, userId: string, file: Express.Multer.File) {
    const log = await this.prisma.maintenanceLog.findUnique({
      where: { id: logId },
    });
    if (!log) throw new NotFoundException('Maintenance log not found');
    const fileName = await this.storage.save(file);
    try {
      return await this.prisma.photo.create({
        data: {
          logId,
          url: this.storage.getUrl(fileName),
          uploadedById: userId,
        },
      });
    } catch (error) {
      await this.storage.delete(fileName);
      throw error;
    }
  }

  async remove(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Photo not found');
    const fileName = photo.url.split('/').pop();
    if (fileName) await this.storage.delete(fileName);
    await this.prisma.photo.delete({ where: { id } });
    return { deleted: true };
  }
}
