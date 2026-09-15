<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="text-sm text-[#6b786f]">{{ greeting }}, {{ auth.user?.fullName }}</p><h2 class="display mt-2 text-3xl font-semibold tracking-tight">Bugünün görünümü</h2></div><span class="rounded-full bg-[#e4f0dd] px-4 py-2 text-sm font-semibold text-[#2f6b4f]">Canlı operasyon</span></div>
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div v-for="item in 4" :key="item" class="h-32 animate-pulse rounded-2xl bg-[#e5ebe3]" /></div>
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in cards" :key="card.label" class="panel p-5"><div class="flex items-start justify-between"><span class="text-sm text-[#68736d]">{{ card.label }}</span><span class="grid size-9 place-items-center rounded-xl" :class="card.color">{{ card.icon }}</span></div><strong class="display mt-6 block text-3xl">{{ card.value }}</strong></article>
      </div>
      <div class="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section class="panel p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-semibold text-[#2f6b4f]">Takvimde sıradaki</p><h3 class="display mt-1 text-xl font-semibold">Yaklaşan bakımlar</h3></div><span class="rounded-full bg-[#f0f4ed] px-3 py-1 text-xs font-semibold text-[#68736d]">7 gün</span></div><div v-if="!upcoming?.length" class="mt-8 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Yaklaşan bakım bulunmuyor.</div><div v-else class="mt-6 divide-y divide-[#edf0eb]"> <div v-for="plant in upcoming" :key="plant.id" class="flex items-center justify-between gap-4 py-4 first:pt-0"><div class="min-w-0"><p class="truncate font-semibold">{{ plant.name }}</p><p class="mt-1 truncate text-sm text-[#68736d]">{{ plant.location.customer.name }} · {{ plant.location.name }}</p></div><time class="shrink-0 rounded-lg bg-[#edf4ed] px-3 py-2 text-xs font-semibold text-[#2f6b4f]">{{ formatDate(plant.nextMaintenanceDate) }}</time></div></div></section>
        <section class="panel border-[#e4cfc5] p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-semibold text-[#a15d47]">Dikkat gerekiyor</p><h3 class="display mt-1 text-xl font-semibold">Geciken bakımlar</h3></div><span class="grid size-9 place-items-center rounded-xl bg-[#f7e5de] text-[#a15d47]">!</span></div><div v-if="!overdue?.length" class="mt-8 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Geciken bakım yok. Ekip iyi gidiyor.</div><div v-else class="mt-6 space-y-3"><div v-for="plant in overdue.slice(0, 5)" :key="plant.id" class="rounded-xl bg-[#fff8f5] p-4"><p class="font-semibold">{{ plant.name }}</p><p class="mt-1 text-sm text-[#a15d47]">{{ plant.plantCode }} · {{ formatDate(plant.nextMaintenanceDate) }}</p></div></div></section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { DashboardSummary, PlantTask } from '~/types/api';

definePageMeta({ layout: 'admin' });
const auth = useAuthStore();
const { request } = useApi();
const greeting = computed(() => { const hour = new Date().getHours(); return hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'; });
const { data: summary, pending } = await useAsyncData('dashboard-summary', () => request<DashboardSummary>('/dashboard/summary'));
const { data: upcoming } = await useAsyncData('dashboard-upcoming', () => request<PlantTask[]>('/dashboard/upcoming?days=7'));
const { data: overdue } = await useAsyncData('dashboard-overdue', () => request<PlantTask[]>('/dashboard/overdue'));
const cards = computed(() => [
  { label: 'Aktif müşteriler', value: summary.value?.customerCount ?? 0, icon: '⌂', color: 'bg-[#e4f0dd] text-[#2f6b4f]' },
  { label: 'Takipteki bitkiler', value: summary.value?.plantCount ?? 0, icon: '◌', color: 'bg-[#e8edf6] text-[#4d668f]' },
  { label: 'Aktif personel', value: summary.value?.staffCount ?? 0, icon: '◎', color: 'bg-[#f4ead5] text-[#9a6d2e]' },
  { label: 'Bugünkü bakımlar', value: summary.value?.todayMaintenanceCount ?? 0, icon: '✓', color: 'bg-[#f0e5ed] text-[#86516f]' },
]);
const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(date)) : 'Tarih yok';
</script>
