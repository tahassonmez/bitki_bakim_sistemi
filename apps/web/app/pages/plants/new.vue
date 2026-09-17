<template>
  <div>
    <NuxtLink to="/plants" class="text-sm font-semibold text-[#2f6b4f]">← Bitkilere dön</NuxtLink>
    <h2 class="display mt-4 text-3xl font-semibold tracking-tight">Yeni bitki</h2>
    <p class="mt-2 max-w-2xl text-[#68736d]">
      Tek bir bitki ekleyebilir ya da aynı türden birden fazla bitkiyi, her biri ayrı bir kod ve QR ile takip
      edilecek şekilde toplu olarak oluşturabilirsin.
    </p>

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

    <div class="panel mt-6 max-w-2xl p-6 sm:p-8">
      <form class="space-y-5" @submit="onSubmit">
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-customer">Müşteri</label>
            <select id="plant-customer" v-model="customerId" class="field-input">
              <option value="" disabled>Müşteri seç</option>
              <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-location">Konum</label>
            <select id="plant-location" v-model="locationId" class="field-input" :disabled="!customerId">
              <option value="" disabled>{{ customerId ? 'Konum seç' : 'Önce müşteri seç' }}</option>
              <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
            </select>
            <p v-if="errors.locationId" class="mt-2 text-sm text-red-700">{{ errors.locationId }}</p>
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-name">Bitki adı</label>
            <input id="plant-name" v-model="name" class="field-input" type="text" placeholder="Örn. Ficus Benjamina" />
            <p v-if="errors.name" class="mt-2 text-sm text-red-700">{{ errors.name }}</p>
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-species">Tür</label>
            <input id="plant-species" v-model="species" class="field-input" type="text" placeholder="Örn. Ficus" />
            <p v-if="errors.species" class="mt-2 text-sm text-red-700">{{ errors.species }}</p>
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-pot">Saksı bilgisi</label>
            <input id="plant-pot" v-model="potInfo" class="field-input" type="text" placeholder="Örn. 30cm plastik saksı" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-size">Ölçü bilgisi</label>
            <input id="plant-size" v-model="sizeInfo" class="field-input" type="text" placeholder="Örn. 120cm boy" />
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold" for="plant-frequency">Bakım sıklığı (gün)</label>
            <input id="plant-frequency" v-model.number="careFrequencyDays" class="field-input" type="number" min="1" placeholder="Örn. 14" />
            <p v-if="errors.careFrequencyDays" class="mt-2 text-sm text-red-700">{{ errors.careFrequencyDays }}</p>
          </div>
          <div v-if="mode === 'bulk'">
            <label class="mb-2 block text-sm font-semibold" for="plant-quantity">Adet</label>
            <input id="plant-quantity" v-model.number="quantity" class="field-input" type="number" min="1" max="500" placeholder="Örn. 50" />
            <p v-if="errors.quantity" class="mt-2 text-sm text-red-700">{{ errors.quantity }}</p>
          </div>
        </div>

        <p v-if="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
        <p v-if="successMessage" class="rounded-xl bg-[#e4f0dd] px-4 py-3 text-sm text-[#2f6b4f]">{{ successMessage }}</p>

        <div class="flex items-center gap-3">
          <button class="button-primary" type="submit" :disabled="loading">
            {{ loading ? 'Kaydediliyor...' : mode === 'bulk' ? 'Toplu oluştur' : 'Bitkiyi oluştur' }}
          </button>
          <NuxtLink class="button-secondary" to="/plants">Vazgeç</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import type { Customer, Location, Plant } from '~/types/api';

definePageMeta({ layout: 'admin' });

const { request } = useApi();
const router = useRouter();

const mode = ref<'single' | 'bulk'>('single');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const { data: customers } = await useAsyncData('plant-new-customers', () => request<Customer[]>('/customers'));

const customerId = ref('');
const { data: locations } = await useAsyncData(
  'plant-new-locations',
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
    } else {
      const created = await request<Plant>('/plants', {
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
      await router.push(`/plants/${created.id}`);
    }
  } catch {
    errorMessage.value = 'Bitki oluşturulamadı. Bilgileri kontrol edip tekrar dene.';
  } finally {
    loading.value = false;
  }
});
</script>
