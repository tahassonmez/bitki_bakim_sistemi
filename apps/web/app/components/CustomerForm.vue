<template>
  <form class="space-y-5" @submit="onSubmit">
    <div>
      <label class="mb-2 block text-sm font-semibold" for="customer-name">Müşteri adı</label>
      <input id="customer-name" v-model="name" class="field-input" type="text" placeholder="Örn. Yeşil Vadi Sitesi" />
      <p v-if="errors.name" class="mt-2 text-sm text-red-700">{{ errors.name }}</p>
    </div>
    <div>
      <label class="mb-2 block text-sm font-semibold" for="customer-address">Adres</label>
      <textarea id="customer-address" v-model="address" class="field-input !h-auto min-h-24 py-3" rows="3" placeholder="Açık adres" />
    </div>
    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-semibold" for="customer-phone">Telefon</label>
        <input id="customer-phone" v-model="phone" class="field-input" type="text" placeholder="05xx xxx xx xx" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold" for="customer-email">E-posta</label>
        <input id="customer-email" v-model="email" class="field-input" type="email" placeholder="ornek@firma.com" />
        <p v-if="errors.email" class="mt-2 text-sm text-red-700">{{ errors.email }}</p>
      </div>
    </div>
    <div>
      <label class="mb-2 block text-sm font-semibold" for="customer-notes">Notlar</label>
      <textarea id="customer-notes" v-model="notes" class="field-input !h-auto min-h-20 py-3" rows="2" placeholder="Ek notlar (opsiyonel)" />
    </div>
    <p v-if="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
    <div class="flex items-center gap-3">
      <button class="button-primary" type="submit" :disabled="loading">{{ loading ? 'Kaydediliyor...' : (submitLabel ?? 'Kaydet') }}</button>
      <NuxtLink class="button-secondary" to="/customers">Vazgeç</NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import type { Customer, CustomerInput } from '~/types/api';

const props = defineProps<{
  initialValues?: Partial<Customer>;
  submitLabel?: string;
  loading?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{ submit: [values: CustomerInput] }>();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: yup.object({
    name: yup.string().required('Müşteri adı zorunlu'),
    address: yup.string().nullable(),
    phone: yup.string().nullable(),
    email: yup.string().email('Geçerli bir e-posta girin').nullable(),
    notes: yup.string().nullable(),
  }),
  initialValues: {
    name: props.initialValues?.name ?? '',
    address: props.initialValues?.address ?? '',
    phone: props.initialValues?.phone ?? '',
    email: props.initialValues?.email ?? '',
    notes: props.initialValues?.notes ?? '',
  },
});

const [name] = defineField('name');
const [address] = defineField('address');
const [phone] = defineField('phone');
const [email] = defineField('email');
const [notes] = defineField('notes');

const onSubmit = handleSubmit((values) => {
  emit('submit', values as CustomerInput);
});
</script>
