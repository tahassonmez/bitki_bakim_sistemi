<template>
  <div v-if="pending">
    <div class="h-40 animate-pulse rounded-2xl bg-[#e5ebe3]" />
  </div>
  <div v-else-if="!customer">
    <p class="panel p-10 text-center text-sm text-[#68736d]">Müşteri bulunamadı.</p>
  </div>
  <div v-else>
    <NuxtLink to="/customers" class="text-sm font-semibold text-[#2f6b4f]">← Müşterilere dön</NuxtLink>

    <div class="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h2 class="display text-3xl font-semibold tracking-tight">{{ customer.name }}</h2>
        <p v-if="customer.address" class="mt-2 max-w-xl text-[#68736d]">{{ customer.address }}</p>
      </div>
      <NuxtLink :to="`/customers/${customer.id}/edit`" class="button-secondary">Düzenle</NuxtLink>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <div class="panel p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Telefon</p>
        <p class="mt-2 font-semibold">{{ customer.phone || '—' }}</p>
      </div>
      <div class="panel p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">E-posta</p>
        <p class="mt-2 font-semibold">{{ customer.email || '—' }}</p>
      </div>
    </div>
    <div v-if="customer.notes" class="panel mt-4 p-5">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Notlar</p>
      <p class="mt-2 text-[#3c453f]">{{ customer.notes }}</p>
    </div>

    <div class="mt-10 flex items-center justify-between">
      <h3 class="display text-xl font-semibold">Konumlar</h3>
      <button class="button-primary" type="button" @click="openLocationModal()">+ Yeni konum</button>
    </div>
    <div v-if="!customer.locations.length" class="panel mt-4 p-8 text-center text-sm text-[#68736d]">
      Henüz konum eklenmedi.
    </div>
    <div v-else class="mt-4 grid gap-3 sm:grid-cols-2">
      <div v-for="location in customer.locations" :key="location.id" class="panel flex items-center justify-between p-4">
        <div>
          <p class="font-semibold">{{ location.name }}</p>
          <p class="mt-1 text-sm text-[#68736d]">{{ location._count?.plants ?? 0 }} bitki</p>
        </div>
        <button class="button-secondary !min-h-9 !px-3 text-sm" type="button" @click="openLocationModal(location)">Düzenle</button>
      </div>
    </div>

    <div class="mt-10 flex items-center justify-between">
      <h3 class="display text-xl font-semibold">Bitkiler</h3>
      <div class="flex items-center gap-3">
        <span class="text-sm text-[#68736d]">{{ plants?.length ?? 0 }} kayıt</span>
        <button
          class="button-primary !min-h-9 !px-3 text-sm"
          type="button"
          :disabled="!customer.locations.length"
          :title="!customer.locations.length ? 'Önce bir konum ekle' : undefined"
          @click="showPlantModal = true"
        >
          + Yeni bitki
        </button>
      </div>
    </div>
    <div v-if="plantsPending" class="mt-4 h-24 animate-pulse rounded-2xl bg-[#e5ebe3]" />
    <div v-else-if="!plants?.length" class="panel mt-4 p-8 text-center text-sm text-[#68736d]">
      Bu müşteriye henüz bitki eklenmedi.
    </div>
    <div v-else class="panel mt-4 overflow-hidden overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-[#f7f8f4] text-xs uppercase tracking-[0.1em] text-[#8a948d]">
          <tr>
            <th class="px-5 py-3">Kod</th>
            <th class="px-5 py-3">Ad / Tür</th>
            <th class="px-5 py-3">Konum</th>
            <th class="px-5 py-3">Durum</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#edf0eb]">
          <tr v-for="plant in plants" :key="plant.id">
            <td class="px-5 py-3 font-mono text-xs">{{ plant.plantCode }}</td>
            <td class="px-5 py-3">
              <NuxtLink :to="`/plants/${plant.id}`" class="font-semibold text-[#2f6b4f] hover:underline">{{ plant.name }}</NuxtLink>
              <p class="text-xs text-[#8a948d]">{{ plant.species }}</p>
            </td>
            <td class="px-5 py-3">{{ plant.location.name }}</td>
            <td class="px-5 py-3">
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="plant.status === 'ACTIVE' ? 'bg-[#e4f0dd] text-[#2f6b4f]' : 'bg-[#f0ece5] text-[#8a7b5f]'"
              >
                {{ plant.status === 'ACTIVE' ? 'Aktif' : 'Kaldırıldı' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <LocationFormModal
      v-if="activeModal"
      :customer-id="customer.id"
      :location="activeModal === true ? undefined : activeModal"
      @close="activeModal = false"
      @saved="onLocationSaved"
    />

    <PlantFormModal
      v-if="showPlantModal"
      :default-customer-id="customer.id"
      @close="showPlantModal = false"
      @saved="onPlantSaved"
    />
  </div>
</template>

<script setup lang="ts">
import type { CustomerDetail, Location, Plant } from '~/types/api';

definePageMeta({ layout: 'admin' });

const route = useRoute();
const customerId = route.params.id as string;
const { request } = useApi();

const { data: customer, pending, refresh } = await useAsyncData(`customer-${customerId}`, () =>
  request<CustomerDetail>(`/customers/${customerId}`),
);

const { data: plants, pending: plantsPending, refresh: refreshPlants } = await useAsyncData(`customer-${customerId}-plants`, () =>
  request<Plant[]>(`/plants?customerId=${customerId}`),
);

const activeModal = ref<true | Location | false>(false);
function openLocationModal(location?: Location) {
  activeModal.value = location ?? true;
}
async function onLocationSaved() {
  activeModal.value = false;
  await refresh();
}

const showPlantModal = ref(false);
async function onPlantSaved() {
  await Promise.all([refresh(), refreshPlants()]);
}
</script>
