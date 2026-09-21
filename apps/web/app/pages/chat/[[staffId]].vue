<template>
  <NuxtLayout :name="layoutName">
    <div class="mb-6">
      <p class="text-sm text-[#6b786f]">İç iletişim</p>
      <h2 class="display mt-1 text-3xl font-semibold tracking-tight">Sohbet</h2>
    </div>

    <section class="panel flex h-[75vh] min-h-[520px] overflow-hidden">
      <!-- Sol: sohbet listesi (WhatsApp Web tarzı). Bir kişi seçiliyken mobilde
           gizleniyor, masaüstünde her zaman görünür kalıyor. -->
      <div
        class="w-full flex-col border-r border-[#edf0eb] sm:flex sm:w-[340px] sm:shrink-0"
        :class="partnerId ? 'hidden sm:flex' : 'flex'"
      >
        <div class="border-b border-[#edf0eb] p-4">
          <div class="relative">
            <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa49d]">⌕</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ara veya yeni sohbet başlat"
              class="field-input !min-h-11 !rounded-full bg-[#f0f4ed] pl-10 text-sm"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="pending" class="space-y-2 p-3">
            <div v-for="item in 5" :key="item" class="h-16 animate-pulse rounded-xl bg-[#e5ebe3]" />
          </div>

          <template v-else>
            <!-- Ortak (genel) sohbet: tüm aktif personelin otomatik üyesi olduğu
                 sabit oda, her zaman listenin en üstünde. -->
            <button
              type="button"
              class="flex w-full items-center gap-3 border-b border-[#f2f4f0] bg-[#fbfaf3] px-4 py-3 text-left transition hover:bg-[#f7f8f4]"
              :class="isGroup ? 'bg-[#edf4ed]' : ''"
              @click="selectPartner('group')"
            >
              <span class="grid size-12 shrink-0 place-items-center rounded-full bg-[#203d30] text-lg text-white">☘</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate font-semibold">Tüm Ekip</p>
                  <span
                    v-if="lastGroupMessageAt"
                    class="shrink-0 text-xs"
                    :class="chat.groupUnreadCount ? 'font-semibold text-[#2f6b4f]' : 'text-[#8a948d]'"
                  >
                    {{ formatWhen(lastGroupMessageAt) }}
                  </span>
                </div>
                <div class="mt-0.5 flex items-center justify-between gap-2">
                  <p class="truncate text-sm text-[#68736d]">{{ groupPreviewText }}</p>
                  <span
                    v-if="chat.groupUnreadCount"
                    class="grid size-5 shrink-0 place-items-center rounded-full bg-[#2f6b4f] text-[10px] font-bold text-white"
                  >
                    {{ chat.groupUnreadCount > 9 ? '9+' : chat.groupUnreadCount }}
                  </span>
                </div>
              </div>
            </button>

            <button
              v-for="conversation in filteredConversations"
              :key="conversation.partner.id"
              type="button"
              class="flex w-full items-center gap-3 border-b border-[#f2f4f0] px-4 py-3 text-left transition hover:bg-[#f7f8f4]"
              :class="partnerId === conversation.partner.id ? 'bg-[#edf4ed]' : ''"
              @click="selectPartner(conversation.partner.id)"
            >
              <span class="grid size-12 shrink-0 place-items-center rounded-full bg-[#edf4ed] text-sm font-semibold text-[#2f6b4f]">
                {{ initials(conversation.partner.fullName) }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate font-semibold">{{ conversation.partner.fullName }}</p>
                  <span class="shrink-0 text-xs" :class="conversation.unreadCount ? 'font-semibold text-[#2f6b4f]' : 'text-[#8a948d]'">
                    {{ formatWhen(conversation.lastMessage.createdAt) }}
                  </span>
                </div>
                <div class="mt-0.5 flex items-center justify-between gap-2">
                  <p class="truncate text-sm text-[#68736d]">{{ previewText(conversation) }}</p>
                  <span
                    v-if="conversation.unreadCount"
                    class="grid size-5 shrink-0 place-items-center rounded-full bg-[#2f6b4f] text-[10px] font-bold text-white"
                  >
                    {{ conversation.unreadCount > 9 ? '9+' : conversation.unreadCount }}
                  </span>
                </div>
              </div>
            </button>

            <template v-if="filteredContacts.length">
              <p class="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]">Tüm personel</p>
              <button
                v-for="contact in filteredContacts"
                :key="contact.id"
                type="button"
                class="flex w-full items-center gap-3 border-b border-[#f2f4f0] px-4 py-3 text-left transition hover:bg-[#f7f8f4]"
                :class="partnerId === contact.id ? 'bg-[#edf4ed]' : ''"
                @click="selectPartner(contact.id)"
              >
                <span class="grid size-12 shrink-0 place-items-center rounded-full bg-[#f0f4ed] text-sm font-semibold text-[#52715d]">
                  {{ initials(contact.fullName) }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold">{{ contact.fullName }}</p>
                  <p class="mt-0.5 text-xs text-[#8a948d]">{{ contact.role === 'ADMIN' ? 'Yönetici' : 'Personel' }}</p>
                </div>
              </button>
            </template>

            <p v-if="!filteredConversations.length && !filteredContacts.length" class="p-6 text-center text-sm text-[#8a948d]">
              Sonuç bulunamadı.
            </p>
          </template>
        </div>
      </div>

      <!-- Sağ: seçili konuşma. Kimse seçili değilken masaüstünde boş durum,
           mobilde ise liste görünür olduğu için bu panel tamamen gizli. -->
      <div class="min-w-0 flex-1 flex-col sm:flex" :class="partnerId ? 'flex' : 'hidden sm:flex'">
        <template v-if="partnerId">
          <div class="flex items-center gap-3 border-b border-[#edf0eb] p-4">
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded-full border border-[#dfe5dc] text-sm sm:hidden"
              aria-label="Listeye dön"
              @click="router.push('/chat')"
            >
              ←
            </button>
            <span
              v-if="isGroup"
              class="grid size-10 shrink-0 place-items-center rounded-full bg-[#203d30] text-base text-white"
            >
              ☘
            </span>
            <span v-else class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf4ed] text-sm font-semibold text-[#2f6b4f]">
              {{ partner ? initials(partner.fullName) : '' }}
            </span>
            <div class="min-w-0">
              <p v-if="isGroup" class="truncate font-semibold">Tüm Ekip</p>
              <p v-else-if="partner" class="truncate font-semibold">{{ partner.fullName }}</p>
              <p v-else class="h-5 w-32 animate-pulse rounded bg-[#e5ebe3]" />
              <p v-if="isGroup" class="text-xs text-[#8a948d]">Tüm personel ve yöneticiler</p>
              <p v-else-if="partner" class="text-xs text-[#8a948d]">{{ partner.role === 'ADMIN' ? 'Yönetici' : 'Personel' }}</p>
            </div>
          </div>

          <div ref="scrollRef" class="flex-1 space-y-3 overflow-y-auto bg-[#f7f8f4] p-5">
            <div v-if="threadPending" class="space-y-3">
              <div v-for="item in 4" :key="item" class="h-10 w-2/3 animate-pulse rounded-xl bg-[#e5ebe3]" />
            </div>
            <p v-else-if="!messages.length" class="mt-10 text-center text-sm text-[#8a948d]">
              Henüz mesaj yok. İlk mesajı sen gönder.
            </p>
            <template v-else>
              <div v-for="message in messages" :key="message.id" class="flex" :class="isMine(message) ? 'justify-end' : 'justify-start'">
                <div
                  class="max-w-[75%] rounded-2xl px-4 py-2.5"
                  :class="isMine(message) ? 'bg-[#203d30] text-white' : 'bg-white text-[#2b332d]'"
                >
                  <p v-if="isGroup && !isMine(message)" class="mb-1 text-xs font-semibold text-[#2f6b4f]">
                    {{ message.sender.fullName }}
                  </p>
                  <img
                    v-if="message.photoUrl"
                    :src="message.photoUrl"
                    alt="Sohbet fotoğrafı"
                    class="mb-2 max-h-64 w-full cursor-pointer rounded-xl object-cover"
                    @click="lightboxPhoto = message.photoUrl"
                  />
                  <p v-if="message.body" class="whitespace-pre-wrap text-sm leading-5">{{ message.body }}</p>
                  <p class="mt-1 flex items-center justify-end gap-1 text-[10px]" :class="isMine(message) ? 'text-white/60' : 'text-[#8a948d]'">
                    {{ formatTime(message.createdAt) }}
                    <span v-if="isMine(message) && !isGroup">{{ isDmRead(message) ? '✓✓' : '✓' }}</span>
                  </p>
                </div>
              </div>
            </template>
          </div>

          <p v-if="sendError" class="px-5 pt-2 text-sm text-[#a15d47]">{{ sendError }}</p>

          <form class="flex items-end gap-2 border-t border-[#edf0eb] p-4" @submit.prevent="onSend">
            <label class="grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl border border-[#dfe5dc] bg-white text-lg" title="Fotoğraf ekle">
              📷
              <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
            </label>
            <div class="min-w-0 flex-1">
              <p v-if="selectedFile" class="mb-1 truncate text-xs text-[#68736d]">
                {{ selectedFile.name }}
                <button type="button" class="ml-1 font-semibold text-[#a15d47]" @click="clearFile">Kaldır</button>
              </p>
              <textarea
                v-model="text"
                rows="1"
                class="field-input !h-auto min-h-12 resize-none py-3"
                placeholder="Bir mesaj yaz..."
                @keydown.enter.exact.prevent="onSend"
              />
            </div>
            <button class="button-primary !min-h-12 shrink-0 !px-5" type="submit" :disabled="sending || (!text.trim() && !selectedFile)">
              {{ sending ? '...' : 'Gönder' }}
            </button>
          </form>
        </template>

        <div v-else class="grid flex-1 place-items-center bg-[#f7f8f4] p-10 text-center">
          <div>
            <p class="text-4xl">✉</p>
            <p class="mt-3 font-semibold text-[#3a453e]">Bir sohbet seç</p>
            <p class="mt-1 text-sm text-[#8a948d]">Soldaki listeden bir kişiye tıklayarak mesajlaşmaya başla.</p>
          </div>
        </div>
      </div>
    </section>

    <div v-if="lightboxPhoto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" @click="lightboxPhoto = null">
      <img :src="lightboxPhoto" class="max-h-full max-w-full rounded-xl" alt="Sohbet fotoğrafı büyük görünüm" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useChatStore } from '~/stores/chat';
import type { ChatContact, ChatConversation, ChatMessage, GroupChatMessage } from '~/types/api';

definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const { request } = useApi();
const auth = useAuthStore();
const chat = useChatStore();
const config = useRuntimeConfig();
const token = useCookie<string | null>('auth_token');

const layoutName = computed(() => (auth.user?.role === 'STAFF' ? 'field' : 'admin'));

// [[staffId]] opsiyonel route parametresi: /chat'te undefined, /chat/xyz'de
// string döner. Böylece liste ve konuşma paneli aynı sayfa bileşeninde,
// WhatsApp Web'deki gibi yan yana kalıyor; sohbet değiştirmek tam sayfa
// geçişi değil, sadece bu parametrenin değişmesi oluyor. 'group' özel
// değeri, tüm personelin otomatik üyesi olduğu ortak sohbeti seçer.
const partnerId = computed(() => route.params.staffId as string | undefined);
const isGroup = computed(() => partnerId.value === 'group');

const contacts = ref<ChatContact[]>([]);
const partner = ref<ChatContact | null>(null);
const pending = ref(true);
const threadPending = ref(false);
const searchQuery = ref('');

const sending = ref(false);
const sendError = ref('');
const text = ref('');
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const lightboxPhoto = ref<string | null>(null);

const messages = computed<(ChatMessage | GroupChatMessage)[]>(() => {
  if (isGroup.value) return chat.groupMessages;
  return partnerId.value ? (chat.messagesByPartner[partnerId.value] ?? []) : [];
});

const groupPreviewText = computed(() => {
  const message = chat.groupMessages.at(-1);
  if (!message) return 'Henüz mesaj yok';
  const prefix = message.senderId === auth.user?.id ? 'Sen: ' : `${message.sender.fullName.split(' ')[0]}: `;
  if (message.body) return `${prefix}${message.body}`;
  if (message.photoUrl) return `${prefix}📷 Fotoğraf`;
  return '';
});

onMounted(async () => {
  try {
    const [, contactList] = await Promise.all([
      chat.fetchConversations(),
      request<ChatContact[]>('/chat/contacts'),
      chat.fetchGroupMessages(),
    ]);
    contacts.value = contactList;
  } finally {
    pending.value = false;
  }
});

const filteredConversations = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('tr-TR');
  if (!q) return chat.conversations;
  return chat.conversations.filter((c) => c.partner.fullName.toLocaleLowerCase('tr-TR').includes(q));
});

