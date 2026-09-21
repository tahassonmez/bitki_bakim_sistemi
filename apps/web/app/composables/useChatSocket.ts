import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '~/stores/auth';

// Modül seviyesinde tek bir socket referansı tutuyoruz: sayfa değiştikçe
// composable tekrar tekrar çağrılsa bile aynı bağlantı yeniden kullanılır,
// her sayfa geçişinde yeni bir WebSocket açılmaz.
let socket: Socket | null = null;

export function useChatSocket() {
  const auth = useAuthStore();
  const config = useRuntimeConfig();

  function connect(): Socket | null {
    if (socket?.connected) return socket;
    if (!auth.token) return null;

    socket = io(`${String(config.public.apiBase)}/chat`, {
      auth: { token: auth.token },
      transports: ['websocket'],
      reconnection: true,
    });
    return socket;
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
  }

  function getSocket(): Socket | null {
    return socket;
  }

  return { connect, disconnect, getSocket };
}
