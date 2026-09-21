<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div>
      <p class="mb-3 text-sm font-semibold">Yapılan işlemler</p>
      <div v-if="!maintenanceTypes?.length" class="rounded-xl bg-[#f7f8f4] p-4 text-sm text-[#68736d]">
        Tanımlı bakım türü bulunamadı.
      </div>
      <div v-else class="grid gap-2 sm:grid-cols-2">
        <label
          v-for="type in maintenanceTypes"
          :key="type.id"
          class="flex min-h-14 items-center gap-3 rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 transition has-[:checked]:border-[#2f6b4f] has-[:checked]:bg-[#edf4ed]"
        >
          <input v-model="selectedTypeIds" type="checkbox" :value="type.id" class="size-5 accent-[#2f6b4f]" />
          <span class="font-medium">{{ type.name }}</span>
        </label>
      </div>
      <p v-if="showTypeWarning" class="mt-2 text-sm text-red-700">En az bir bakım işlemi seçmelisin.</p>
    </div>

    <div v-if="products?.length">
      <p class="mb-3 text-sm font-semibold">Kullanılan ürünler</p>
      <div class="space-y-2">
        <div
          v-for="product in products"
          :key="product.id"
          class="flex flex-wrap items-center gap-3 rounded-xl border border-[#dfe5dc] bg-white px-4 py-3"
        >
          <label class="flex min-w-40 flex-1 items-center gap-3">
            <input
              type="checkbox"
              class="size-5 accent-[#2f6b4f]"
              :checked="isProductSelected(product.id)"
              @change="toggleProduct(product.id, ($event.target as HTMLInputElement).checked)"
            />
            <span class="font-medium">{{ product.name }}</span>
          </label>
          <input
            v-if="isProductSelected(product.id)"
            type="number"
            min="0"
            step="0.1"
            class="field-input !min-h-10 w-32"
            :placeholder="product.unit ? `Miktar (${product.unit})` : 'Miktar'"
            :value="quantityFor(product.id)"
            @input="setQuantity(product.id, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <div>
      <label class="mb-2 block text-sm font-semibold" for="maintenance-notes">Not</label>
      <textarea
        id="maintenance-notes"
        v-model="notes"
        class="field-input !h-auto min-h-24 py-3"
        rows="3"
        placeholder="Sahada gözlemlediğin ek notlar (opsiyonel)"
      />
    </div>

    <div>
      <label class="mb-2 block text-sm font-semibold" for="maintenance-photos">Fotoğraf ekle</label>
      <input
        id="maintenance-photos"
        ref="fileInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        class="field-input !h-auto py-3"
        @change="onFilesSelected"
      />
      <p v-if="selectedPhotos.length" class="mt-2 text-sm text-[#68736d]">{{ selectedPhotos.length }} fotoğraf seçildi.</p>
    </div>

    <p v-if="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>

    <button class="button-primary w-full !min-h-14 text-lg" type="submit" :disabled="loading">
      {{ loading ? 'Kaydediliyor...' : 'Bakımı kaydet' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { MaintenanceProductRef, MaintenanceTypeRef } from '~/types/api';

const props = defineProps<{ plantId: string }>();
const emit = defineEmits<{ saved: [] }>();

const { request } = useApi();
const auth = useAuthStore();
const config = useRuntimeConfig();
const token = useCookie<string | null>('auth_token');

const { data: maintenanceTypes } = await useAsyncData('maintenance-log-types', () =>
  request<MaintenanceTypeRef[]>('/maintenance-types'),
);
const { data: products } = await useAsyncData('maintenance-log-products', () =>
  request<MaintenanceProductRef[]>('/products'),
);

const selectedTypeIds = ref<string[]>([]);
const productQuantities = ref<Record<string, string>>({});
const notes = ref('');
const selectedPhotos = ref<File[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const showTypeWarning = ref(false);

function isProductSelected(productId: string) {
  return productId in productQuantities.value;
}
function toggleProduct(productId: string, checked: boolean) {
  const next = { ...productQuantities.value };
  if (checked) next[productId] = '';
  else delete next[productId];
  productQuantities.value = next;
}
function quantityFor(productId: string) {
  return productQuantities.value[productId] ?? '';
}
function setQuantity(productId: string, value: string) {
  productQuantities.value = { ...productQuantities.value, [productId]: value };
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedPhotos.value = input.files ? Array.from(input.files) : [];
}

async function onSubmit() {
  if (!selectedTypeIds.value.length) {
    showTypeWarning.value = true;
    return;
  }
  showTypeWarning.value = false;
  loading.value = true;
  errorMessage.value = '';

  try {
    const productsPayload = Object.entries(productQuantities.value).map(([productId, quantity]) => ({
      productId,
      quantityUsed: quantity ? Number(quantity) : undefined,
    }));

    const log = await request<{ id: string }>(`/plants/${props.plantId}/maintenance-logs`, {
      method: 'POST',
      body: {
        date: new Date().toISOString(),
        staffId: auth.user?.id,
        typeIds: selectedTypeIds.value,
        products: productsPayload.length ? productsPayload : undefined,
        notes: notes.value || undefined,
      },
    });

    for (const file of selectedPhotos.value) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`${config.public.apiBase}/maintenance-logs/${log.id}/photos`, {
        method: 'POST',
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
        body: formData,
      });
    }

    selectedTypeIds.value = [];
    productQuantities.value = {};
    notes.value = '';
    selectedPhotos.value = [];
    if (fileInputRef.value) fileInputRef.value.value = '';

    emit('saved');
  } catch {
    errorMessage.value = 'Bakım kaydı oluşturulamadı. Bilgileri kontrol edip tekrar dene.';
  } finally {
    loading.value = false;
  }
}
</script>