// Sohbeti olsun olmasın tüm personeli her zaman otomatik listeliyoruz —
// birinin daha önce mesajlaşılmamış olması onu bu listeden gizlemiyor.
const filteredContacts = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('tr-TR');
  if (!q) return contacts.value;
  return contacts.value.filter((c) => c.fullName.toLocaleLowerCase('tr-TR').includes(q));
});

function selectPartner(id: string) {
  router.push(`/chat/${id}`);
}

function initials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function previewText(conversation: ChatConversation) {
  const message = conversation.lastMessage;
  const prefix = message.senderId === auth.user?.id ? 'Sen: ' : '';
  if (message.body) return `${prefix}${message.body}`;
  if (message.photoUrl) return `${prefix}📷 Fotoğraf`;
  return '';
}

function formatWhen(date: string) {
  const value = new Date(date);
  const isToday = value.toDateString() === new Date().toDateString();
  return isToday
    ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(value)
    : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(value);
}

function isMine(message: ChatMessage | GroupChatMessage) {
  return message.senderId === auth.user?.id;
}

// GroupChatMessage'da readAt alanı yok (grup için okundu bilgisi tutulmuyor);
// bu yüzden 'in' kontrolüyle güvenli şekilde daralttığımız bir yardımcı
// fonksiyon kullanıyoruz — template içinde TS tür dönüştürmesi (as) yerine.
function isDmRead(message: ChatMessage | GroupChatMessage) {
  return 'readAt' in message ? Boolean(message.readAt) : false;
}

