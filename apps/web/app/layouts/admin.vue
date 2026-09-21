<template>
  <div class="min-h-screen bg-[#f7f8f4]">
    <aside class="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-[#dfe5dc] bg-[#203d30] px-6 py-7 text-white lg:flex">
      <NuxtLink to="/dashboard" class="mb-12 flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-2xl bg-[#d8e8cc] text-xl text-[#203d30]">✦</span>
        <span><strong class="display block text-lg">Verdant</strong><small class="text-xs text-[#b8cdbb]">Bitki bakım merkezi</small></span>
      </NuxtLink>
      <nav class="space-y-2 text-sm">
        <a href="/dashboard" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◈ <span>Genel bakış</span></a>
        <a href="/customers" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">⌂ <span>Müşteriler</span></a>
        <a href="/plants" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◌ <span>Bitki envanteri</span></a>
        <a href="/maintenance-logs" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">✓ <span>Bakım kayıtları ve bakımlar</span></a>
        <a href="/staff" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◎ <span>Personel</span></a>
        <a href="/chat" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">
          ✉ <span class="flex-1">Sohbet</span>
          <span v-if="chat.unreadCount" class="grid size-5 place-items-center rounded-full bg-[#d8e8cc] text-[10px] font-bold text-[#203d30]">
            {{ chat.unreadCount > 9 ? '9+' : chat.unreadCount }}
          </span>
        </a>
      </nav>
      <div class="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-[#b8cdbb]">Bugünün odağı</p>
        <p class="mt-2 text-sm leading-5 text-white">Saha ekibinin bakım akışını tek bakışta tut.</p>
      </div>
    </aside>

    <!-- Mobil menü: küçük ekranlarda soldaki kayar panel + arka plan karartması -->
    <Transition name="admin-mobile-fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 bg-black/40 lg:hidden" @click="mobileMenuOpen = false" />
    </Transition>
    <Transition name="admin-mobile-slide">
      <aside
        v-if="mobileMenuOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#203d30] px-6 py-7 text-white lg:hidden"
      >
        <div class="mb-10 flex items-center justify-between">
          <NuxtLink to="/dashboard" class="flex items-center gap-3" @click="mobileMenuOpen = false">
            <span class="grid size-11 place-items-center rounded-2xl bg-[#d8e8cc] text-xl text-[#203d30]">✦</span>
            <span><strong class="display block text-lg">Verdant</strong><small class="text-xs text-[#b8cdbb]">Bitki bakım merkezi</small></span>
          </NuxtLink>
          <button class="text-2xl leading-none text-white/70" type="button" aria-label="Menüyü kapat" @click="mobileMenuOpen = false">×</button>
        </div>
        <nav class="space-y-2 text-sm">
          <a href="/dashboard" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◈ <span>Genel bakış</span></a>
          <a href="/customers" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">⌂ <span>Müşteriler</span></a>
          <a href="/plants" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◌ <span>Bitki envanteri</span></a>
          <a href="/maintenance-logs" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">✓ <span>Bakım kayıtları ve bakımlar</span></a>
          <a href="/staff" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◎ <span>Personel</span></a>
          <a href="/chat" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">
            ✉ <span class="flex-1">Sohbet</span>
            <span v-if="chat.unreadCount" class="grid size-5 place-items-center rounded-full bg-[#d8e8cc] text-[10px] font-bold text-[#203d30]">
              {{ chat.unreadCount > 9 ? '9+' : chat.unreadCount }}
            </span>
          </a>
        </nav>
        <div class="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs text-[#b8cdbb]">Bugünün odağı</p>
          <p class="mt-2 text-sm leading-5 text-white">Saha ekibinin bakım akışını tek bakışta tut.</p>
        </div>
      </aside>
    </Transition>

    <main class="min-h-screen lg:pl-72">
      <header class="flex items-center justify-between border-b border-[#dfe5dc] bg-[#f7f8f4]/90 px-5 py-4 backdrop-blur lg:px-10">
        <div class="flex items-center gap-3">
          <button
            class="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe5dc] text-lg text-[#203d30] lg:hidden"
            type="button"
            aria-label="Menüyü aç"
            @click="mobileMenuOpen = true"
          >
            ☰
          </button>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b786f]">Yönetim paneli</p>
            <h1 class="display mt-1 text-xl font-semibold">Bitki bakım merkezi</h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden text-right sm:block"><strong class="block text-sm">{{ auth.user?.fullName }}</strong><small class="text-xs text-[#6b786f]">Yönetici</small></span>
          <button class="button-secondary !min-h-10 !px-3 text-sm" type="button" @click="auth.logout()">Çıkış</button>
        </div>
      </header>
      <div class="p-5 lg:p-10"><slot /></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useChatStore } from '~/stores/chat';

const auth = useAuthStore();
const chat = useChatStore();
const mobileMenuOpen = ref(false);
</script>

<style scoped>
.admin-mobile-fade-enter-active,
.admin-mobile-fade-leave-active {
  transition: opacity 0.2s ease;
}
.admin-mobile-fade-enter-from,
.admin-mobile-fade-leave-to {
  opacity: 0;
}
.admin-mobile-slide-enter-active,
.admin-mobile-slide-leave-active {
  transition: transform 0.25s ease;
}
.admin-mobile-slide-enter-from,
.admin-mobile-slide-leave-to {
  transform: translateX(-100%);
}
</style>
