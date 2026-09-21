<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="emit('close')">
    <div class="panel w-full max-w-md p-6">
      <div class="flex items-center justify-between">
        <h3 class="display text-lg font-semibold">{{ location ? 'Konumu düzenle' : 'Yeni konum' }}</h3>
        <button class="text-xl leading-none text-[#8a948d]" type="button" @click="emit('close')">×</button>
      </div>
      <form class="mt-6 space-y-4" @submit="onSubmit">
        <div>
          <label class="mb-2 block text-sm font-semibold" for="location-name">Konum adı</label>
          <input id="location-name" v-model="name" class="field-input" type="text" placeholder="Örn. A Blok Bahçesi" />
          <p v-if="errors.name" class="mt-2 text-sm text-red-700">{{ errors.name }}</p>
        </div>
        <div class="relative">
          <label class="mb-2 block text-sm font-semibold" for="location-address">Adres</label>
          <input
            id="location-address"
            v-model="address"
            class="field-input"
            type="text"
            autocomplete="off"
            placeholder="Adres yazmaya başla, öneriler çıkacak"
            @focus="showSuggestions = true"
            @blur="onAddressBlur"
          />
          <ul
            v-if="showSuggestions && (addressSuggestions.length || addressLoading)"
            class="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#dfe5dc] bg-white shadow-lg"
          >
            <li v-if="addressLoading" class="px-4 py-2 text-sm text-[#8a948d]">Aranıyor...</li>
            <li
              v-for="suggestion in addressSuggestions"
              :key="suggestion.id"
              class="cursor-pointer px-4 py-2 text-sm hover:bg-[#f0f4ed]"
              @mousedown.prevent="selectSuggestion(suggestion)"
            >
              {{ suggestion.displayName }}
            </li>
          </ul>
          <p class="mt-1.5 text-xs text-[#8a948d]">
            Öneri listesinden bir adres seçersen konum haritada da işaretlenir; seçmeden de düz metin olarak kaydedebilirsin.
          </p>
          <div ref="mapContainerRef" class="mt-3 h-48 w-full overflow-hidden rounded-xl border border-[#dfe5dc] bg-[#f0f4ed]" />
          <p v-if="latitude != null && longitude != null" class="mt-1.5 text-xs text-[#8a948d]">
            Haritaya tıklayarak ya da iğneyi sürükleyerek konumu hassaslaştırabilirsin.
          </p>
          <a
            v-if="mapsUrl"
            :href="mapsUrl"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-block text-xs font-semibold text-[#2f6b4f] hover:underline"
          >
            Haritada gör ↗
          </a>
        </div>
        <p v-if="submitError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ submitError }}</p>
        <div class="flex items-center gap-3">
          <button class="button-primary" type="submit" :disabled="loading">{{ loading ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          <button class="button-secondary" type="button" @click="emit('close')">Vazgeç</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useLeaflet } from '~/composables/useLeaflet';
import { useAddressSearch, type AddressSuggestion } from '~/composables/useAddressSearch';
import type { Location } from '~/types/api';

const props = defineProps<{
  customerId: string;
  location?: Location;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const { request } = useApi();
const loading = ref(false);
const submitError = ref('');

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: yup.object({ name: yup.string().required('Konum adı zorunlu') }),
  initialValues: { name: props.location?.name ?? '', address: props.location?.address ?? '' },
});
const [name] = defineField('name');
const [address] = defineField('address');

// Adres önerileri ve harita için koordinat bilgisi. Bir öneri seçilmeden düz
// metin yazılırsa bunlar boş kalır — konum yine de adı ve (varsa) yazılan
// adres metniyle kaydedilir.
const latitude = ref<number | null>(props.location?.latitude ?? null);
const longitude = ref<number | null>(props.location?.longitude ?? null);
const placeId = ref<string | null>(props.location?.placeId ?? null);

// Koordinat varsa (bir öneri seçildiyse) en kesin sonuç için onu kullanıyoruz;
// yoksa da yazılan adres metniyle Google'da arama yapılabilsin diye adres
// üzerinden bir arama linki oluşturuyoruz — böylece öneri seçmeden düz metin
// yazılsa bile "Haritada gör" linki çalışır.
const mapsUrl = computed(() => {
  if (latitude.value != null && longitude.value != null) {
    return `https://www.google.com/maps?q=${latitude.value},${longitude.value}`;
  }
  const query = String(address.value ?? '').trim();
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
});

const { suggestions: addressSuggestions, loading: addressLoading, search: searchAddress, clear: clearAddressSuggestions } = useAddressSearch();
const showSuggestions = ref(false);

watch(address, (value) => {
  showSuggestions.value = true;
  searchAddress(String(value ?? ''));
});

function onAddressBlur() {
  // Öneriye tıklama (mousedown) blur'dan önce yakalanıyor; küçük bir gecikme
  // dropdown'ın gereksiz yere erken kapanmasını önlüyor.
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
}

const mapContainerRef = ref<HTMLElement | null>(null);
let leaflet: any = null;
let map: any = null;
let marker: any = null;

// Konum seçilmeden önce haritayı İstanbul'a odaklı gösteriyoruz (işin
// yapıldığı bölge); bir adres seçilince ya da mevcut bir konum düzenlenirken
// iğne oraya taşınıp yakınlaşıyor.
const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784];

