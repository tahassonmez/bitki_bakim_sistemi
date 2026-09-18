<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" @click.self="emit('close')">
    <div class="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="display text-2xl font-semibold tracking-tight">Yeni bitki</h2>
          <p class="mt-2 max-w-xl text-sm text-[#68736d]">
            Tek bir bitki ekleyebilir ya da aynı türden birden fazla bitkiyi, her biri ayrı bir kod ve QR ile takip
            edilecek şekilde toplu olarak oluşturabilirsin.
          </p>
        </div>
        <button class="text-xl leading-none text-[#8a948d]" type="button" @click="emit('close')">×</button>
      </div>

      <div class="mt-6 inline-flex rounded-xl border border-[#dfe5dc] bg-white p-1">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-semibold transition"
          :class="mode === 'single' ? 'bg-[#2f6b4f] text-white' : 'text-[#68736d]'"
          @click="mode = 'single'"
        >
          Tekil ekleme
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-semibold transition"
          :class="mode === 'bulk' ? 'bg-[#2f6b4f] text-white' : 'text-[#68736d]'"
          @click="mode = 'bulk'"
        >
          Toplu ekleme
        </button>
      </div>

      <form class="mt-6 space-y-5" @submit="onSubmit">
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-customer">Müşteri</label>
            <select id="plant-modal-customer" v-model="customerId" class="field-input">
              <option value="" disabled>Müşteri seç</option>
              <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-location">Konum</label>
            <select id="plant-modal-location" v-model="locationId" class="field-input" :disabled="!customerId">
              <option value="" disabled>{{ customerId ? 'Konum seç' : 'Önce müşteri seç' }}</option>
              <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
            </select>
            <p v-if="errors.locationId" class="mt-2 text-sm text-red-700">{{ errors.locationId }}</p>
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-name">Bitki adı</label>
            <input id="plant-modal-name" v-model="name" class="field-input" type="text" placeholder="Örn. Ficus Benjamina" />
            <p v-if="errors.name" class="mt-2 text-sm text-red-700">{{ errors.name }}</p>
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-species">Tür</label>
            <input id="plant-modal-species" v-model="species" class="field-input" type="text" placeholder="Örn. Ficus" />
            <p v-if="errors.species" class="mt-2 text-sm text-red-700">{{ errors.species }}</p>
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-pot">Saksı bilgisi</label>
            <input id="plant-modal-pot" v-model="potInfo" class="field-input" type="text" placeholder="Örn. 30cm plastik saksı" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-size">Ölçü bilgisi</label>
            <input id="plant-modal-size" v-model="sizeInfo" class="field-input" type="text" placeholder="Örn. 120cm boy" />
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-frequency">Bakım sıklığı (gün)</label>
            <input id="plant-modal-frequency" v-model.number="careFrequencyDays" class="field-input" type="number" min="1" placeholder="Örn. 14" />
            <p v-if="errors.careFrequencyDays" class="mt-2 text-sm text-red-700">{{ errors.careFrequencyDays }}</p>
          </div>
          <div v-if="mode === 'bulk'">
            <label class="mb-2 block text-sm font-semibold" for="plant-modal-quantity">Adet</label>
            <input id="plant-modal-quantity" v-model.number="quantity" class="field-input" type="number" min="1" max="500" placeholder="Örn. 50" />
            <p v-if="errors.quantity" class="mt-2 text-sm text-red-700">{{ errors.quantity }}</p>
          </div>
        </div>

        <p v-if="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
        <p v-if="successMessage" class="rounded-xl bg-[#e4f0dd] px-4 py-3 text-sm text-[#2f6b4f]">{{ successMessage }}</p>

        <div class="flex items-center gap-3">
          <button class="button-primary" type="submit" :disabled="loading">
            {{ loading ? 'Kaydediliyor...' : mode === 'bulk' ? 'Toplu oluştur' : 'Bitkiyi oluştur' }}
          </button>
          <button class="button-secondary" type="button" @click="emit('close')">Vazgeç</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import type { Customer, Location, Plant } from '~/types/api';

const props = defineProps<{ defaultCustomerId?: string }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { request } = useApi();

const mode = ref<'single' | 'bulk'>('single');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const { data: customers } = await useAsyncData('plant-modal-customers', () => request<Customer[]>('/customers'));

const customerId = ref(props.defaultCustomerId ?? '');
const { data: locations } = await useAsyncData(
  'plant-modal-locations',
  () => (customerId.value ? request<Location[]>(`/locations?customerId=${customerId.value}`) : Promise.resolve([])),
  { watch: [customerId] },
);

const schema = computed(() =>
  yup.object({
    locationId: yup.string().required('Konum seçimi zorunlu'),
    name: yup.string().required('Bitki adı zorunlu'),
    species: yup.string().required('Tür zorunlu'),
    potInfo: yup.string().nullable(),
    sizeInfo: yup.string().nullable(),
    careFrequencyDays: yup
      .number()
      .typeError('Sayı girin')
      .min(1, 'En az 1 olmalı')
      .required('Bakım sıklığı zorunlu'),
    quantity:
      mode.value === 'bulk'
        ? yup.number().typeError('Sayı girin').min(1, 'En az 1 olmalı').max(500, 'En fazla 500').required('Adet zorunlu')
        : yup.number().nullable(),
  }),
);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { locationId: '', name: '', species: '', potInfo: '', sizeInfo: '', careFrequencyDays: 14, quantity: 1 },
});

const [locationId] = defineField('locationId');
const [name] = defineField('name');
const [species] = defineField('species');
const [potInfo] = defineField('potInfo');
const [sizeInfo] = defineField('sizeInfo');
const [careFrequencyDays] = defineField('careFrequencyDays');
const [quantity] = defineField('quantity');

watch(customerId, () => {
  locationId.value = '';
});

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    if (mode.value === 'bulk') {
      const created = await request<Plant[]>('/plants/bulk', {
        method: 'POST',
        body: {
          name: values.name,
          species: values.species,
          locationId: values.locationId,
          potInfo: values.potInfo || undefined,
          sizeInfo: values.sizeInfo || undefined,
          careFrequencyDays: values.careFrequencyDays,
          quantity: values.quantity,
        },
      });
      successMessage.value = `${created.length} adet bitki, ${created.length} ayrı kodla oluşturuldu.`;
      resetForm({ values: { ...values, name: '', species: '', potInfo: '', sizeInfo: '' } });
      emit('saved');
    } else {
      await request<Plant>('/plants', {
        method: 'POST',
        body: {
          name: values.name,
          species: values.species,
          locationId: values.locationId,
          potInfo: values.potInfo || undefined,
          sizeInfo: values.sizeInfo || undefined,
          careFrequencyDays: values.careFrequencyDays,
        },
      });
      emit('saved');
      emit('close');
    }
  } catch {
    errorMessage.value = 'Bitki oluşturulamadı. Bilgileri kontrol edip tekrar dene.';
  } finally {
    loading.value = false;
  }
});
</script>
