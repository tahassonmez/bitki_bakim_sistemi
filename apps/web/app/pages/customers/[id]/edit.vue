<template>
  <div v-if="pending">
    <div class="h-40 animate-pulse rounded-2xl bg-[#e5ebe3]" />
  </div>
  <div v-else-if="!customer">
    <p class="panel p-10 text-center text-sm text-[#68736d]">Müşteri bulunamadı.</p>
  </div>
  <div v-else>
    <NuxtLink :to="`/customers/${customer.id}`" class="text-sm font-semibold text-[#2f6b4f]">← Müşteri detayına dön</NuxtLink>
    <h2 class="display mt-4 text-3xl font-semibold tracking-tight">{{ customer.name }} — düzenle</h2>
    <div class="panel mt-8 max-w-2xl p-6 sm:p-8">
      <CustomerForm
        :initial-values="customer"
        :loading="loading"
        :error-message="errorMessage"
        submit-label="Değişiklikleri kaydet"
        @submit="onSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer, CustomerInput } from '~/types/api';

definePageMeta({ layout: 'admin' });

const route = useRoute();
const router = useRouter();
const customerId = route.params.id as string;
const { request } = useApi();
const loading = ref(false);
const errorMessage = ref('');

const { data: customer, pending } = await useAsyncData(`customer-edit-${customerId}`, () =>
  request<Customer>(`/customers/${customerId}`),
);

async function onSubmit(values: CustomerInput) {
  loading.value = true;
  errorMessage.value = '';
  try {
    await request(`/customers/${customerId}`, { method: 'PATCH', body: values });
    await router.push(`/customers/${customerId}`);
  } catch {
    errorMessage.value = 'Güncelleme başarısız oldu. Bilgileri kontrol edip tekrar dene.';
  } finally {
    loading.value = false;
  }
}
</script>
