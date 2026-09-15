<template>
  <div>
    <div class="mb-7"><p class="text-sm text-[#68736d]">{{ formattedToday }}</p><h2 class="display mt-2 text-3xl font-semibold tracking-tight">Sahada seni bekleyenler</h2><p class="mt-2 text-sm leading-6 text-[#68736d]">Geciken ve bugün yapılması gereken bakımlar burada.</p></div>
    <div class="mb-6 grid grid-cols-2 gap-3"><div class="rounded-2xl bg-[#203d30] p-4 text-white"><span class="text-sm text-[#b8cdbb]">Bugünün listesi</span><strong class="display mt-2 block text-3xl">{{ tasks?.length ?? 0 }}</strong></div><div class="rounded-2xl bg-[#d8e8cc] p-4 text-[#203d30]"><span class="text-sm text-[#52715d]">Saha modu</span><strong class="mt-2 block text-sm leading-5">Hazır ve sade</strong></div></div>
    <div v-if="pending" class="space-y-3"><div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-2xl bg-[#e5ebe3]" /></div>
    <div v-else-if="!tasks?.length" class="panel p-7 text-center"><span class="mx-auto grid size-14 place-items-center rounded-full bg-[#e4f0dd] text-2xl text-[#2f6b4f]">✓</span><h3 class="display mt-4 text-xl font-semibold">Bugünlük tamam</h3><p class="mt-2 text-sm leading-6 text-[#68736d]">Şu an bekleyen bakım görevi görünmüyor.</p></div>
    <div v-else class="space-y-3"><article v-for="plant in tasks" :key="plant.id" class="panel p-5"><div class="flex items-start justify-between gap-4"><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6b4f]">{{ plant.plantCode }}</p><h3 class="display mt-2 truncate text-lg font-semibold">{{ plant.name }}</h3><p class="mt-1 truncate text-sm text-[#68736d]">{{ plant.location.customer.name }} · {{ plant.location.name }}</p></div><span class="shrink-0 rounded-lg bg-[#f7e5de] px-2 py-1 text-xs font-semibold text-[#a15d47]">{{ isOverdue(plant.nextMaintenanceDate) ? 'Gecikti' : 'Bugün' }}</span></div><button class="button-secondary mt-5 w-full !min-h-12" type="button">Bakımı aç</button></article></div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { PlantTask } from '~/types/api';

definePageMeta({ layout: 'field' });
const auth = useAuthStore();
const { request } = useApi();
const { data: tasks, pending } = await useAsyncData('today-tasks', () => request<PlantTask[]>(`/staff/${auth.user?.id}/today-tasks`));
const formattedToday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const isOverdue = (date: string | null) => Boolean(date && new Date(date) < new Date(new Date().setHours(0, 0, 0, 0)));
</script>
