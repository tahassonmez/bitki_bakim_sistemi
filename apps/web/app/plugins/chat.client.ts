import { useChatSocket } from '~/composables/useChatSocket';
import { useAuthStore } from '~/stores/auth';
import { useChatStore } from '~/stores/chat';
import type { ChatMessage, GroupChatMessage } from '~/types/api';

// Sohbet soketini uygulama genelinde tek yerden kuruyoruz: giriş yapılınca
// bağlanıp gelen 'message:new' / 'message:read' olaylarını Pinia store'una
// aktarıyor, çıkış yapılınca bağlantıyı kapatıp store'u sıfırlıyoruz. Böylece
// hangi sayfada olursa olsun (bildirim rozeti dahil) sohbet verisi güncel kalıyor.
export default defineNuxtPlugin(() => {
  const auth = useAuthStore();
  const chat = useChatStore();
  const { connect, disconnect } = useChatSocket();

  function wireSocket() {
    const socket = connect();
    if (!socket) return;

    // Giriş/çıkış döngüsünde soket yeniden kurulabildiği için aynı olaya
    // birden fazla dinleyici birikmesin diye önce temizliyoruz.
    socket.off('message:new');
    socket.off('message:read');
    socket.off('group:message:new');

    socket.on('message:new', (message: ChatMessage) => {
      chat.appendMessage(message);
    });

    socket.on('message:read', (payload: { by: string }) => {
      chat.markReadByPartner(payload.by);
    });

    socket.on('group:message:new', (message: GroupChatMessage) => {
      chat.appendGroupMessage(message);
    });
  }

  function startChat() {
    wireSocket();
    chat.fetchConversations().catch(() => {});
    chat.fetchUnreadCount().catch(() => {});
    chat.fetchGroupUnreadCount().catch(() => {});
  }

  // Sayfa yenilendiğinde oturum zaten açıksa hemen bağlan.
  if (auth.token && auth.user) {
    startChat();
  }

  watch(
    () => auth.token,
    (token, previous) => {
      if (token && !previous) {
        startChat();
      } else if (!token && previous) {
        disconnect();
        chat.reset();
      }
    },
  );
});
