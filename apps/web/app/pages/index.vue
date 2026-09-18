<template>
  <div class="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
    <div class="size-10 animate-pulse rounded-full bg-[#d8e8cc]" />
  </div>
</template>

<script setup lang="ts">
// Bu sayfanın kendi içeriği yok: tek işi "/" için bir route eşleşmesi sağlamak.
// Gerçek yönlendirme apps/web/app/middleware/auth.global.ts içinde yapılıyor
// (giriş yapılmamışsa /login'e, yapılmışsa role göre /dashboard veya /field/today'e).
definePageMeta({ layout: false });
</script>
