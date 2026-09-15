import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class StorageService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async save(file: Express.Multer.File): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${randomUUID()}-${safeName}`;
    await writeFile(join(this.uploadDir, fileName), file.buffer);
    return fileName;
  }

  getUrl(fileName: string): string {
    return `${process.env.API_PUBLIC_URL ?? 'http://localhost:3001'}/uploads/${fileName}`;
  }

  async delete(fileName: string): Promise<void> {
    await unlink(join(this.uploadDir, fileName)).catch(() => undefined);
  }
}
