<template>
  <div>
    <div class="mb-6"><p class="text-sm text-[#68736d]">{{ formattedToday }}</p><h2 class="display mt-2 text-3xl font-semibold tracking-tight">Sahada seni bekleyenler</h2><p class="mt-2 text-sm leading-6 text-[#68736d]">Geciken, bugün ve önümüzdeki günlerdeki bakımlar burada.</p></div>

    <div class="mb-5 grid grid-cols-3 gap-3">
      <div class="rounded-2xl bg-[#203d30] p-4 text-white">
        <span class="text-sm text-[#b8cdbb]">Toplam görev</span>
        <strong class="display mt-2 block text-3xl">{{ todayTasks?.length ?? 0 }}</strong>
      </div>
      <div class="rounded-2xl p-4" :class="overdueCount > 0 ? 'bg-[#f7e5de]' : 'bg-[#d8e8cc]'">
        <span class="text-sm" :class="overdueCount > 0 ? 'text-[#a15d47]' : 'text-[#52715d]'">Gecikmiş</span>
        <strong class="display mt-2 block text-3xl" :class="overdueCount > 0 ? 'text-[#a15d47]' : 'text-[#203d30]'">{{ overdueCount }}</strong>
      </div>
      <div class="rounded-2xl bg-[#eef1ea] p-4">
        <span class="text-sm text-[#52715d]">Yaklaşan</span>
        <strong class="display mt-2 block text-3xl text-[#203d30]">{{ upcomingTasks?.length ?? 0 }}</strong>
      </div>
    </div>

    <div v-if="hasAnyTasks" class="relative mb-5">
      <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a948d]">⌕</span>
      <input v-model="search" type="text" class="field-input pl-10" placeholder="Bitki, müşteri ya da konum ara..." />
    </div>

    <div v-if="pending" class="space-y-3"><div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-2xl bg-[#e5ebe3]" /></div>

    <div v-else-if="error" class="panel border-[#e4cfc5] bg-[#fff8f5] p-7 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#f7e5de] text-2xl text-[#a15d47]">!</span>
      <h3 class="display mt-4 text-xl font-semibold">Bağlantı sorunu</h3>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.</p>
      <button class="button-secondary mt-5" type="button" @click="refresh()">Tekrar dene</button>
    </div>

    <div v-else-if="!hasAnyTasks" class="panel p-7 text-center"><span class="mx-auto grid size-14 place-items-center rounded-full bg-[#e4f0dd] text-2xl text-[#2f6b4f]">✓</span><h3 class="display mt-4 text-xl font-semibold">Bugünlük tamam</h3><p class="mt-2 text-sm leading-6 text-[#68736d]">Şu an bekleyen ya da yaklaşan bir bakım görevi görünmüyor.</p></div>

    <div v-else-if="!hasAnyFiltered" class="panel p-7 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#e5ebe3] text-2xl text-[#68736d]">⌕</span>
      <h3 class="display mt-4 text-xl font-semibold">Sonuç bulunamadı</h3>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">"{{ search }}" ile eşleşen bir görev yok.</p>
    </div>

    <div v-else class="space-y-6">
      <section v-if="filteredOverdue.length">
        <div class="mb-3 flex items-center gap-2">
          <h3 class="text-sm font-semibold uppercase tracking-[0.1em] text-[#a15d47]">Gecikenler</h3>
          <span class="rounded-full bg-[#f7e5de] px-2 py-0.5 text-xs font-semibold text-[#a15d47]">{{ filteredOverdue.length }}</span>
        </div>
        <div class="space-y-3">
          <PlantTaskCard v-for="plant in filteredOverdue" :key="plant.id" :plant="plant" overdue @open="router.push(`/plants/${plant.id}`)" />
        </div>
      </section>

      <section v-if="filteredDueToday.length">
        <div class="mb-3 flex items-center gap-2">
          <h3 class="text-sm font-semibold uppercase tracking-[0.1em] text-[#2f6b4f]">Bugün</h3>
          <span class="rounded-full bg-[#d8e8cc] px-2 py-0.5 text-xs font-semibold text-[#203d30]">{{ filteredDueToday.length }}</span>
        </div>
        <div class="space-y-3">
          <PlantTaskCard v-for="plant in filteredDueToday" :key="plant.id" :plant="plant" @open="router.push(`/plants/${plant.id}`)" />
        </div>
      </section>

      <section v-if="filteredUpcoming.length" class="panel p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-[#52715d]">Takvimde sıradaki</p>
            <h3 class="display mt-1 text-xl font-semibold">Yaklaşan bakımlar</h3>
          </div>
          <span class="rounded-full bg-[#f0f4ed] px-3 py-1 text-xs font-semibold text-[#68736d]">{{ filteredUpcoming.length }}</span>
        </div>
        <div class="mt-6 divide-y divide-[#edf0eb]">
          <button
            v-for="plant in filteredUpcoming"
            :key="plant.id"
            type="button"
            class="flex w-full items-center justify-between gap-4 py-4 text-left first:pt-0"
            @click="router.push(`/plants/${plant.id}`)"
          >
            <div class="min-w-0">
              <p class="truncate font-semibold">{{ plant.name }}</p>
              <p class="mt-1 truncate text-sm text-[#68736d]">{{ plant.location.customer.name }} · {{ plant.location.name }}</p>
            </div>
            <time class="shrink-0 rounded-lg bg-[#edf4ed] px-3 py-2 text-xs font-semibold text-[#2f6b4f]">{{ formatShortDate(plant.nextMaintenanceDate) }}</time>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { PlantTask } from '~/types/api';

definePageMeta({ layout: 'field' });
const auth = useAuthStore();
const router = useRouter();
const { request } = useApi();

const {
  data: todayTasks,
  pending: todayPending,
  error: todayError,
  refresh: refreshToday,
} = await useAsyncData('today-tasks', () => request<PlantTask[]>(`/staff/${auth.user?.id}/today-tasks`));

const {
  data: upcomingTasks,
  pending: upcomingPending,
  error: upcomingError,
  refresh: refreshUpcoming,
} = await useAsyncData('upcoming-tasks', () => request<PlantTask[]>(`/staff/${auth.user?.id}/upcoming-tasks?days=7`));

const pending = computed(() => todayPending.value || upcomingPending.value);
const error = computed(() => todayError.value || upcomingError.value);
function refresh() {
  return Promise.all([refreshToday(), refreshUpcoming()]);
}

const formattedToday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const formatShortDate = (date: string | null) =>
  date ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(date)) : '';
