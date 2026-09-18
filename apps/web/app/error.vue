<template>
  <div class="grid min-h-screen place-items-center bg-[#f7f8f4] px-6">
    <div class="panel max-w-md p-8 text-center">
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#f7e5de] text-2xl text-[#a15d47]">!</span>
      <h1 class="display mt-5 text-2xl font-semibold">Bir şeyler ters gitti</h1>
      <p class="mt-3 text-sm leading-6 text-[#68736d]">{{ friendlyMessage }}</p>
      <button class="button-primary mt-6" type="button" @click="handleRetry">Ana sayfaya dön</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const friendlyMessage = computed(() => {
  if (props.error?.statusCode === 404) return 'Aradığın sayfa bulunamadı.';
  if (props.error?.statusCode && props.error.statusCode >= 500) {
    return 'Sunucuya ulaşılamıyor. API sunucusunun çalıştığından emin olup tekrar dene.';
  }
  return 'Beklenmeyen bir hata oluştu. İnternet bağlantını ve API sunucusunu kontrol edip tekrar dene.';
});

function handleRetry() {
  clearError({ redirect: '/' });
}
</script>
