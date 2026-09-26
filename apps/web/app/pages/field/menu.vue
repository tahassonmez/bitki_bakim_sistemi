<template>
  <div>
    <div class="panel mb-6 flex items-center gap-4 p-5">
      <span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#203d30] text-xl font-semibold text-white">{{ initials }}</span>
      <div class="min-w-0">
        <h2 class="display truncate text-lg font-semibold">{{ auth.user?.fullName }}</h2>
        <p class="truncate text-sm text-[#68736d]">{{ auth.user?.email }}</p>
        <span class="mt-1 inline-block rounded-full bg-[#d8e8cc] px-2 py-0.5 text-xs font-semibold text-[#203d30]">Saha personeli</span>
      </div>
    </div>

    <div class="space-y-3">
      <NuxtLink to="/field/today" class="panel flex items-center justify-between p-4">
        <span class="flex items-center gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-lg text-[#203d30]">⌂</span><span class="font-semibold">Bugünün görevleri</span></span>
        <span class="text-[#8a948d]">›</span>
      </NuxtLink>
      <NuxtLink to="/field/plants" class="panel flex items-center justify-between p-4">
        <span class="flex items-center gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-lg text-[#203d30]">⚘</span><span class="font-semibold">Bitkilerim</span></span>
        <span class="text-[#8a948d]">›</span>
      </NuxtLink>
      <NuxtLink to="/field/scan" class="panel flex items-center justify-between p-4">
        <span class="flex items-center gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-lg text-[#203d30]">⌗</span><span class="font-semibold">QR kodu okut</span></span>
        <span class="text-[#8a948d]">›</span>
      </NuxtLink>
      <NuxtLink to="/field/identify" class="panel flex items-center justify-between p-4">
        <span class="flex items-center gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-lg text-[#203d30]">✧</span><span class="font-semibold">Bitki Tanı</span></span>
        <span class="text-[#8a948d]">›</span>
      </NuxtLink>
    </div>

    <div class="panel mt-6 p-5">
      <p class="text-sm font-semibold">Bitki Bakım Sistemi</p>
      <p class="mt-1 text-sm leading-6 text-[#68736d]">Sürüm 1.0 · Jungleous saha uygulaması</p>
    </div>

    <button class="button-secondary mt-6 w-full !min-h-12 !border-[#e4cfc5] !text-[#a15d47]" type="button" @click="auth.logout()">Çıkış yap</button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ layout: 'field' });
const auth = useAuthStore();

const initials = computed(() => {
  const name = auth.user?.fullName?.trim();
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
});
</script>
