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

    <div class="panel mt-4 p-5">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Sorumlu personel</p>
        <button class="button-secondary !min-h-8 !px-3 text-xs" type="button" @click="toggleStaffEdit">
          {{ editingStaff ? 'Kapat' : 'Düzenle' }}
        </button>
      </div>

      <div v-if="!editingStaff" class="mt-3 flex flex-wrap gap-2">
        <span v-if="!customer.assignedStaff.length" class="text-sm text-[#68736d]">Henüz personel atanmadı.</span>
        <span
          v-for="member in customer.assignedStaff"
          :key="member.id"
          class="rounded-full bg-[#e8edf6] px-3 py-1 text-xs font-semibold text-[#4d668f]"
        >
          {{ member.fullName }}
        </span>
      </div>

      <div v-else class="mt-3">
        <div v-if="staffPending" class="h-10 animate-pulse rounded-xl bg-[#e5ebe3]" />
        <div v-else-if="!allStaff?.length" class="text-sm text-[#68736d]">Henüz personel eklenmemiş.</div>
        <div v-else class="grid gap-2 sm:grid-cols-2">
          <label
            v-for="member in allStaff"
            :key="member.id"
            class="flex items-center gap-2 rounded-xl bg-[#f7f8f4] px-3 py-2 text-sm"
          >
            <input v-model="selectedStaffIds" type="checkbox" :value="member.id" />
            <span>{{ member.fullName }}<span v-if="!member.isActive" class="text-[#8a948d]"> (pasif)</span></span>
          </label>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button class="button-primary !min-h-9 !px-3 text-sm" type="button" :disabled="savingStaff" @click="onSaveStaff">
            {{ savingStaff ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
          <button class="button-secondary !min-h-9 !px-3 text-sm" type="button" @click="toggleStaffEdit">Vazgeç</button>
          <p v-if="staffSaveError" class="text-sm text-red-700">{{ staffSaveError }}</p>
        </div>
      </div>
    </div>

    <div class="mt-10 flex items-center justify-between">
      <h3 class="display text-xl font-semibold">Konumlar</h3>
      <button class="button-primary" type="button" @click="openLocationModal()">+ Yeni konum</button>
    </div>
    <div v-if="!customer.locations.length" class="panel mt-4 p-8 text-center text-sm text-[#68736d]">
      Henüz konum eklenmedi.
    </div>
    <div v-else class="mt-4 grid gap-3 sm:grid-cols-2">
      <div v-for="location in customer.locations" :key="location.id" class="panel flex items-center justify-between gap-3 p-4">
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ location.name }}</p>
          <p v-if="location.address" class="mt-1 truncate text-sm text-[#68736d]">{{ location.address }}</p>
          <p class="mt-1 text-sm text-[#68736d]">
            {{ location._count?.plants ?? 0 }} bitki
            <a
              v-if="location.latitude != null && location.longitude != null"
              :href="`https://www.google.com/maps?q=${location.latitude},${location.longitude}`"
              target="_blank"
              rel="noopener"
              class="ml-2 font-semibold text-[#2f6b4f] hover:underline"
            >
              Haritada gör ↗
            </a>
          </p>
        </div>
        <button class="button-secondary !min-h-9 shrink-0 !px-3 text-sm" type="button" @click="openLocationModal(location)">Düzenle</button>
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
import type { CustomerDetail, Location, Plant, StaffMember } from '~/types/api';

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

const editingStaff = ref(false);
const savingStaff = ref(false);
const staffSaveError = ref('');
const selectedStaffIds = ref<string[]>([]);

const { data: allStaff, pending: staffPending } = await useAsyncData('customer-assign-staff-list', () =>
  request<StaffMember[]>('/staff'),
);

function toggleStaffEdit() {
  staffSaveError.value = '';
  if (editingStaff.value) {
    editingStaff.value = false;
    return;
  }
  selectedStaffIds.value = (customer.value?.assignedStaff ?? []).map((member) => member.id);
  editingStaff.value = true;
}

async function onSaveStaff() {
  if (!customer.value) return;
  savingStaff.value = true;
  staffSaveError.value = '';
  try {
    await request(`/customers/${customer.value.id}/assigned-staff`, {
      method: 'PATCH',
      body: { staffIds: selectedStaffIds.value },
    });
    editingStaff.value = false;
    await refresh();
  } catch {
    staffSaveError.value = 'Kaydedilemedi, tekrar dene.';
  } finally {
    savingStaff.value = false;
  }
}
</script>
