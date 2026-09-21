<template>
  <NuxtLayout :name="layoutName">
    <div v-if="pending">
      <div class="h-40 animate-pulse rounded-2xl bg-[#e5ebe3]" />
    </div>
    <div v-else-if="!plant">
      <p class="panel p-10 text-center text-sm text-[#68736d]">Bitki bulunamadı.</p>
    </div>
    <div v-else>
      <NuxtLink :to="backLink" class="text-sm font-semibold text-[#2f6b4f]">← {{ backLabel }}</NuxtLink>

      <div class="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p class="font-mono text-xs text-[#8a948d]">{{ plant.plantCode }}</p>
          <h2 class="display mt-1 text-3xl font-semibold tracking-tight">{{ plant.name }}</h2>
          <p class="mt-1 text-[#68736d]">{{ plant.species }} · {{ plant.location.customer.name }} · {{ plant.location.name }}</p>
        </div>
        <span
          class="h-fit rounded-full px-3 py-1 text-xs font-semibold"
          :class="plant.status === 'ACTIVE' ? 'bg-[#e4f0dd] text-[#2f6b4f]' : 'bg-[#f0ece5] text-[#8a7b5f]'"
        >
          {{ plant.status === 'ACTIVE' ? 'Aktif' : 'Kaldırıldı' }}
        </span>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div class="panel p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Saksı</p><p class="mt-2 font-semibold">{{ plant.potInfo || '—' }}</p></div>
        <div class="panel p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Ölçü</p><p class="mt-2 font-semibold">{{ plant.sizeInfo || '—' }}</p></div>
        <div class="panel p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Sisteme giriş</p><p class="mt-2 font-semibold">{{ formatDate(plant.registeredAt) }}</p></div>
        <div class="panel p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Bakım sıklığı</p><p class="mt-2 font-semibold">{{ plant.careFrequencyDays }} günde bir</p></div>
        <div class="panel p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Son bakım</p><p class="mt-2 font-semibold">{{ formatDate(plant.lastMaintenanceDate) }}</p></div>
        <div class="panel p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a948d]">Sıradaki bakım</p>
          <p class="mt-2 font-semibold" :class="isOverdue ? 'text-[#a15d47]' : ''">{{ formatDate(plant.nextMaintenanceDate) }}</p>
        </div>
      </div>

      <div class="panel mt-10 p-6 sm:p-8">
        <h3 class="display text-xl font-semibold">QR kod</h3>
        <p class="mt-1 text-sm text-[#68736d]">Sahada bu kodu okutan personel doğrudan bu sayfaya yönlenir.</p>
        <div class="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div class="grid size-40 place-items-center rounded-2xl border border-[#dfe5dc] bg-white p-3">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR kod" class="size-full object-contain" />
            <div v-else class="size-full animate-pulse rounded-xl bg-[#e5ebe3]" />
          </div>
          <div class="flex gap-3 print:hidden">
            <a v-if="qrCodeUrl" :href="qrCodeUrl" :download="`${plant.plantCode}-qr.png`" class="button-secondary">İndir</a>
            <button type="button" class="button-secondary" @click="printPage">Yazdır</button>
          </div>
        </div>
      </div>

      <div class="panel mt-10 p-6 sm:p-8 print:hidden">
        <h3 class="display text-xl font-semibold">Bakım yap</h3>
        <p class="mt-1 text-sm text-[#68736d]">Yapılan işlemleri işaretle, kullanılan ürünü ekle, istersen fotoğraf çek.</p>
        <div class="mt-6">
          <MaintenanceLogForm :plant-id="plantId" @saved="onMaintenanceSaved" />
        </div>
      </div>

      <div class="mt-10 flex items-center justify-between">
        <h3 class="display text-xl font-semibold">Bakım geçmişi</h3>
        <span class="text-sm text-[#68736d]">{{ logs?.length ?? 0 }} kayıt</span>
      </div>
      <div v-if="logsPending" class="mt-4 h-24 animate-pulse rounded-2xl bg-[#e5ebe3]" />
      <div v-else-if="!logs?.length" class="panel mt-4 p-8 text-center text-sm text-[#68736d]">Henüz bakım kaydı girilmedi.</div>
      <div v-else class="mt-4 space-y-4">
        <div v-for="log in logs" :key="log.id" class="panel p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-semibold">{{ formatDateTime(log.date) }}</p>
            <p class="text-sm text-[#68736d]">{{ log.staff.fullName }}</p>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="action in log.actions" :key="action.id" class="rounded-full bg-[#e4f0dd] px-3 py-1 text-xs font-semibold text-[#2f6b4f]">
              {{ action.type.name }}
            </span>
          </div>
          <p v-if="log.products.length" class="mt-3 text-sm text-[#68736d]">
            Kullanılan ürünler:
            <span v-for="(usage, index) in log.products" :key="usage.id">
              {{ usage.product.name }}<template v-if="usage.quantityUsed"> ({{ usage.quantityUsed }}{{ usage.product.unit ? ' ' + usage.product.unit : '' }})</template>{{ index < log.products.length - 1 ? ', ' : '' }}
            </span>
          </p>
          <p v-if="log.notes" class="mt-3 text-sm text-[#3c453f]">{{ log.notes }}</p>
        </div>
      </div>

      <div class="mt-10 flex items-center justify-between">
        <h3 class="display text-xl font-semibold">Fotoğraflar</h3>
        <span class="text-sm text-[#68736d]">{{ allPhotos.length }} fotoğraf</span>
      </div>
      <div v-if="!allPhotos.length" class="panel mt-4 p-8 text-center text-sm text-[#68736d]">Henüz fotoğraf eklenmedi.</div>
      <div v-else class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        <div v-for="photo in allPhotos" :key="photo.id" class="relative aspect-square overflow-hidden rounded-xl border border-[#dfe5dc]">
          <button type="button" class="size-full" @click="lightboxPhoto = photo.url">
            <img :src="photo.url" class="size-full object-cover" alt="Bakım fotoğrafı" />
          </button>
          <button
            type="button"
            class="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-sm font-semibold text-white transition hover:bg-[#a15d47] disabled:opacity-50 print:hidden"
            :disabled="deletingPhotoId === photo.id"
            title="Fotoğrafı sil"
            aria-label="Fotoğrafı sil"
            @click.stop="onDeletePhoto(photo)"
          >
            <span v-if="deletingPhotoId === photo.id">…</span>
            <span v-else aria-hidden="true">×</span>
          </button>
        </div>
      </div>
      <p v-if="photoDeleteError" class="mt-3 text-sm text-[#a15d47]">{{ photoDeleteError }}</p>

      <div v-if="lightboxPhoto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" @click="lightboxPhoto = null">
        <img :src="lightboxPhoto" class="max-h-full max-w-full rounded-xl" alt="Bakım fotoğrafı büyük görünüm" />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { MaintenanceLog, MaintenancePhoto, PlantDetail } from '~/types/api';

definePageMeta({ layout: false });

const route = useRoute();
// route.params.id'yi düz bir değişkene almak yerine computed olarak tutuyoruz:
// /plants/A sayfasındayken QR ile ya da bir listeden /plants/B'ye geçildiğinde
// Vue Router aynı sayfa bileşenini yeniden kullanıyor (component yeniden
// oluşturulmuyor), bu yüzden sabit bir değişken hep İLK açılan bitkide kalır
// ve yeni taranan/tıklanan bitkinin bilgileri hiç güncellenmezdi. computed +
// watch ile route değiştikçe veriler de yeniden çekiliyor.
const plantId = computed(() => route.params.id as string);
const { request } = useApi();
const auth = useAuthStore();

const layoutName = computed(() => (auth.user?.role === 'STAFF' ? 'field' : 'admin'));
const backLink = computed(() => (auth.user?.role === 'STAFF' ? '/field/today' : '/plants'));
const backLabel = computed(() => (auth.user?.role === 'STAFF' ? 'Bugünkü listeye dön' : 'Bitkilere dön'));

const { data: plant, pending, refresh } = await useAsyncData(
  () => `plant-${plantId.value}`,
  () => request<PlantDetail>(`/plants/${plantId.value}`),
  { watch: [plantId] },
);
const { data: logs, pending: logsPending, refresh: refreshLogs } = await useAsyncData(
  () => `plant-${plantId.value}-logs`,
  () => request<MaintenanceLog[]>(`/plants/${plantId.value}/maintenance-logs`),
  { watch: [plantId] },
);

async function onMaintenanceSaved() {
  await Promise.all([refresh(), refreshLogs()]);
}

const allPhotos = computed(() => (logs.value ?? []).flatMap((log) => log.photos));
const lightboxPhoto = ref<string | null>(null);

const deletingPhotoId = ref<string | null>(null);
const photoDeleteError = ref('');

async function onDeletePhoto(photo: MaintenancePhoto) {
  if (!confirm('Bu fotoğrafı silmek istediğine emin misin? Bu işlem geri alınamaz.')) return;
  photoDeleteError.value = '';
  deletingPhotoId.value = photo.id;
  try {
    await request(`/photos/${photo.id}`, { method: 'DELETE' });
    if (lightboxPhoto.value === photo.url) lightboxPhoto.value = null;
    await refreshLogs();
  } catch {
    photoDeleteError.value = 'Fotoğraf silinemedi. Tekrar dene.';
  } finally {
    deletingPhotoId.value = null;
  }
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const isOverdue = computed(() => {
  if (!plant.value?.nextMaintenanceDate) return false;
  return new Date(plant.value.nextMaintenanceDate) < today;
});

const formatDate = (date: string | null) =>
  date ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)) : '—';
const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    new Date(date),
  );

