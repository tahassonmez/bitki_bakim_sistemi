<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm text-[#6b786f]">Bitki envanteri</p>
        <h2 class="display mt-2 text-3xl font-semibold tracking-tight">Bitkiler</h2>
      </div>
      <NuxtLink class="button-primary" to="/plants/new">+ Yeni bitki</NuxtLink>
    </div>

    <div class="panel mb-6 grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-customer">Müşteri</label>
        <select id="filter-customer" v-model="selectedCustomerId" class="field-input">
          <option value="">Tümü</option>
          <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
        </select>
      </div>
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-location">Konum</label>
        <select id="filter-location" v-model="selectedLocationId" class="field-input" :disabled="!selectedCustomerId">
          <option value="">Tümü</option>
          <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
        </select>
      </div>
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-status">Durum</label>
        <select id="filter-status" v-model="selectedStatus" class="field-input">
          <option value="">Tümü</option>
          <option value="ACTIVE">Aktif</option>
          <option value="REMOVED">Kaldırıldı</option>
        </select>
      </div>
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-maintenance">Bakım durumu</label>
        <select id="filter-maintenance" v-model="maintenanceFilter" class="field-input">
          <option value="all">Tümü</option>
          <option value="upcoming">Yaklaşan (7 gün)</option>
          <option value="overdue">Geciken</option>
        </select>
      </div>
    </div>

    <div v-if="pending" class="grid gap-3">
      <div v-for="item in 5" :key="item" class="h-16 animate-pulse rounded-2xl bg-[#e5ebe3]" />
    </div>
    <div v-else-if="!filteredPlants.length" class="panel p-10 text-center text-sm text-[#68736d]">
      Filtrelerle eşleşen bitki bulunamadı.
    </div>
    <div v-else class="panel overflow-hidden overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-[#f7f8f4] text-xs uppercase tracking-[0.1em] text-[#8a948d]">
          <tr>
            <th class="px-5 py-3">Kod</th>
            <th class="px-5 py-3">Ad / Tür</th>
            <th class="px-5 py-3">Müşteri</th>
            <th class="px-5 py-3">Konum</th>
            <th class="px-5 py-3">Sıradaki bakım</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#edf0eb]">
          <tr
            v-for="plant in filteredPlants"
            :key="plant.id"
            class="cursor-pointer hover:bg-[#f7f8f4]"
            :class="maintenanceStatus(plant) === 'overdue' ? 'bg-[#fff8f5]' : ''"
            @click="router.push(`/plants/${plant.id}`)"
          >
            <td class="px-5 py-3 font-mono text-xs">{{ plant.plantCode }}</td>
            <td class="px-5 py-3">
              <p class="font-semibold">{{ plant.name }}</p>
              <p class="text-xs text-[#8a948d]">{{ plant.species }}</p>
            </td>
            <td class="px-5 py-3">{{ plant.location.customer.name }}</td>
            <td class="px-5 py-3">{{ plant.location.name }}</td>
            <td class="px-5 py-3">
              <span :class="maintenanceStatus(plant) === 'overdue' ? 'font-semibold text-[#a15d47]' : ''">
                {{ formatDate(plant.nextMaintenanceDate) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer, Location, Plant, PlantStatus } from '~/types/api';

definePageMeta({ layout: 'admin' });

const { request } = useApi();
const router = useRouter();

const selectedCustomerId = ref('');
const selectedLocationId = ref('');
const selectedStatus = ref<'' | PlantStatus>('');
const maintenanceFilter = ref<'all' | 'upcoming' | 'overdue'>('all');

const { data: customers } = await useAsyncData('plants-filter-customers', () => request<Customer[]>('/customers'));

const { data: locations } = await useAsyncData(
  'plants-filter-locations',
  () => (selectedCustomerId.value ? request<Location[]>(`/locations?customerId=${selectedCustomerId.value}`) : Promise.resolve([])),
  { watch: [selectedCustomerId] },
);

watch(selectedCustomerId, () => {
  selectedLocationId.value = '';
});

const queryString = computed(() => {
  const params = new URLSearchParams();
  if (selectedCustomerId.value) params.set('customerId', selectedCustomerId.value);
  if (selectedLocationId.value) params.set('locationId', selectedLocationId.value);
  if (selectedStatus.value) params.set('status', selectedStatus.value);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
});

const { data: plants, pending } = await useAsyncData(
  'plants-list',
  () => request<Plant[]>(`/plants${queryString.value}`),
  { watch: [queryString] },
);

const today = new Date();
today.setHours(0, 0, 0, 0);
const upcomingLimit = new Date(today);
upcomingLimit.setDate(upcomingLimit.getDate() + 7);

function maintenanceStatus(plant: Plant): 'overdue' | 'upcoming' | 'normal' | 'none' {
  if (!plant.nextMaintenanceDate) return 'none';
  const date = new Date(plant.nextMaintenanceDate);
  if (date < today) return 'overdue';
  if (date <= upcomingLimit) return 'upcoming';
  return 'normal';
}

const filteredPlants = computed(() => {
  const list = plants.value ?? [];
  if (maintenanceFilter.value === 'all') return list;
  return list.filter((plant) => maintenanceStatus(plant) === maintenanceFilter.value);
});

const formatDate = (date: string | null) =>
  date ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)) : 'Tarih yok';
</script>
