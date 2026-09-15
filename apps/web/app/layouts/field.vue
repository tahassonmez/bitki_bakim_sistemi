<template>
  <div class="min-h-screen bg-[#f7f8f4] pb-24">
    <header class="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe5dc] bg-[#f7f8f4]/95 px-5 py-4 backdrop-blur">
      <button class="grid size-11 place-items-center rounded-xl border border-[#d5ded5] bg-white text-lg" type="button" aria-label="Geri" @click="router.back()">←</button>
      <div class="text-center"><p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b786f]">Saha modu</p><h1 class="display font-semibold">Bugünün bakımları</h1></div>
      <button class="grid size-11 place-items-center rounded-xl bg-[#203d30] text-sm text-white" type="button" aria-label="Çıkış" @click="auth.logout()">↗</button>
    </header>
    <main class="mx-auto max-w-xl px-5 py-6"><slot /></main>
    <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-[#dfe5dc] bg-white/95 px-5 py-3 backdrop-blur">
      <div class="mx-auto flex max-w-xl items-center justify-between gap-3">
        <NuxtLink to="/field/today" class="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-[#2f6b4f]">⌂<span>Bugün</span></NuxtLink>
        <button class="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#d8e8cc] py-2 text-xs font-semibold text-[#203d30]" type="button"><span class="text-xl leading-4">⌗</span><span>QR Tara</span></button>
        <NuxtLink to="/field/today" class="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-[#6b786f]">☰<span>Menü</span></NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const router = useRouter();
</script>
