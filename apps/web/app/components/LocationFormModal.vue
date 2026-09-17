<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="emit('close')">
    <div class="panel w-full max-w-md p-6">
      <div class="flex items-center justify-between">
        <h3 class="display text-lg font-semibold">{{ location ? 'Konumu düzenle' : 'Yeni konum' }}</h3>
        <button class="text-xl leading-none text-[#8a948d]" type="button" @click="emit('close')">×</button>
      </div>
      <form class="mt-6 space-y-4" @submit="onSubmit">
        <div>
          <label class="mb-2 block text-sm font-semibold" for="location-name">Konum adı</label>
          <input id="location-name" v-model="name" class="field-input" type="text" placeholder="Örn. A Blok Bahçesi" />
          <p v-if="errors.name" class="mt-2 text-sm text-red-700">{{ errors.name }}</p>
        </div>
        <p v-if="submitError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ submitError }}</p>
        <div class="flex items-center gap-3">
          <button class="button-primary" type="submit" :disabled="loading">{{ loading ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          <button class="button-secondary" type="button" @click="emit('close')">Vazgeç</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import type { Location } from '~/types/api';

const props = defineProps<{
  customerId: string;
  location?: Location;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const { request } = useApi();
const loading = ref(false);
const submitError = ref('');

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: yup.object({ name: yup.string().required('Konum adı zorunlu') }),
  initialValues: { name: props.location?.name ?? '' },
});
const [name] = defineField('name');

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  submitError.value = '';
  try {
    if (props.location) {
      await request(`/locations/${props.location.id}`, { method: 'PATCH', body: values });
    } else {
      await request('/locations', { method: 'POST', body: { ...values, customerId: props.customerId } });
    }
    emit('saved');
  } catch {
    submitError.value = 'Konum kaydedilemedi. Tekrar dene.';
  } finally {
    loading.value = false;
  }
});
</script>
