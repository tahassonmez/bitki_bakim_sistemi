<template>
  <div class="min-h-screen bg-[#f7f8f4]">
    <aside class="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-[#dfe5dc] bg-[#203d30] px-6 py-7 text-white lg:flex">
      <NuxtLink to="/dashboard" class="mb-12 flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-2xl bg-[#d8e8cc] text-xl text-[#203d30]">✦</span>
        <span><strong class="display block text-lg">Verdant</strong><small class="text-xs text-[#b8cdbb]">Bitki bakım merkezi</small></span>
      </NuxtLink>
      <nav class="space-y-2 text-sm">
        <NuxtLink to="/dashboard" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◈ <span>Genel bakış</span></NuxtLink>
        <NuxtLink to="/dashboard" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">⌂ <span>Müşteriler</span></NuxtLink>
        <NuxtLink to="/dashboard" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">◌ <span>Bitki envanteri</span></NuxtLink>
        <NuxtLink to="/dashboard" class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#d7e6d8] transition hover:bg-white/10">✓ <span>Bakım kayıtları</span></NuxtLink>
      </nav>
      <div class="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-[#b8cdbb]">Bugünün odağı</p>
        <p class="mt-2 text-sm leading-5 text-white">Saha ekibinin bakım akışını tek bakışta tut.</p>
      </div>
    </aside>
    <main class="min-h-screen lg:pl-72">
      <header class="flex items-center justify-between border-b border-[#dfe5dc] bg-[#f7f8f4]/90 px-5 py-4 backdrop-blur lg:px-10">
        <div><p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b786f]">Yönetim paneli</p><h1 class="display mt-1 text-xl font-semibold">Bitki bakım merkezi</h1></div>
        <div class="flex items-center gap-3">
          <span class="hidden text-right sm:block"><strong class="block text-sm">{{ auth.user?.fullName }}</strong><small class="text-xs text-[#6b786f]">Yönetici</small></span>
          <button class="button-secondary !min-h-10 !px-3 text-sm" type="button" @click="auth.logout()">Çıkış</button>
        </div>
      </header>
      <div class="p-5 lg:p-10"><slot /></div>
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
</script>
