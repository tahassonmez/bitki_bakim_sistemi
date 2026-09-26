<template>
  <div>
    <div class="mb-6">
      <h2 class="display text-2xl font-semibold tracking-tight">Bitki Tanı</h2>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">
        Adını bilmediğin bir bitkinin fotoğrafını çek ya da yükle, yapay zeka senin için tanısın.
      </p>
    </div>

    <div class="panel p-5">
      <PlantAiIdentify />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'field' });
</script>