const qrCodeUrl = ref<string | null>(null);
let qrObjectUrl: string | null = null;

function revokeQrObjectUrl() {
  if (qrObjectUrl) {
    URL.revokeObjectURL(qrObjectUrl);
    qrObjectUrl = null;
  }
}

async function loadQrCode() {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('auth_token');
  const idAtRequestTime = plantId.value;
  try {
    const response = await fetch(`${config.public.apiBase}/plants/${idAtRequestTime}/qrcode`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    if (!response.ok) return;
    const blob = await response.blob();
    // Bu sırada başka bir bitkiye geçilmiş olabilir (aynı bileşen yeniden
    // kullanılıyor) — geç gelen bir cevap yanlış bitkinin QR kodunu göstermesin.
    if (idAtRequestTime !== plantId.value) return;
    revokeQrObjectUrl();
    qrObjectUrl = URL.createObjectURL(blob);
    qrCodeUrl.value = qrObjectUrl;
  } catch {
    // sessizce yok say; kullanıcı sayfayı yenileyip tekrar deneyebilir
  }
}

onMounted(loadQrCode);
watch(plantId, () => {
  qrCodeUrl.value = null;
  loadQrCode();
});
onBeforeUnmount(revokeQrObjectUrl);

function printPage() {
  window.print();
}
</script>
