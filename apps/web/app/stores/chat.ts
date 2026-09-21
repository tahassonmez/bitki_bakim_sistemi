import { defineStore } from 'pinia';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';
import type { ChatConversation, ChatMessage, GroupChatMessage } from '~/types/api';

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<ChatConversation[]>([]);
  const messagesByPartner = ref<Record<string, ChatMessage[]>>({});
  const unreadCount = ref(0);

  // Tüm personelin otomatik üyesi olduğu ortak (genel) sohbet.
  const groupMessages = ref<GroupChatMessage[]>([]);
  const groupUnreadCount = ref(0);

  function currentUserId() {
    const auth = useAuthStore();
    return auth.user?.id ?? '';
  }

  function partnerIdOf(message: ChatMessage) {
    const me = currentUserId();
    return message.senderId === me ? message.receiverId : message.senderId;
  }

  async function fetchConversations() {
    const { request } = useApi();
    conversations.value = await request<ChatConversation[]>('/chat/conversations');
  }

  async function fetchUnreadCount() {
    const { request } = useApi();
    const result = await request<{ count: number }>('/chat/unread-count');
    unreadCount.value = result.count;
  }

  async function fetchMessages(partnerId: string) {
    const { request } = useApi();
    const messages = await request<ChatMessage[]>(`/chat/messages/${partnerId}`);
    messagesByPartner.value[partnerId] = messages;
  }

  function sortConversations() {
    conversations.value.sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    );
  }

  function upsertConversationFromMessage(message: ChatMessage) {
    const me = currentUserId();
    const partnerId = partnerIdOf(message);
    const partner = message.senderId === partnerId ? message.sender : message.receiver;
    const isIncoming = message.receiverId === me;
    const existing = conversations.value.find((c) => c.partner.id === partnerId);
    if (existing) {
      existing.lastMessage = message;
      if (isIncoming && !message.readAt) existing.unreadCount += 1;
    } else {
      conversations.value.unshift({
        partner,
        lastMessage: message,
        unreadCount: isIncoming && !message.readAt ? 1 : 0,
      });
    }
    sortConversations();
  }

  // Yeni bir mesaj geldiğinde (soket üzerinden) ya da ben gönderdiğimde çağrılır:
  // hem açık konuşma listesine hem de sohbet listesindeki son mesaj/okunmadı
  // sayısına yansıtır.
  function appendMessage(message: ChatMessage) {
    const partnerId = partnerIdOf(message);
    const list = messagesByPartner.value[partnerId];
    if (list && !list.some((m) => m.id === message.id)) {
      list.push(message);
    }
    upsertConversationFromMessage(message);
    if (message.receiverId === currentUserId() && !message.readAt) {
      unreadCount.value += 1;
    }
  }

  async function markRead(partnerId: string) {
    const { request } = useApi();
    const existing = conversations.value.find((c) => c.partner.id === partnerId);
    const delta = existing?.unreadCount ?? 0;
    await request(`/chat/messages/${partnerId}/read`, { method: 'POST' });
    if (existing) existing.unreadCount = 0;
    unreadCount.value = Math.max(0, unreadCount.value - delta);

    const list = messagesByPartner.value[partnerId];
    if (list) {
      const me = currentUserId();
      const now = new Date().toISOString();
      for (const m of list) {
        if (m.receiverId === me && !m.readAt) m.readAt = now;
      }
    }
  }

  // 'message:read' soket olayı: karşı taraf (byUserId) benim gönderdiğim
  // mesajları okudu — kendi gönderdiğim mesajlarda "okundu" işaretini güncelle.
  function markReadByPartner(byUserId: string) {
    const me = currentUserId();
    const now = new Date().toISOString();
    const list = messagesByPartner.value[byUserId];
    if (list) {
      for (const m of list) {
        if (m.senderId === me && !m.readAt) m.readAt = now;
      }
    }
    const conv = conversations.value.find((c) => c.partner.id === byUserId);
    if (conv && conv.lastMessage.senderId === me && !conv.lastMessage.readAt) {
      conv.lastMessage = { ...conv.lastMessage, readAt: now };
    }
  }

  // --- Ortak (genel) sohbet ---

  async function fetchGroupMessages() {
    const { request } = useApi();
    groupMessages.value = await request<GroupChatMessage[]>('/chat/group/messages');
  }

  async function fetchGroupUnreadCount() {
    const { request } = useApi();
    const result = await request<{ count: number }>('/chat/group/unread-count');
    groupUnreadCount.value = result.count;
  }

  function appendGroupMessage(message: GroupChatMessage) {
    if (!groupMessages.value.some((m) => m.id === message.id)) {
      groupMessages.value.push(message);
    }
    if (message.senderId !== currentUserId()) {
      groupUnreadCount.value += 1;
    }
  }

  async function markGroupRead() {
    const { request } = useApi();
    await request('/chat/group/read', { method: 'POST' });
    groupUnreadCount.value = 0;
  }

  function reset() {
    conversations.value = [];
    messagesByPartner.value = {};
    unreadCount.value = 0;
    groupMessages.value = [];
    groupUnreadCount.value = 0;
  }

  return {
    conversations,
    messagesByPartner,
    unreadCount,
    groupMessages,
    groupUnreadCount,
    fetchConversations,
    fetchUnreadCount,
    fetchMessages,
    appendMessage,
    markRead,
    markReadByPartner,
    fetchGroupMessages,
    fetchGroupUnreadCount,
    appendGroupMessage,
    markGroupRead,
    reset,
  };
});
