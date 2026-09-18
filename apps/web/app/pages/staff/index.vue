<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm text-[#6b786f]">Ekip yönetimi</p>
        <h2 class="display mt-2 text-3xl font-semibold tracking-tight">Personel</h2>
      </div>
      <button class="button-primary !min-h-10 !px-4 text-sm" type="button" @click="showForm = !showForm">
        {{ showForm ? 'Vazgeç' : '+ Yeni personel ekle' }}
      </button>
    </div>

    <section v-if="showForm" class="panel mb-6 p-6">
      <h3 class="display text-lg font-semibold">Yeni personel</h3>
      <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="onCreate">
        <label class="block text-sm">
          <span class="mb-2 block font-semibold">Ad soyad</span>
          <input v-model="form.fullName" class="field-input" type="text" required />
        </label>
        <label class="block text-sm">
          <span class="mb-2 block font-semibold">E-posta</span>
          <input v-model="form.email" class="field-input" type="email" required />
        </label>
        <label class="block text-sm">
          <span class="mb-2 block font-semibold">Telefon</span>
          <input v-model="form.phone" class="field-input" type="text" />
        </label>
        <label class="block text-sm">
          <span class="mb-2 block font-semibold">Şifre</span>
          <input v-model="form.password" class="field-input" type="password" minlength="8" required />
        </label>
        <label class="block text-sm sm:col-span-2">
          <span class="mb-2 block font-semibold">Rol</span>
          <select v-model="form.role" class="field-input">
            <option value="STAFF">Personel</option>
            <option value="ADMIN">Yönetici</option>
          </select>
        </label>
        <div class="sm:col-span-2">
          <p v-if="createError" class="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ createError }}</p>
          <button class="button-primary" type="submit" :disabled="creating">
            {{ creating ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </form>
    </section>

    <section class="panel p-6">
      <div v-if="pending" class="space-y-3">
        <div v-for="item in 4" :key="item" class="h-16 animate-pulse rounded-xl bg-[#e5ebe3]" />
      </div>
      <div v-else-if="!staffList?.length" class="rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#68736d]">Henüz personel eklenmemiş.</div>
      <div v-else class="divide-y divide-[#edf0eb]">
        <div v-for="member in staffList" :key="member.id" class="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ member.fullName }}</p>
            <p class="mt-1 truncate text-sm text-[#68736d]">{{ member.email }}<span v-if="member.phone"> · {{ member.phone }}</span></p>
          </div>
          <div class="flex shrink-0 items-center gap-3">
            <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="member.role === 'ADMIN' ? 'bg-[#f4ead5] text-[#9a6d2e]' : 'bg-[#e8edf6] text-[#4d668f]'">
              {{ member.role === 'ADMIN' ? 'Yönetici' : 'Personel' }}
            </span>
            <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="member.isActive ? 'bg-[#e4f0dd] text-[#2f6b4f]' : 'bg-[#f0f0ee] text-[#8a948d]'">
              {{ member.isActive ? 'Aktif' : 'Pasif' }}
            </span>
            <button
              class="button-secondary !min-h-9 !px-3 text-xs"
              type="button"
              :disabled="togglingId === member.id"
              @click="onToggleActive(member)"
            >
              {{ member.isActive ? 'Pasifleştir' : 'Aktifleştir' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CreateStaffInput, StaffMember } from '~/types/api';

definePageMeta({ layout: 'admin' });

const { request } = useApi();
const { data: staffList, pending, refresh } = await useAsyncData('staff-list', () => request<StaffMember[]>('/staff'));

const showForm = ref(false);
const creating = ref(false);
const createError = ref('');
const togglingId = ref<string | null>(null);

const form = reactive<CreateStaffInput>({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'STAFF',
});

const resetForm = () => {
  form.fullName = '';
  form.email = '';
  form.phone = '';
  form.password = '';
  form.role = 'STAFF';
};

const onCreate = async () => {
  creating.value = true;
  createError.value = '';
  try {
    await request('/staff', {
      method: 'POST',
      body: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      },
    });
    resetForm();
    showForm.value = false;
    await refresh();
  } catch {
    createError.value = 'Personel eklenemedi. Bilgileri kontrol edip tekrar dene.';
  } finally {
    creating.value = false;
  }
};

const onToggleActive = async (member: StaffMember) => {
  togglingId.value = member.id;
  try {
    await request(`/staff/${member.id}`, {
      method: 'PATCH',
      body: { isActive: !member.isActive },
    });
    await refresh();
  } finally {
    togglingId.value = null;
  }
};
</script>
