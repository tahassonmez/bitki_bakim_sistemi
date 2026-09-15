# Gün 18 — Personel Mobil Akışı, PWA ve QR Okuma

> 4. Hafta · Bitki/bakım ekranları, QR/PWA, yönetici paneli, cilalama

Bugün, kullanıcı isteğinin mobil tarafını tamamen kapatıyoruz: "Personel sahada bir bitkinin QR kodunu okuttuğunda doğrudan o bitkinin bilgileri açılmalı." PWA kurulumuyla da telefona "uygulama gibi" eklenebilir hale getiriyoruz.

---

## 🎯 Bugünün hedefi

1. `field` layout altında sade "Bugün Yapılacaklar" sayfası.
2. QR tarama sayfası — kamera erişimli okuma, okunan kod bitki detayına yönlendirir.
3. Nuxt PWA modülü kurulumu (manifest, service worker, ana ekrana ekle).
4. Gerçek bir telefonda uçtan uca test.

---

## 🤔 Neden?

- PWA seçimi (native app yerine) bilinçli bir mimari karar: tek codebase, app store onay süreci yok, güncellemeler anında yayılıyor — sahada çalışan küçük/orta ölçekli bir ekip için native app'in getirisi, bakım maliyetine değmiyor.
- QR tarama sayfasının kendi başına bir route olması (`/field/scan`), ileride "QR okut → direkt bakım formu aç" gibi kısayolları tek bir yerden yönetmeni sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-18-pwa-qr-mobil
pnpm --filter @hr/web add html5-qrcode
pnpm --filter @hr/web add -D @vite-pwa/nuxt
```

### 1. "Bugün Yapılacaklar" sayfası

`apps/web/pages/field/today.vue` (layout: `field`):

- `GET /staff/:id/today-tasks` çağrısı (giriş yapan personelin id'siyle).
- Her görev büyük bir dokunmatik kart: bitki adı, kodu, müşteri/konum, "gecikti" ise kırmızı rozet.
- Karta dokununca `/plants/[id]`'ye git (aynı detay sayfası, ama `field` layout'unda sadeleştirilmiş bir görünüm gösterecek şekilde — `layout` meta'sını sayfa içinde `authStore.user.role` bazlı koşullu ayarlayabilirsin ya da ayrı bir `field/plants/[id].vue` route'u tercih edebilirsin).

### 2. QR tarama sayfası

`apps/web/pages/field/scan.vue`:

```vue
<script setup>
import { Html5Qrcode } from 'html5-qrcode';

const router = useRouter();
let scanner;

onMounted(() => {
  scanner = new Html5Qrcode('qr-reader');
  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      scanner.stop();
      const url = new URL(decodedText);
      router.push(url.pathname); // ör. /plants/<id>
    },
    () => {}, // okuma hatalarını sessizce yut, sürekli deniyor zaten
  );
});

onBeforeUnmount(() => scanner?.stop().catch(() => {}));
</script>

<template>
  <div id="qr-reader" class="w-full max-w-sm mx-auto"></div>
</template>
```

`field` layout'undaki büyük "QR Tara" butonunu bu sayfaya bağla.

### 3. PWA kurulumu

`apps/web/nuxt.config.ts`'e ekle:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Bitki Bakım Takip',
      short_name: 'BitkiBakım',
      theme_color: '#16a34a',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  },
});
```

İki ikon dosyasını (`public/icon-192.png`, `public/icon-512.png`) basit bir logo ile oluştur.

### 4. Gerçek telefonda test

Lokal ağında `apps/web`'i `--host` ile başlat (`pnpm --filter @hr/web dev -- --host`) ve telefonundan bilgisayarının IP'sine bağlan (kamera erişimi için HTTPS gerekebilir — geliştirme ortamında `localhost` tünelleme aracı, ör. `ngrok`, kullanmayı düşün). Akışı dene: siteyi aç → "Ana ekrana ekle" → ikonla aç → QR tara → bir bitkinin kodunu okut → detay açılsın → bakım işaretle → fotoğraf ekle.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Telefon kamerasıyla bir bitkinin QR'ı okutulduğunda doğru bitki detay sayfası açılıyor.
- [ ] Site "ana ekrana eklenebiliyor" ve PWA olarak açılıyor.
- [ ] "Bugün Yapılacaklar" listesi gerçek veriyle doluyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 19 — Yönetici paneli ve personel yönetimi](./gun-19.md) ile yönetici tarafını tamamlıyoruz.
