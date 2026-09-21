<template>
  <div>
    <div class="mb-6">
      <h2 class="display text-3xl font-semibold tracking-tight">Bitkilerim</h2>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">Bakmakla yükümlü olduğun müşterilerin tüm bitkileri burada.</p>
    </div>

    <div class="mb-5 grid grid-cols-2 gap-3">
      <div class="rounded-2xl bg-[#203d30] p-4 text-white">
        <span class="text-sm text-[#b8cdbb]">Toplam bitki</span>
        <strong class="display mt-2 block text-3xl">{{ plants?.length ?? 0 }}</strong>
      </div>
      <div class="rounded-2xl bg-[#eef1ea] p-4">
        <span class="text-sm text-[#52715d]">Müşteri sayısı</span>
        <strong class="display mt-2 block text-3xl text-[#203d30]">{{ customerGroups.length }}</strong>
      </div>
    </div>

    <div v-if="hasAnyPlants" class="relative mb-5">
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

    <div v-else-if="!hasAnyPlants" class="panel p-7 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#e5ebe3] text-2xl text-[#68736d]">⌾</span>
      <h3 class="display mt-4 text-xl font-semibold">Henüz bitki yok</h3>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">Sana atanmış bir müşteri ya da bitki bulunmuyor. Yöneticinle iletişime geç.</p>
    </div>

    <div v-else-if="!customerGroups.length" class="panel p-7 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#e5ebe3] text-2xl text-[#68736d]">⌕</span>
      <h3 class="display mt-4 text-xl font-semibold">Sonuç bulunamadı</h3>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">"{{ search }}" ile eşleşen bir bitki yok.</p>
    </div>

    <div v-else class="space-y-6">
      <section v-for="group in customerGroups" :key="group.customerName">
        <div class="mb-3 flex items-center gap-2">
          <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-[#eef1ea] text-sm text-[#52715d]">⌂</span>
          <h3 class="truncate text-sm font-semibold uppercase tracking-[0.1em] text-[#52715d]">{{ group.customerName }}</h3>
          <span class="shrink-0 rounded-full bg-[#eef1ea] px-2 py-0.5 text-xs font-semibold text-[#52715d]">{{ group.plants.length }}</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <article
            v-for="plant in group.plants"
            :key="plant.id"
            class="panel cursor-pointer p-3 transition active:scale-[0.99]"
            @click="router.push(`/plants/${plant.id}`)"
          >
            <div class="flex items-start gap-2">
              <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-sm text-[#203d30]">⚘</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-[#2f6b4f]">{{ plant.plantCode }}</p>
                <h4 class="display mt-0.5 truncate text-sm font-semibold">{{ plant.name }}</h4>
              </div>
            </div>
            <p class="mt-2 truncate text-xs text-[#68736d]">{{ plant.species }}</p>
            <p class="mt-1 flex items-center gap-1 truncate text-xs text-[#68736d]">
              <span class="shrink-0 text-[#8a948d]">⚲</span>
              <span class="truncate">{{ plant.location.name }}</span>
            </p>
            <time v-if="plant.nextMaintenanceDate" class="mt-2 inline-block rounded-lg bg-[#edf4ed] px-2 py-0.5 text-[10px] font-semibold text-[#2f6b4f]">
              {{ formatShortDate(plant.nextMaintenanceDate) }}
            </time>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { Plant } from '~/types/api';

definePageMeta({ layout: 'field' });
const auth = useAuthStore();
const router = useRouter();
const { request } = useApi();

const {
  data: plants,
  pending,
  error,
  refresh,
} = await useAsyncData('assigned-plants', () => request<Plant[]>(`/staff/${auth.user?.id}/plants`));

const formatShortDate = (date: string | null) =>
  date ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(date)) : '';

const search = ref('');
const hasAnyPlants = computed(() => (plants.value?.length ?? 0) > 0);

function matchesSearch(plant: Plant) {
  const term = search.value.trim().toLowerCase();
  if (!term) return true;
  return [plant.name, plant.species, plant.plantCode, plant.location.name, plant.location.customer.name].some((field) =>
    field.toLowerCase().includes(term),
  );
}

const customerGroups = computed(() => {
  const filtered = (plants.value ?? []).filter(matchesSearch);
  const groups = new Map<string, Plant[]>();
  for (const plant of filtered) {
    const key = plant.location.customer.name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(plant);
  }
  return Array.from(groups.entries())
    .map(([customerName, groupPlants]) => ({ customerName, plants: groupPlants }))
    .sort((a, b) => a.customerName.localeCompare(b.customerName, 'tr'));
});
</script>
