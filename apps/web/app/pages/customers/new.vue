<template>
  <div>
    <NuxtLink to="/customers" class="text-sm font-semibold text-[#2f6b4f]">← Müşterilere dön</NuxtLink>
    <h2 class="display mt-4 text-3xl font-semibold tracking-tight">Yeni müşteri</h2>
    <p class="mt-2 text-[#68736d]">Müşteri bilgilerini gir, ardından konum ve bitki eklemeye başlayabilirsin.</p>
    <div class="panel mt-8 max-w-2xl p-6 sm:p-8">
      <CustomerForm :loading="loading" :error-message="errorMessage" submit-label="Müşteriyi oluştur" @submit="onSubmit" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer, CustomerInput } from '~/types/api';

definePageMeta({ layout: 'admin' });

const { request } = useApi();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');

async function onSubmit(values: CustomerInput) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const customer = await request<Customer>('/customers', { method: 'POST', body: values });
    await router.push(`/customers/${customer.id}`);
  } catch {
    errorMessage.value = 'Müşteri oluşturulamadı. Bilgileri kontrol edip tekrar dene.';
  } finally {
    loading.value = false;
  }
}
</script>
