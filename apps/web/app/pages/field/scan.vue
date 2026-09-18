<template>
  <div>
    <div class="mb-6">
      <h2 class="display text-2xl font-semibold tracking-tight">QR kodu okut</h2>
      <p class="mt-2 text-sm leading-6 text-[#68736d]">
        Bitkinin üzerindeki QR kodu kameraya göster, otomatik olarak bitki sayfasına yönleneceksin.
      </p>
    </div>

    <div class="panel relative overflow-hidden p-4">
      <div
        id="qr-reader"
        class="mx-auto w-full max-w-sm overflow-hidden rounded-xl bg-[#e5ebe3]"
        :class="{ 'aspect-square': !cameraStarted }"
      ></div>
      <div v-if="cameraLoading && !errorMessage" class="pointer-events-none absolute inset-0 grid place-items-center">
        <div class="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-6 py-4">
          <span class="size-6 animate-spin rounded-full border-2 border-[#d8e8cc] border-t-[#2f6b4f]"></span>
          <p class="text-sm font-medium text-[#68736d]">Kamera açılıyor...</p>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{{ errorMessage }}</p>
      <button class="button-secondary mt-3 !min-h-9 !px-3 text-xs" type="button" @click="startScanner">Kamerayı tekrar dene</button>
    </div>

    <div class="panel mt-6 p-5">
      <p class="mb-1 text-sm font-semibold">Kamera açılmıyor mu?</p>
      <p class="mb-3 text-sm text-[#68736d]">Bitkinin üzerindeki kodu (ör. WSK-000006) elle yazıp doğrudan sayfasını açabilirsin.</p>
      <form class="flex gap-2" @submit.prevent="onManualSubmit">
        <input v-model="manualCode" class="field-input flex-1" type="text" placeholder="Örn. WSK-000006" />
        <button class="button-primary !min-h-12 shrink-0 !px-5" type="submit" :disabled="manualLoading || !manualCode.trim()">
          {{ manualLoading ? 'Aranıyor...' : 'Git' }}
        </button>
      </form>
      <p v-if="manualError" class="mt-3 text-sm text-red-700">{{ manualError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Plant } from '~/types/api';

definePageMeta({ layout: 'field' });

const router = useRouter();
const { request } = useApi();

const errorMessage = ref('');
const cameraStarted = ref(false);
const cameraLoading = ref(true);
const manualCode = ref('');
const manualLoading = ref(false);
const manualError = ref('');

let scanner: { stop: () => Promise<void>; clear?: () => void } | undefined;

// html5-qrcode bazen tarama alanının içine kamera/flaş kontrolleri gibi ek
// arayüz öğeleri ekliyor. Sadece stop() çağırmak kamerayı durdurur ama bu
// öğeleri DOM'dan temizlemeyebilir; sayfadan ayrılınca bunlar ekranda asılı
// kalıp diğer sayfalardaki (ör. alt menü) butonların üstüne binip tıklamaları
// yutabilir. Bu yüzden her zaman stop() + clear() birlikte çağrılıyor ve
// tarama kutusunun içeriği elle de boşaltılıyor.
async function stopAndCleanupScanner() {
  const current = scanner;
  scanner = undefined;
  if (current) {
    try {
      await current.stop();
    } catch {
      // zaten durmuş olabilir, yok say
    }
    try {
      current.clear?.();
    } catch {
      // yok say
    }
  }
  const readerEl = document.getElementById('qr-reader');
  if (readerEl) readerEl.innerHTML = '';
}

function extractPlantId(decodedText: string): string {
  try {
    const url = new URL(decodedText);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? decodedText;
  } catch {
    // QR kod tam bir URL değilse, doğrudan bitki id'si olarak dene
    return decodedText;
  }
}

async function goToPlant(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) return;

  // Bitki kodu (WSK-...) girildiyse önce id'sini bul, sonra o sayfaya git
  if (/^wsk-/i.test(trimmed)) {
    try {
      const matches = await request<Plant[]>(`/plants?code=${encodeURIComponent(trimmed)}`);
      if (matches[0]) {
        await router.push(`/plants/${matches[0].id}`);
        return;
      }
      manualError.value = `"${trimmed}" koduyla bir bitki bulunamadı.`;
    } catch {
      manualError.value = 'Bitki aranırken bir sorun oluştu. Tekrar dene.';
    }
    return;
  }

  await router.push(`/plants/${extractPlantId(trimmed)}`);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('camera-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function handleDecoded(decodedText: string) {
  stopAndCleanupScanner();
  goToPlant(decodedText);
}

async function onManualSubmit() {
  manualLoading.value = true;
  manualError.value = '';
  try {
    await goToPlant(manualCode.value);
  } finally {
    manualLoading.value = false;
  }
}

async function startScanner() {
  errorMessage.value = '';
  cameraStarted.value = false;
  cameraLoading.value = true;

  if (!window.isSecureContext) {
    cameraLoading.value = false;
    errorMessage.value =
      'Kamera yalnızca güvenli bir bağlantı üzerinden (HTTPS ya da localhost) çalışır. Telefondan yerel ağ IP\'si üzerinden http:// ile bağlandıysan kamera açılmaz — aşağıdan bitki kodunu elle girebilirsin.';
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraLoading.value = false;
    errorMessage.value = 'Bu tarayıcı kamera erişimini desteklemiyor. Aşağıdan bitki kodunu elle girebilirsin.';
    return;
  }

  try {
    const { Html5Qrcode } = await import('html5-qrcode');
    const readerEl = document.getElementById('qr-reader');
    if (readerEl) readerEl.innerHTML = '';
    const instance = new Html5Qrcode('qr-reader');
    scanner = instance;
    // Bazı durumlarda tarayıcının kamera izni penceresi kullanıcıya gösterilmeden
    // (ör. sekme arka planda kalmış, izin daha önce kalıcı reddedilmiş) start()
    // hiç sonuçlanmadan asılı kalabilir; bu da tüm sayfayı "takılı" gösterir.
    // 12 saniye içinde sonuçlanmazsa zaman aşımına düşürüp elle girişe yönlendiriyoruz.
    await withTimeout(
      instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, handleDecoded, () => {}),
      12000,
    );
    cameraStarted.value = true;
    cameraLoading.value = false;
  } catch (error) {
    cameraStarted.value = false;
    cameraLoading.value = false;
    const name = (error as { name?: string })?.name ?? '';
    const message = (error as { message?: string })?.message ?? '';
    if (message === 'camera-timeout') {
      errorMessage.value =
        'Kamera açılması çok uzun sürdü. Tarayıcının üst kısmında kamera izni isteyen küçük bir bildirim/pencere olup olmadığını kontrol et ve izin ver; sorun devam ederse aşağıdan bitki kodunu elle girebilirsin.';
    } else if (name === 'NotAllowedError') {
      errorMessage.value = 'Kamera izni reddedildi. Tarayıcı ayarlarından bu site için kamera iznini açıp tekrar dene.';
    } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      errorMessage.value = 'Bu cihazda kullanılabilir bir kamera bulunamadı. Aşağıdan bitki kodunu elle girebilirsin.';
    } else {
      errorMessage.value =
        'Kameraya erişilemedi. Tarayıcı izinlerini kontrol et; sorun devam ederse aşağıdan bitki kodunu elle girebilirsin.';
    }
  }
}

onMounted(startScanner);
onBeforeUnmount(() => {
  stopAndCleanupScanner();
});
</script>
