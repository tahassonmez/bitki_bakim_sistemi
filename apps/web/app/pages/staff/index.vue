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
        <div v-for="member in staffList" :key="member.id" class="py-4 first:pt-0">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate font-semibold">{{ member.fullName }}</p>
              <p class="mt-1 truncate text-sm text-[#68736d]">{{ member.email }}<span v-if="member.phone"> · {{ member.phone }}</span></p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-3">
              <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="member.role === 'ADMIN' ? 'bg-[#f4ead5] text-[#9a6d2e]' : 'bg-[#e8edf6] text-[#4d668f]'">
                {{ member.role === 'ADMIN' ? 'Yönetici' : 'Personel' }}
              </span>
              <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="member.isActive ? 'bg-[#e4f0dd] text-[#2f6b4f]' : 'bg-[#f0f0ee] text-[#8a948d]'">
                {{ member.isActive ? 'Aktif' : 'Pasif' }}
              </span>
              <button
                v-if="member.role === 'STAFF'"
                class="button-secondary !min-h-9 !px-3 text-xs"
                type="button"
                @click="toggleShowPlants(member)"
              >
                {{ plantsOpenId === member.id ? 'Bitkileri gizle' : `Bitkilerim${plantsByStaff[member.id] ? ` (${plantsByStaff[member.id].length})` : ''}` }}
              </button>
              <button class="button-secondary !min-h-9 !px-3 text-xs" type="button" @click="toggleEdit(member)">
                {{ editingId === member.id ? 'Kapat' : 'Detay / Düzenle' }}
              </button>
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

          <div v-if="plantsOpenId === member.id" class="mt-4 rounded-2xl bg-[#f7f8f4] p-5">
            <div v-if="plantsLoadingId === member.id" class="space-y-2">
              <div v-for="i in 3" :key="i" class="h-10 animate-pulse rounded-lg bg-[#e5ebe3]" />
            </div>
            <p v-else-if="plantsErrorId === member.id" class="text-sm text-red-700">
              Bitkiler yüklenemedi.
              <button class="font-semibold underline" type="button" @click="loadPlants(member, true)">Tekrar dene</button>
            </p>
            <p v-else-if="!plantsByStaff[member.id]?.length" class="text-sm text-[#68736d]">
              Bu personele atanmış bir müşteri ya da bitki bulunmuyor.
            </p>
            <div v-else>
              <div class="relative mb-4">
                <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a948d]">⌕</span>
                <input v-model="plantsSearch[member.id]" type="text" class="field-input pl-10" placeholder="Bitki adı ya da kodu ile ara..." />
              </div>
              <p v-if="!filteredPlants(member).length" class="text-sm text-[#68736d]">
                "{{ plantsSearch[member.id] }}" ile eşleşen bir bitki yok.
              </p>
              <div v-else class="overflow-hidden rounded-2xl border border-[#e5ebe3] bg-white">
                <div class="max-h-96 overflow-y-auto overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead class="text-xs uppercase tracking-[0.1em] text-[#8a948d]">
                      <tr>
                        <th class="sticky top-0 z-10 bg-[#f0f4ed] px-5 py-3">Kod</th>
                        <th class="sticky top-0 z-10 bg-[#f0f4ed] px-5 py-3">Bitki</th>
                        <th class="sticky top-0 z-10 bg-[#f0f4ed] px-5 py-3">Müşteri</th>
                        <th class="sticky top-0 z-10 bg-[#f0f4ed] px-5 py-3">Konum</th>
                        <th class="sticky top-0 z-10 bg-[#f0f4ed] px-5 py-3">Sıradaki bakım</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#edf0eb]">
                      <tr v-for="plant in filteredPlants(member)" :key="plant.id" class="transition hover:bg-[#f7f8f4]">
                        <td class="px-5 py-3 font-mono text-xs text-[#68736d]">{{ plant.plantCode }}</td>
                        <td class="px-5 py-3">
                          <div class="flex items-center gap-3">
                            <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-[#d8e8cc] text-base text-[#203d30]">⚘</span>
                            <div class="min-w-0">
                              <NuxtLink :to="`/plants/${plant.id}`" class="font-semibold text-[#2f6b4f] hover:underline">{{ plant.name }}</NuxtLink>
                              <p class="text-xs text-[#8a948d]">{{ plant.species }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-5 py-3">{{ plant.location.customer.name }}</td>
                        <td class="px-5 py-3">{{ plant.location.name }}</td>
                        <td class="px-5 py-3">
                          <span v-if="plant.nextMaintenanceDate" class="rounded-lg bg-[#edf4ed] px-2.5 py-1 text-xs font-semibold text-[#2f6b4f]">
                            {{ formatDate(plant.nextMaintenanceDate) }}
                          </span>
                          <span v-else class="text-[#8a948d]">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div v-if="editingId === member.id" class="mt-4 rounded-2xl bg-[#f7f8f4] p-5">
            <dl class="mb-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a948d]">Kayıt tarihi</dt>
                <dd class="mt-1 text-[#3a453e]">{{ formatDate(member.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a948d]">Rol</dt>
                <dd class="mt-1 text-[#3a453e]">{{ member.role === 'ADMIN' ? 'Yönetici' : 'Personel' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a948d]">Durum</dt>
                <dd class="mt-1 text-[#3a453e]">{{ member.isActive ? 'Aktif' : 'Pasif' }}</dd>
              </div>
            </dl>

            <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSaveEdit(member)">
              <label class="block text-sm">
                <span class="mb-2 block font-semibold">Ad soyad</span>
                <input v-model="editForm.fullName" class="field-input" type="text" required />
              </label>
              <label class="block text-sm">
                <span class="mb-2 block font-semibold">E-posta</span>
                <input v-model="editForm.email" class="field-input" type="email" required />
              </label>
              <label class="block text-sm">
                <span class="mb-2 block font-semibold">Telefon</span>
                <input v-model="editForm.phone" class="field-input" type="text" />
              </label>
              <label class="block text-sm">
                <span class="mb-2 block font-semibold">Rol</span>
                <select v-model="editForm.role" class="field-input">
                  <option value="STAFF">Personel</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </label>

              <div class="sm:col-span-2 mt-2 border-t border-[#e5ebe3] pt-4">
                <p class="text-sm font-semibold">Giriş şifresini değiştir</p>
                <p class="mt-1 text-xs text-[#8a948d]">Şifreyi değiştirmek istemiyorsan bu alanı boş bırak.</p>
                <input
                  v-model="editForm.password"
                  class="field-input mt-3"
                  type="password"
                  minlength="8"
                  placeholder="Yeni şifre (en az 8 karakter)"
                  autocomplete="new-password"
                />
              </div>

              <div v-if="editError || editSuccess" class="sm:col-span-2">
                <p v-if="editError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ editError }}</p>
                <p v-if="editSuccess" class="rounded-xl bg-[#e4f0dd] px-4 py-3 text-sm text-[#2f6b4f]">{{ editSuccess }}</p>
              </div>
              <div class="sm:col-span-2 flex gap-3">
                <button class="button-primary" type="submit" :disabled="saving">
                  {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
                </button>
                <button class="button-secondary" type="button" @click="toggleEdit(member)">Vazgeç</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CreateStaffInput, Plant, StaffMember, UpdateStaffInput } from '~/types/api';

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

const editingId = ref<string | null>(null);
const saving = ref(false);
const editError = ref('');
const editSuccess = ref('');

const editForm = reactive<UpdateStaffInput & { password: string }>({
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF',
  password: '',
});

const toggleEdit = (member: StaffMember) => {
  editError.value = '';
  editSuccess.value = '';
  if (editingId.value === member.id) {
    editingId.value = null;
    return;
  }
  editingId.value = member.id;
  editForm.fullName = member.fullName;
  editForm.email = member.email;
  editForm.phone = member.phone ?? '';
  editForm.role = member.role;
  editForm.password = '';
};

const onSaveEdit = async (member: StaffMember) => {
  saving.value = true;
  editError.value = '';
  editSuccess.value = '';
  try {
    const body: UpdateStaffInput = {
      fullName: editForm.fullName,
      email: editForm.email,
      phone: editForm.phone || null,
      role: editForm.role,
    };
    if (editForm.password) body.password = editForm.password;

    await request(`/staff/${member.id}`, { method: 'PATCH', body });
    editForm.password = '';
    editSuccess.value = 'Bilgiler kaydedildi.';
    await refresh();
  } catch {
    editError.value = 'Kaydedilemedi. Bilgileri kontrol edip tekrar dene.';
  } finally {
    saving.value = false;
  }
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

// Bir personelin bakmakla yükümlü olduğu bitkiler — istendiğinde (butona
// basılınca) yükleniyor ve tekrar açılana kadar önbellekte tutuluyor, her
// açışta yeniden istek atmasın diye.
const plantsOpenId = ref<string | null>(null);
const plantsByStaff = reactive<Record<string, Plant[]>>({});
const plantsLoadingId = ref<string | null>(null);
const plantsErrorId = ref<string | null>(null);
const plantsSearch = reactive<Record<string, string>>({});

function filteredPlants(member: StaffMember) {
  const list = plantsByStaff[member.id] ?? [];
  const term = (plantsSearch[member.id] ?? '').trim().toLowerCase();
  if (!term) return list;
  return list.filter((plant) => plant.name.toLowerCase().includes(term) || plant.plantCode.toLowerCase().includes(term));
}

async function loadPlants(member: StaffMember, force = false) {
  if (!force && member.id in plantsByStaff) return;
  plantsLoadingId.value = member.id;
  plantsErrorId.value = null;
  try {
    plantsByStaff[member.id] = await request<Plant[]>(`/staff/${member.id}/plants`);
  } catch {
    plantsErrorId.value = member.id;
  } finally {
    if (plantsLoadingId.value === member.id) plantsLoadingId.value = null;
  }
}

function toggleShowPlants(member: StaffMember) {
  if (plantsOpenId.value === member.id) {
    plantsOpenId.value = null;
    return;
  }
  plantsOpenId.value = member.id;
  loadPlants(member);
}
</script>