const isOverdue = (date: string | null) => Boolean(date && new Date(date) < new Date(new Date().setHours(0, 0, 0, 0)));

const search = ref('');

function matchesSearch(plant: PlantTask) {
  const term = search.value.trim().toLowerCase();
  if (!term) return true;
  return [plant.name, plant.species, plant.plantCode, plant.location.name, plant.location.customer.name].some((field) =>
    field.toLowerCase().includes(term),
  );
}

const hasAnyTasks = computed(() => (todayTasks.value?.length ?? 0) > 0 || (upcomingTasks.value?.length ?? 0) > 0);

const overdueCount = computed(() => (todayTasks.value ?? []).filter((plant) => isOverdue(plant.nextMaintenanceDate)).length);
const filteredOverdue = computed(() => (todayTasks.value ?? []).filter((plant) => isOverdue(plant.nextMaintenanceDate) && matchesSearch(plant)));
const filteredDueToday = computed(() => (todayTasks.value ?? []).filter((plant) => !isOverdue(plant.nextMaintenanceDate) && matchesSearch(plant)));
const filteredUpcoming = computed(() => (upcomingTasks.value ?? []).filter((plant) => matchesSearch(plant)));

const hasAnyFiltered = computed(
  () => filteredOverdue.value.length > 0 || filteredDueToday.value.length > 0 || filteredUpcoming.value.length > 0,
);
</script>
