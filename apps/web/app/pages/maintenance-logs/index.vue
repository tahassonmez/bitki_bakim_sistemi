<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm text-[#6b786f]">Aktivite akışı</p>
        <h2 class="display mt-2 text-3xl font-semibold tracking-tight">Bakım kayıtları</h2>
      </div>
      <span class="text-sm text-[#68736d]">{{ response?.total ?? 0 }} kayıt</span>
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
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-plant">Bitki</label>
        <select id="filter-plant" v-model="selectedPlantId" class="field-input" :disabled="!selectedCustomerId">
          <option value="">Tümü</option>
          <option v-for="plant in plantsForCustomer" :key="plant.id" :value="plant.id">{{ plant.plantCode }} · {{ plant.name }}</option>
        </select>
      </div>
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-date-from">Başlangıç tarihi</label>
        <input id="filter-date-from" v-model="dateFrom" class="field-input" type="date" />
      </div>
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8a948d]" for="filter-date-to">Bitiş tarihi</label>
        <input id="filter-date-to" v-model="dateTo" class="field-input" type="date" />
      </div>
    </div>

    <div v-if="pending" class="grid gap-3">
      <div v-for="item in 5" :key="item" class="h-20 animate-pulse rounded-2xl bg-[#e5ebe3]" />
    </div>
    <div v-else-if="error" class="panel border-[#e4cfc5] bg-[#fff8f5] p-8 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#f7e5de] text-2xl text-[#a15d47]">!</span>
      <h3 class="display mt-4 text-xl font-semibold">Sunucuya bağlanılamadı</h3>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">Kayıtlar yüklenemedi. Tekrar dene.</p>
      <button class="button-secondary mt-5" type="button" @click="refresh()">Tekrar dene</button>
    </div>
    <div v-else-if="!response?.items.length" class="panel p-10 text-center text-sm text-[#68736d]">
      Filtrelerle eşleşen bakım kaydı bulunamadı.
    </div>
    <template v-else>
      <div class="panel overflow-hidden overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-[#f7f8f4] text-xs uppercase tracking-[0.1em] text-[#8a948d]">
            <tr>
              <th class="px-5 py-3">Tarih</th>
              <th class="px-5 py-3">Bitki</th>
              <th class="px-5 py-3">Müşteri / Konum</th>
              <th class="px-5 py-3">İşlemler</th>
              <th class="px-5 py-3">Personel</th>
              <th class="px-5 py-3">Fotoğraf</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#edf0eb]">
            <tr
              v-for="log in response.items"
              :key="log.id"
              class="cursor-pointer hover:bg-[#f7f8f4]"
              @click="router.push(`/plants/${log.plant.id}`)"
            >
              <td class="px-5 py-3 whitespace-nowrap">{{ formatDateTime(log.date) }}</td>
              <td class="px-5 py-3">
                <p class="font-semibold text-[#2f6b4f]">{{ log.plant.name }}</p>
                <p class="font-mono text-xs text-[#8a948d]">{{ log.plant.plantCode }}</p>
              </td>
              <td class="px-5 py-3">{{ log.plant.location.customer.name }} · {{ log.plant.location.name }}</td>
              <td class="px-5 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="action in log.actions" :key="action.id" class="rounded-full bg-[#e4f0dd] px-2 py-0.5 text-xs font-semibold text-[#2f6b4f]">
                    {{ action.type.name }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-3">{{ log.staff.fullName }}</td>
              <td class="px-5 py-3 text-[#68736d]">{{ log.photos.length || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center justify-between text-sm text-[#68736d]">
        <span>Sayfa {{ response.page }} / {{ totalPages }}</span>
        <div class="flex gap-2">
          <button class="button-secondary !min-h-9 !px-3 text-sm" type="button" :disabled="page <= 1" @click="page -= 1">← Önceki</button>
          <button class="button-secondary !min-h-9 !px-3 text-sm" type="button" :disabled="page >= totalPages" @click="page += 1">Sonraki →</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Customer, MaintenanceLogListResponse, Plant } from '~/types/api';

definePageMeta({ layout: 'admin' });

const { request } = useApi();
const router = useRouter();

const selectedCustomerId = ref('');
const selectedPlantId = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const page = ref(1);
const pageSize = 30;

const { data: customers } = await useAsyncData('maintenance-logs-customers', () => request<Customer[]>('/customers'));

const { data: plantsForCustomer } = await useAsyncData(
  'maintenance-logs-plants',
  () => (selectedCustomerId.value ? request<Plant[]>(`/plants?customerId=${selectedCustomerId.value}`) : Promise.resolve([])),
  { watch: [selectedCustomerId] },
);

watch(selectedCustomerId, () => {
  selectedPlantId.value = '';
});
watch([selectedCustomerId, selectedPlantId, dateFrom, dateTo], () => {
  page.value = 1;
});

const queryString = computed(() => {
  const params = new URLSearchParams();
  if (selectedCustomerId.value) params.set('customerId', selectedCustomerId.value);
  if (selectedPlantId.value) params.set('plantId', selectedPlantId.value);
  if (dateFrom.value) params.set('dateFrom', dateFrom.value);
  if (dateTo.value) params.set('dateTo', dateTo.value);
  params.set('page', String(page.value));
  params.set('pageSize', String(pageSize));
  return params.toString();
});

const { data: response, pending, error, refresh } = await useAsyncData(
  'maintenance-logs-list',
  () => request<MaintenanceLogListResponse>(`/maintenance-logs?${queryString.value}`),
  { watch: [queryString] },
);

const totalPages = computed(() => Math.max(1, Math.ceil((response.value?.total ?? 0) / pageSize)));

const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    new Date(date),
  );
</script>
