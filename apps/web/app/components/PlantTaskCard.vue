<template>
  <article class="panel cursor-pointer p-5 transition active:scale-[0.99]" @click="emit('open')">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6b4f]">{{ plant.plantCode }}</p>
        <h3 class="display mt-2 truncate text-lg font-semibold">{{ plant.name }}</h3>
        <p class="mt-1 truncate text-sm text-[#68736d]">{{ plant.species }}</p>
        <p class="mt-1 truncate text-sm text-[#68736d]">{{ plant.location.customer.name }} · {{ plant.location.name }}</p>
      </div>
      <span
        class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold"
        :class="overdue ? 'bg-[#f7e5de] text-[#a15d47]' : 'bg-[#d8e8cc] text-[#203d30]'"
      >{{ overdue ? 'Gecikti' : 'Bugün' }}</span>
    </div>
    <button class="button-secondary mt-5 w-full !min-h-12" type="button">Bakımı aç</button>
  </article>
</template>

<script setup lang="ts">
import type { PlantTask } from '~/types/api';

defineProps<{ plant: PlantTask; overdue?: boolean }>();
const emit = defineEmits<{ open: [] }>();
</script>
