import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

interface ChatJwtPayload {
  sub: string;
  email: string;
  role: string;
}

// Personel/admin sohbetinin canlı (WebSocket) tarafı. Mesajın kendisi REST
// üzerinden (ChatController) oluşturulup kaydediliyor; bu gateway sadece
// "yeni mesaj geldi" / "mesaj okundu" olaylarını, o an bağlı olan tarayıcı
// sekmelerine anında iletmek için var — sayfa yenilemeden mesaj görünsün diye.
@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<ChatJwtPayload>(token);
      client.data.userId = payload.sub;
      // Her kullanıcı kendi id'siyle adlandırılan bir odaya katılıyor —
      // aynı kişinin birden fazla sekmesi/cihazı açık olsa bile
      // `server.to(userId).emit(...)` hepsine birden ulaşır.
      client.join(payload.sub);
      // Ortak (genel) sohbet odası: bağlanan her kullanıcı otomatik olarak
      // buraya katılıyor, ayrı bir üyelik tablosu tutmaya gerek kalmıyor.
      client.join('group');
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Bağlantı kesildi: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(userId).emit(event, payload);
  }

  emitToGroup(event: string, payload: unknown) {
    this.server.to('group').emit(event, payload);
  }
}
