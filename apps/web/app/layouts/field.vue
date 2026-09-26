<template>
  <div class="min-h-screen bg-[#f7f8f4] pb-28">
    <header class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#dfe5dc] bg-[#f7f8f4]/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
      <button
        v-if="showBack"
        class="grid size-11 shrink-0 place-items-center rounded-xl border border-[#d5ded5] bg-white text-lg"
        type="button"
        aria-label="Geri"
        @click="goBack"
      >←</button>
      <NuxtLink
        v-else
        to="/field/today"
        class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-lg text-[#203d30]"
        aria-label="Ana sayfa"
      >✦</NuxtLink>
      <div class="min-w-0 text-center"><p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b786f]">Saha modu</p><h1 class="display truncate font-semibold">{{ pageTitle }}</h1></div>
      <button class="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#203d30] px-3 text-sm font-semibold text-white" type="button" aria-label="Çıkış yap" @click="auth.logout()"><span class="text-base leading-none">↗</span><span>Çıkış</span></button>
    </header>
    <!-- Diğer saha ekranları tek sütun/telefon genişliğinde tasarlandığı için
         dar (max-w-xl) tutuluyor; sohbet ise liste + konuşma panelini yan
         yana gösterdiğinden geniş ekranlarda çok daha fazla yatay alana
         ihtiyaç duyuyor. -->
    <main class="mx-auto px-5 py-6" :class="isChatRoute ? 'max-w-6xl' : 'max-w-xl'"><slot /></main>
    <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-[#dfe5dc] bg-white/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div class="mx-auto flex max-w-xl items-center justify-between gap-3">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold transition"
          :class="isActive(item.to) ? 'bg-[#d8e8cc] text-[#203d30]' : 'text-[#6b786f]'"
        >
          <span class="text-xl leading-4">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span
            v-if="item.to === '/chat' && chat.unreadCount"
            class="absolute right-3 top-1 grid size-4 place-items-center rounded-full bg-[#a15d47] text-[9px] font-bold text-white"
          >
            {{ chat.unreadCount > 9 ? '9+' : chat.unreadCount }}
          </span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useChatStore } from '~/stores/chat';

const auth = useAuthStore();
const chat = useChatStore();
const router = useRouter();
const route = useRoute();

const navItems = [
  { to: '/field/today', icon: '⌂', label: 'Bugün' },
  { to: '/field/plants', icon: '⚘', label: 'Bitkiler' },
  { to: '/chat', icon: '✉', label: 'Sohbet' },
  { to: '/field/scan', icon: '⌗', label: 'QR Tara' },
  { to: '/field/menu', icon: '☰', label: 'Menü' },
];

const isActive = (path: string) => (path === '/chat' ? route.path.startsWith('/chat') : route.path === path);
const showBack = computed(() => !navItems.some((item) => isActive(item.to)));
const isChatRoute = computed(() => route.path.startsWith('/chat'));

const pageTitle = computed(() => {
  if (route.path.startsWith('/field/scan')) return 'QR kodu okut';
  if (route.path.startsWith('/field/menu')) return 'Menü';
  if (route.path.startsWith('/field/plants')) return 'Bitkilerim';
  if (route.path.startsWith('/field/identify')) return 'Bitki Tanı';
  if (route.path.startsWith('/plants/')) return 'Bitki detayı';
  if (route.path === '/chat') return 'Sohbet';
  if (route.path.startsWith('/chat/')) return 'Sohbet';
  return 'Bugünün bakımları';
});

function goBack() {
  // Sayfa doğrudan bu ekrana açıldıysa (ör. QR taramadan sonra, yenilemeden
  // sonra ya da geçmişte önceki sayfa yoksa) router.back() hiçbir şey
  // yapmaz ve kullanıcı ekranda "takılı" kalır. Geçmiş yoksa ana sekmeye dön.
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/field/today');
  }
}
</script>
