<template>
  <main class="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
    <section class="relative hidden overflow-hidden bg-[#203d30] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="absolute -right-32 top-20 size-96 rounded-full border-[46px] border-[#d8e8cc]/20" />
      <div class="relative"><span class="grid size-12 place-items-center rounded-2xl bg-[#d8e8cc] text-xl text-[#203d30]">✦</span><p class="mt-7 text-sm font-semibold uppercase tracking-[0.22em] text-[#b8cdbb]">Verdant operations</p><h1 class="display mt-5 max-w-lg text-5xl font-semibold leading-[1.05]">Bakımı iyi yapılan her bitki, iyi işleyen bir alan yaratır.</h1></div>
      <p class="relative max-w-sm text-sm leading-6 text-[#d7e6d8]">Müşteriler, tekil bitkiler ve saha bakım kayıtları tek sakin akışta.</p>
    </section>
    <section class="flex items-center justify-center px-5 py-12 sm:px-10">
      <div class="w-full max-w-md">
        <div class="mb-10 lg:hidden"><span class="grid size-12 place-items-center rounded-2xl bg-[#d8e8cc] text-xl text-[#203d30]">✦</span><p class="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6b4f]">Verdant</p></div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b786f]">Hoş geldiniz</p>
        <h2 class="display mt-3 text-4xl font-semibold tracking-tight">Sisteme giriş yapın</h2>
        <p class="mt-3 text-[#68736d]">Saha ve yönetim akışınıza devam edin.</p>
        <form class="mt-9 space-y-5" @submit="onSubmit">
          <div><label class="mb-2 block text-sm font-semibold" for="email">E-posta</label><input id="email" v-model="email" class="field-input" type="email" autocomplete="email" placeholder="ornek@firma.com" /><p v-if="errors.email" class="mt-2 text-sm text-red-700">{{ errors.email }}</p></div>
          <div><div class="mb-2 flex items-center justify-between"><label class="text-sm font-semibold" for="password">Şifre</label><span class="text-xs text-[#6b786f]">Demo: demo1234</span></div><input id="password" v-model="password" class="field-input" type="password" autocomplete="current-password" placeholder="••••••••" /><p v-if="errors.password" class="mt-2 text-sm text-red-700">{{ errors.password }}</p></div>
          <p v-if="loginError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ loginError }}</p>
          <button class="button-primary w-full" type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap' }}</button>
        </form>
        <p class="mt-8 text-center text-xs text-[#8a948d]">Bitki bakım ekibiniz için güvenli çalışma alanı</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ layout: false });

const auth = useAuthStore();
const router = useRouter();
const loginError = ref('');
const { defineField, errors, handleSubmit, isSubmitting } = useForm({
  validationSchema: yup.object({
    email: yup.string().email('Geçerli bir e-posta girin').required('E-posta zorunlu'),
    password: yup.string().min(8, 'Şifre en az 8 karakter olmalı').required('Şifre zorunlu'),
  }),
});
const [email] = defineField('email');
const [password] = defineField('password');

const onSubmit = handleSubmit(async (values) => {
  loginError.value = '';
  try {
    const user = await auth.login(values.email, values.password);
    await router.push(user.role === 'ADMIN' ? '/dashboard' : '/field/today');
  } catch {
    loginError.value = 'E-posta veya şifre hatalı.';
  }
});
</script>
