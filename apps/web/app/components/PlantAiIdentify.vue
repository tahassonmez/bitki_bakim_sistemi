<template>
  <div class="rounded-xl border border-dashed border-[#dfe5dc] bg-[#f7f8f4] p-4">
    <label class="mb-2 block text-sm font-semibold">AI ile bitkiyi tanı (opsiyonel)</label>
    <p class="mb-3 text-sm text-[#68736d]">Fotoğraf yükle ya da kamerayı aç, bitki adı ve tür bilgisini AI otomatik doldursun.</p>

    <div class="flex flex-wrap items-center gap-2">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="field-input !h-auto min-w-40 flex-1 py-3"
        :disabled="identifying"
        @change="onFileSelected"
      />
      <button
        type="button"
        class="button-secondary !min-h-12 shrink-0 !px-4"
        :disabled="identifying"
        @click="openCamera"
      >
        ⌾ Kamerayı Aç
      </button>
    </div>

    <div v-if="cameraOpen" class="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black/80 p-4">
      <video ref="videoRef" autoplay playsinline muted class="max-h-[70vh] w-full max-w-md rounded-xl bg-black object-cover"></video>
      <p v-if="cameraError" class="max-w-md text-center text-sm text-red-300">{{ cameraError }}</p>
      <div class="flex gap-3">
        <button type="button" class="button-primary" :disabled="!!cameraError" @click="capturePhoto">Fotoğraf Çek</button>
        <button type="button" class="button-secondary" @click="closeCamera">Vazgeç</button>
      </div>
    </div>

    <div v-if="previewUrl" class="relative mt-3 overflow-hidden rounded-xl border border-[#dfe5dc]">
      <img :src="previewUrl" class="max-h-56 w-full object-cover" alt="Seçilen bitki fotoğrafı" />
      <button
        type="button"
        class="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-sm text-white"
        aria-label="Fotoğrafı kaldır"
        :disabled="identifying"
        @click="clearPhoto"
      >
        ×
      </button>
    </div>

    <p v-if="identifying" class="mt-2 text-sm text-[#68736d]">Tanınıyor...</p>
    <p v-if="identifyError" class="mt-2 text-sm text-red-700">{{ identifyError }}</p>

    <div v-if="identifyResult" class="mt-3 space-y-2 rounded-xl bg-[#e4f0dd] px-4 py-3 text-sm text-[#2f6b4f]">
      <p class="font-semibold">{{ identifyResult.name }} ({{ identifyResult.species }})</p>
      <p v-if="identifyResult.description" class="text-[#3c453f]">{{ identifyResult.description }}</p>
      <p v-if="identifyResult.careTips" class="text-[#3c453f]"><strong>Bakım önerisi:</strong> {{ identifyResult.careTips }}</p>
      <a :href="googleSearchUrl" target="_blank" rel="noopener" class="inline-block font-semibold text-[#1f4937] underline">
        Google'da ara →
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlantIdentificationResult } from '~/types/api';

const emit = defineEmits<{ identified: [result: PlantIdentificationResult] }>();

const config = useRuntimeConfig();
const token = useCookie<string | null>('auth_token');

const fileInputRef = ref<HTMLInputElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

const cameraOpen = ref(false);
const cameraError = ref('');
let mediaStream: MediaStream | null = null;

const previewUrl = ref<string | null>(null);
const identifying = ref(false);
const identifyError = ref('');
const identifyResult = ref<PlantIdentificationResult | null>(null);

const googleSearchUrl = computed(() => {
  const query = identifyResult.value?.species || identifyResult.value?.name || '';
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} bitki bakımı`)}`;
});

async function openCamera() {
  identifyError.value = '';
  cameraError.value = '';
  cameraOpen.value = true;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
    }
  } catch {
    cameraError.value = 'Kameraya erişilemedi. Tarayıcı izinlerini kontrol et.';
  }
}

function stopStream() {
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}

function closeCamera() {
  stopStream();
  cameraOpen.value = false;
}

async function capturePhoto() {
  const video = videoRef.value;
  if (!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  closeCamera();
  if (!blob) return;

  const file = new File([blob], `kamera-${Date.now()}.jpg`, { type: 'image/jpeg' });
  await identify(file);
}

function clearPhoto() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  identifyResult.value = null;
  identifyError.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  identify(file);
}

async function identify(file: File) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);

  identifying.value = true;
  identifyError.value = '';
  identifyResult.value = null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${config.public.apiBase}/ai/identify-plant`, {
      method: 'POST',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('identify failed');
    const payload = (await response.json()) as { data: PlantIdentificationResult };
    identifyResult.value = payload.data;
    emit('identified', payload.data);
  } catch {
    identifyError.value = 'Bitki tanınamadı. Fotoğrafı değiştirip tekrar dene.';
  } finally {
    identifying.value = false;
  }
}

onBeforeUnmount(() => {
  stopStream();
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>
