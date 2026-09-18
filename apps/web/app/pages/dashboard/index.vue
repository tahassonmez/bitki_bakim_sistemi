<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="text-sm text-[#6b786f]">{{ greeting }}, {{ auth.user?.fullName }}</p><h2 class="display mt-2 text-3xl font-semibold tracking-tight">Bugünün görünümü</h2></div><span class="rounded-full bg-[#e4f0dd] px-4 py-2 text-sm font-semibold text-[#2f6b4f]">Canlı operasyon</span></div>
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div v-for="item in 4" :key="item" class="h-32 animate-pulse rounded-2xl bg-[#e5ebe3]" /></div>
    <div v-else-if="hasError" class="panel border-[#e4cfc5] bg-[#fff8f5] p-8 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#f7e5de] text-2xl text-[#a15d47]">!</span>
      <h3 class="display mt-4 text-xl font-semibold">Sunucuya bağlanılamadı</h3>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">API çalışmıyor olabilir. Sunucuyu kontrol edip tekrar dene.</p>
      <button class="button-secondary mt-5" type="button" @click="reloadAll">Tekrar dene</button>
    </div>
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in cards" :key="card.label" class="panel p-5"><div class="flex items-start justify-between"><span class="text-sm text-[#68736d]">{{ card.label }}</span><span class="grid size-9 place-items-center rounded-xl" :class="card.color">{{ card.icon }}</span></div><strong class="display mt-6 block text-3xl">{{ card.value }}</strong></article>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-2">
        <section class="panel p-6">
          <div class="flex items-center justify-between">
            <div><p class="text-sm font-semibold text-[#2f6b4f]">Sonraki 7 gün</p><h3 class="display mt-1 text-xl font-semibold">Bakım yoğunluğu</h3></div>
            <span class="grid size-9 place-items-center rounded-xl bg-[#e4f0dd] text-[#2f6b4f]">◈</span>
          </div>
          <div class="mt-7 grid grid-cols-7 gap-2">
            <div v-for="day in upcomingByDay" :key="day.iso" class="flex flex-col items-center gap-1">
              <span class="text-xs font-semibold text-[#203d30]">{{ day.count }}</span>
              <div class="flex h-28 w-full items-end justify-center">
                <div class="w-full max-w-[22px] rounded-t-md bg-[#2f6b4f] transition-all" :style="{ height: day.barHeight + 'px' }" />
              </div>
              <span class="text-[11px] font-medium uppercase tracking-wide text-[#8a948d]">{{ day.label }}</span>
            </div>
          </div>
        </section>

        <section class="panel p-6">
          <div class="flex items-center justify-between">
            <div><p class="text-sm font-semibold text-[#4d668f]">Son 30 gün</p><h3 class="display mt-1 text-xl font-semibold">Bakım türü dağılımı</h3></div>
            <span class="grid size-9 place-items-center rounded-xl bg-[#e8edf6] text-[#4d668f]">◌</span>
          </div>
          <div v-if="breakdownError" class="mt-8 rounded-xl bg-[#fff8f5] p-5 text-sm text-[#a15d47]">Bu grafik yüklenemedi.</div>
          <div v-else-if="!actionBreakdown?.length" class="mt-8 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Son 30 günde bakım kaydı yok.</div>
          <div v-else class="mt-6 space-y-3">
            <div v-for="item in actionBreakdown" :key="item.typeId" class="flex items-center gap-3">
              <span class="w-32 shrink-0 truncate text-sm text-[#52514e]" :title="item.name">{{ item.name }}</span>
              <div class="h-3 flex-1 overflow-hidden rounded-full bg-[#eef1ec]">
                <div class="h-full rounded-full bg-[#4d668f]" :style="{ width: `${Math.max(4, Math.round((item.count / breakdownMax) * 100))}%` }" />
              </div>
              <span class="w-6 shrink-0 text-right text-sm font-semibold text-[#203d30]">{{ item.count }}</span>
            </div>
          </div>
        </section>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section class="panel p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-semibold text-[#2f6b4f]">Takvimde sıradaki</p><h3 class="display mt-1 text-xl font-semibold">Yaklaşan bakımlar</h3></div><span class="rounded-full bg-[#f0f4ed] px-3 py-1 text-xs font-semibold text-[#68736d]">7 gün</span></div><div v-if="!upcoming?.length" class="mt-8 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Yaklaşan bakım bulunmuyor.</div><div v-else class="mt-6 divide-y divide-[#edf0eb]"> <div v-for="plant in upcoming" :key="plant.id" class="flex items-center justify-between gap-4 py-4 first:pt-0"><div class="min-w-0"><p class="truncate font-semibold">{{ plant.name }}</p><p class="mt-1 truncate text-sm text-[#68736d]">{{ plant.location.customer.name }} · {{ plant.location.name }}</p></div><time class="shrink-0 rounded-lg bg-[#edf4ed] px-3 py-2 text-xs font-semibold text-[#2f6b4f]">{{ formatDate(plant.nextMaintenanceDate) }}</time></div></div></section>
        <section class="panel border-[#e4cfc5] p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-semibold text-[#a15d47]">Dikkat gerekiyor</p><h3 class="display mt-1 text-xl font-semibold">Geciken bakımlar</h3></div><span class="grid size-9 place-items-center rounded-xl bg-[#f7e5de] text-[#a15d47]">!</span></div><div v-if="!overdue?.length" class="mt-8 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Geciken bakım yok. Ekip iyi gidiyor.</div><div v-else class="mt-6 space-y-3"><div v-for="plant in overdue.slice(0, 5)" :key="plant.id" class="rounded-xl bg-[#fff8f5] p-4"><p class="font-semibold">{{ plant.name }}</p><p class="mt-1 text-sm text-[#a15d47]">{{ plant.plantCode }} · {{ formatDate(plant.nextMaintenanceDate) }}</p></div></div></section>
      </div>
      <section class="panel mt-6 p-6">
        <div class="flex items-center justify-between">
          <div><p class="text-sm font-semibold text-[#2f6b4f]">Aktivite akışı</p><h3 class="display mt-1 text-xl font-semibold">Son yapılan bakımlar</h3></div>
        </div>
        <div v-if="!recentLogs?.length" class="mt-8 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Henüz bakım kaydı yok.</div>
        <div v-else class="mt-6 divide-y divide-[#edf0eb]">
          <NuxtLink v-for="log in recentLogs" :key="log.id" :to="`/plants/${log.plant.id}`" class="flex items-center justify-between gap-4 py-4 first:pt-0 transition hover:bg-[#f7f8f4]">
            <div class="min-w-0">
              <p class="truncate font-semibold">{{ log.plant.name }}</p>
              <p class="mt-1 truncate text-sm text-[#68736d]">{{ log.plant.location.customer.name }} · {{ log.plant.location.name }} · {{ log.staff.fullName }}</p>
              <p class="mt-1 truncate text-xs text-[#8a948d]">{{ log.actions.map((action) => action.type.name).join(', ') || 'Kayıt notu yok' }}</p>
            </div>
            <time class="shrink-0 rounded-lg bg-[#edf4ed] px-3 py-2 text-xs font-semibold text-[#2f6b4f]">{{ formatDate(log.date) }}</time>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { ActionBreakdownItem, DashboardSummary, PlantTask, RecentMaintenanceLog } from '~/types/api';

definePageMeta({ layout: 'admin' });
const auth = useAuthStore();
const { request } = useApi();
const greeting = computed(() => { const hour = new Date().getHours(); return hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'; });
const { data: summary, pending, error: summaryError, refresh: refreshSummary } = await useAsyncData('dashboard-summary', () => request<DashboardSummary>('/dashboard/summary'));
const { data: upcoming, error: upcomingError, refresh: refreshUpcoming } = await useAsyncData('dashboard-upcoming', () => request<PlantTask[]>('/dashboard/upcoming?days=7'));
const { data: overdue, error: overdueError, refresh: refreshOverdue } = await useAsyncData('dashboard-overdue', () => request<PlantTask[]>('/dashboard/overdue'));
const { data: recentLogs, error: recentError, refresh: refreshRecent } = await useAsyncData('dashboard-recent-logs', () => request<RecentMaintenanceLog[]>('/dashboard/recent-logs?limit=15'));
const { data: actionBreakdown, error: breakdownError, refresh: refreshBreakdown } = await useAsyncData('dashboard-action-breakdown', () => request<ActionBreakdownItem[]>('/dashboard/action-breakdown?days=30'));
const hasError = computed(() => Boolean(summaryError.value || upcomingError.value || overdueError.value || recentError.value));
const reloadAll = () => Promise.all([refreshSummary(), refreshUpcoming(), refreshOverdue(), refreshRecent(), refreshBreakdown()]);
const cards = computed(() => [
  { label: 'Aktif müşteriler', value: summary.value?.customerCount ?? 0, icon: '⌂', color: 'bg-[#e4f0dd] text-[#2f6b4f]' },
  { label: 'Takipteki bitkiler', value: summary.value?.plantCount ?? 0, icon: '◌', color: 'bg-[#e8edf6] text-[#4d668f]' },
  { label: 'Aktif personel', value: summary.value?.staffCount ?? 0, icon: '◎', color: 'bg-[#f4ead5] text-[#9a6d2e]' },
  { label: 'Bugünkü bakımlar', value: summary.value?.todayMaintenanceCount ?? 0, icon: '✓', color: 'bg-[#f0e5ed] text-[#86516f]' },
]);
const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(date)) : 'Tarih yok';

const upcomingByDay = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });
  const raw = buckets.map((date) => {
    const dayStart = date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = (upcoming.value ?? []).filter((plant) => {
      if (!plant.nextMaintenanceDate) return false;
      const time = new Date(plant.nextMaintenanceDate).getTime();
      return time >= dayStart && time < dayEnd;
    }).length;
    return { date, count };
  });
  const max = Math.max(1, ...raw.map((item) => item.count));
  return raw.map((item) => ({
    iso: item.date.toISOString(),
    count: item.count,
    label: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(item.date),
    barHeight: Math.max(6, Math.round((item.count / max) * 104)),
  }));
});

const breakdownMax = computed(() => Math.max(1, ...(actionBreakdown.value ?? []).map((item) => item.count)));
</script>