function placeMarker(L: any, position: [number, number]) {
  if (!map) return;
  if (marker) {
    marker.setLatLng(position);
  } else {
    marker = L.marker(position, { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      latitude.value = pos.lat;
      longitude.value = pos.lng;
    });
  }
}

function selectSuggestion(suggestion: AddressSuggestion) {
  address.value = suggestion.displayName;
  latitude.value = suggestion.lat;
  longitude.value = suggestion.lon;
  placeId.value = suggestion.id;
  showSuggestions.value = false;
  clearAddressSuggestions();

  if (map && leaflet) {
    const position: [number, number] = [suggestion.lat, suggestion.lon];
    map.setView(position, 16);
    placeMarker(leaflet, position);
  }
}

onMounted(async () => {
  try {
    leaflet = await useLeaflet().load();
    if (!mapContainerRef.value) return;

    const hasInitialPosition = latitude.value != null && longitude.value != null;
    const initialCenter: [number, number] = hasInitialPosition ? [latitude.value as number, longitude.value as number] : DEFAULT_CENTER;

    map = leaflet.map(mapContainerRef.value).setView(initialCenter, hasInitialPosition ? 16 : 11);
    leaflet
      .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıda bulunanlar',
        maxZoom: 19,
      })
      .addTo(map);

    if (hasInitialPosition) placeMarker(leaflet, initialCenter);

    // Haritaya tıklayarak da iğneyi doğrudan o noktaya koyabiliyoruz —
    // sürüklemeye alternatif, daha hızlı bir hassaslaştırma yolu.
    map.on('click', (event: any) => {
      const position: [number, number] = [event.latlng.lat, event.latlng.lng];
      latitude.value = position[0];
      longitude.value = position[1];
      placeMarker(leaflet, position);
    });
  } catch (error) {
    // Harita yüklenemezse (ör. ağ sorunu) adres alanı sade bir metin girişi
    // olarak çalışmaya devam eder, formu bloklamaz.
    console.warn('[Konum haritası] Harita yüklenemedi:', error);
  }
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
  marker = null;
  clearAddressSuggestions();
});

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  submitError.value = '';
  try {
    const payload = {
      name: values.name,
      address: values.address || undefined,
      latitude: latitude.value ?? undefined,
      longitude: longitude.value ?? undefined,
      placeId: placeId.value ?? undefined,
    };
    if (props.location) {
      await request(`/locations/${props.location.id}`, { method: 'PATCH', body: payload });
    } else {
      await request('/locations', { method: 'POST', body: { ...payload, customerId: props.customerId } });
    }
    emit('saved');
  } catch {
    submitError.value = 'Konum kaydedilemedi. Tekrar dene.';
  } finally {
    loading.value = false;
  }
});
</script>
