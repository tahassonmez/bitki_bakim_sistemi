<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm text-[#6b786f]">Müşteri yönetimi</p>
        <h2 class="display mt-2 text-3xl font-semibold tracking-tight">Müşteriler</h2>
      </div>
      <NuxtLink class="button-primary" to="/customers/new">+ Yeni müşteri</NuxtLink>
    </div>

    <div class="panel mb-6 p-4">
      <input v-model="search" class="field-input" type="search" placeholder="Müşteri adına göre ara..." />
    </div>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="item in 6" :key="item" class="h-28 animate-pulse rounded-2xl bg-[#e5ebe3]" />
    </div>
    <div v-else-if="!customers?.length" class="panel p-10 text-center text-sm text-[#68736d]">
      {{ search ? 'Aramanla eşleşen müşteri bulunamadı.' : 'Henüz müşteri eklenmedi. İlk müşterini oluştur.' }}
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="customer in customers"
        :key="customer.id"
        :to="`/customers/${customer.id}`"
        class="panel block p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(38,61,48,0.1)]"
      >
        <p class="display text-lg font-semibold">{{ customer.name }}</p>
        <p v-if="customer.phone" class="mt-1 text-sm text-[#68736d]">{{ customer.phone }}</p>
        <p v-if="customer.address" class="mt-1 truncate text-sm text-[#8a948d]">{{ customer.address }}</p>
        <span class="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e4f0dd] px-3 py-1 text-xs font-semibold text-[#2f6b4f]">
          {{ customer._count?.locations ?? 0 }} konum
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer } from '~/types/api';

definePageMeta({ layout: 'admin' });

const { request } = useApi();
const search = ref('');
const debouncedSearch = ref('');
let debounceTimer: ReturnType<typeof setTimeout>;

watch(search, (value) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = value;
  }, 300);
});

const { data: customers, pending } = await useAsyncData(
  'customers-list',
  () => request<Customer[]>(`/customers${debouncedSearch.value ? `?search=${encodeURIComponent(debouncedSearch.value)}` : ''}`),
  { watch: [debouncedSearch] },
);
</script>
