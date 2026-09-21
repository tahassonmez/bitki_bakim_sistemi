import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { ChatGateway } from './chat.gateway.js';
import { SendGroupMessageDto } from './dto/send-group-message.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

const CONTACT_SELECT = {
  id: true,
  fullName: true,
  role: true,
} as const;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly gateway: ChatGateway,
  ) {}

  async getContacts(currentUserId: string) {
    return this.prisma.staff.findMany({
      where: { isActive: true, id: { not: currentUserId } },
      select: CONTACT_SELECT,
      orderBy: { fullName: 'asc' },
    });
  }

  async getContact(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: CONTACT_SELECT,
    });
    if (!staff) throw new NotFoundException('Personel bulunamadı');
    return staff;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { receiverId: userId, readAt: null },
    });
    return { count };
  }

  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: CONTACT_SELECT },
        receiver: { select: CONTACT_SELECT },
      },
    });

    const byPartnerId = new Map<
      string,
      {
        partner: (typeof messages)[number]['sender'];
        lastMessage: (typeof messages)[number];
        unreadCount: number;
      }
    >();

    for (const message of messages) {
      const isReceiver = message.receiverId === userId;
      const partner = isReceiver ? message.sender : message.receiver;
      const existing = byPartnerId.get(partner.id);
      if (!existing) {
        byPartnerId.set(partner.id, {
          partner,
          lastMessage: message,
          unreadCount: isReceiver && !message.readAt ? 1 : 0,
        });
      } else if (isReceiver && !message.readAt) {
        existing.unreadCount += 1;
      }
    }

    return Array.from(byPartnerId.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime(),
    );
  }

  async getMessages(userId: string, otherId: string, before?: string) {
    const other = await this.prisma.staff.findUnique({
      where: { id: otherId },
    });
    if (!other) throw new NotFoundException('Personel bulunamadı');

    const parsedBefore = before ? new Date(before) : undefined;

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
        ...(parsedBefore ? { createdAt: { lt: parsedBefore } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: CONTACT_SELECT },
        receiver: { select: CONTACT_SELECT },
      },
    });

    return messages.reverse();
  }

  async sendMessage(
    senderId: string,
    dto: SendMessageDto,
    file?: Express.Multer.File,
  ) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('Kendine mesaj gönderemezsin');
    }
    const receiver = await this.prisma.staff.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver || !receiver.isActive) {
      throw new NotFoundException('Alıcı bulunamadı');
    }

    const body = dto.body?.trim() || undefined;
    if (!body && !file) {
      throw new BadRequestException('Mesaj metni veya fotoğraf gerekli');
    }

    let savedFileName: string | undefined;
    let photoUrl: string | undefined;
    if (file) {
      savedFileName = await this.storage.save(file);
      photoUrl = this.storage.getUrl(savedFileName);
    }

    try {
      const message = await this.prisma.message.create({
        data: { senderId, receiverId: dto.receiverId, body, photoUrl },
        include: {
          sender: { select: CONTACT_SELECT },
          receiver: { select: CONTACT_SELECT },
        },
      });
      this.gateway.emitToUser(dto.receiverId, 'message:new', message);
      this.gateway.emitToUser(senderId, 'message:new', message);
      return message;
    } catch (error) {
      if (savedFileName) await this.storage.delete(savedFileName);
      throw error;
    }
  }

  async markRead(userId: string, otherId: string) {
    const result = await this.prisma.message.updateMany({
      where: { receiverId: userId, senderId: otherId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count > 0) {
      this.gateway.emitToUser(otherId, 'message:read', { by: userId });
    }
    return { updated: result.count };
  }

  // --- Ortak (genel) sohbet: tüm aktif personelin otomatik üyesi olduğu tek
  // bir yayın odası. Ayrı bir üyelik tablosu yok; herkes bağlandığında
  // gateway'de 'group' odasına otomatik katılıyor (bkz. ChatGateway).

  async getGroupUnreadCount(userId: string) {
    const read = await this.prisma.groupMessageRead.findUnique({
      where: { staffId: userId },
    });
    const count = await this.prisma.groupMessage.count({
      where: {
        senderId: { not: userId },
        ...(read ? { createdAt: { gt: read.lastReadAt } } : {}),
      },
    });
    return { count };
  }

  async getGroupMessages(before?: string) {
    const parsedBefore = before ? new Date(before) : undefined;
    const messages = await this.prisma.groupMessage.findMany({
      where: parsedBefore ? { createdAt: { lt: parsedBefore } } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { sender: { select: CONTACT_SELECT } },
    });
    return messages.reverse();
  }

  async sendGroupMessage(
    senderId: string,
    dto: SendGroupMessageDto,
    file?: Express.Multer.File,
  ) {
    const body = dto.body?.trim() || undefined;
    if (!body && !file) {
      throw new BadRequestException('Mesaj metni veya fotoğraf gerekli');
    }

    let savedFileName: string | undefined;
    let photoUrl: string | undefined;
    if (file) {
      savedFileName = await this.storage.save(file);
      photoUrl = this.storage.getUrl(savedFileName);
    }

    try {
      const message = await this.prisma.groupMessage.create({
        data: { senderId, body, photoUrl },
        include: { sender: { select: CONTACT_SELECT } },
      });
      // Gönderen kendi mesajını gönderdiği anda okumuş sayılır.
      await this.prisma.groupMessageRead.upsert({
        where: { staffId: senderId },
        create: { staffId: senderId, lastReadAt: message.createdAt },
        update: { lastReadAt: message.createdAt },
      });
      this.gateway.emitToGroup('group:message:new', message);
      return message;
    } catch (error) {
      if (savedFileName) await this.storage.delete(savedFileName);
      throw error;
    }
  }

  async markGroupRead(userId: string) {
    const now = new Date();
    await this.prisma.groupMessageRead.upsert({
      where: { staffId: userId },
      create: { staffId: userId, lastReadAt: now },
      update: { lastReadAt: now },
    });
    return { updated: true };
  }
}