const lastGroupMessageAt = computed(() => chat.groupMessages.at(-1)?.createdAt ?? '');

function formatTime(date: string) {
  return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  });
}

async function loadConversation(id: string) {
  threadPending.value = true;
  partner.value = null;
  try {
    if (id === 'group') {
      await chat.fetchGroupMessages();
      await chat.markGroupRead();
      return;
    }
    const [contact] = await Promise.all([request<ChatContact>(`/chat/contacts/${id}`), chat.fetchMessages(id)]);
    partner.value = contact;
    await chat.markRead(id);
  } finally {
    threadPending.value = false;
    await nextTick();
    scrollToBottom();
  }
}

watch(
  partnerId,
  (id) => {
    if (id) loadConversation(id);
  },
  { immediate: true },
);

watch(
  () => messages.value.length,
  () => {
    nextTick(() => scrollToBottom());
  },
);

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

function clearFile() {
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
}

async function onSend() {
  if (!partnerId.value) return;
  if (!text.value.trim() && !selectedFile.value) return;
  sending.value = true;
  sendError.value = '';
  try {
    const formData = new FormData();
    if (!isGroup.value) formData.append('receiverId', partnerId.value);
    if (text.value.trim()) formData.append('body', text.value.trim());
    if (selectedFile.value) formData.append('file', selectedFile.value);

    const endpoint = isGroup.value ? '/chat/group/messages' : '/chat/messages';
    const response = await fetch(`${String(config.public.apiBase)}${endpoint}`, {
      method: 'POST',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Mesaj gönderilemedi');

    if (isGroup.value) {
      const { data: message } = (await response.json()) as { data: GroupChatMessage };
      chat.appendGroupMessage(message);
    } else {
      const { data: message } = (await response.json()) as { data: ChatMessage };
      chat.appendMessage(message);
    }
    text.value = '';
    clearFile();
  } catch {
    sendError.value = 'Mesaj gönderilemedi. Tekrar dene.';
  } finally {
    sending.value = false;
  }
}

// Bu sohbet açıkken karşı taraftan (ya da ekipten) yeni bir mesaj gelirse
// (soket üzerinden store'a düşer) onu da hemen okundu say.
watch(
  () => messages.value.at(-1)?.id,
  () => {
    if (!partnerId.value) return;
    const last = messages.value.at(-1);
    if (!last || isMine(last)) return;
    if (isGroup.value) {
      chat.markGroupRead().catch(() => {});
    } else if (!(last as ChatMessage).readAt) {
      chat.markRead(partnerId.value).catch(() => {});
    }
  },
);
</script>
