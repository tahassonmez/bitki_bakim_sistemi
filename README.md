# Bitki Bakım Takip Sistemi

Peyzaj/bitki bakım ekipleri için müşteri, konum, bitki ve bakım geçmişini tek yerde tutan; yaklaşan/geciken bakımları otomatik hesaplayan; sahadaki personelin QR kod okutarak bakım kaydı girebildiği bir web + PWA sistemi.

**Durum:** `v1.0-mvp` — sistem gerçek sahada kullanılabilir durumda. MVP sonrası büyütme planı için bkz. [`docs/00-proje-genel-bakis.md` § 8](./docs/00-proje-genel-bakis.md#8-mvp-sonrası-büyütme-backlogu).

## Proje amacı

Bir bitki bakım ekibi, onlarca müşteride yüzlerce bitkiyi düzenli aralıklarla bakıma alır. Kağıt üzerinde veya dağınık tablolarda bu takip hızla kaybolur: hangi bitkinin ne zaman sulandığı, hangi ürünün kullanıldığı, hangi bakımın geciktiği belirsizleşir. Bu sistem şunu garanti eder:

- Her bitki **tekil bir kayıttır** (kendi `plantCode`'u, kendi QR'ı, kendi bakım geçmişi) — "50 adet" diye tek bir satıra indirgenmez.
- Bir bakım kaydı girildiğinde **sıradaki bakım tarihi otomatik hesaplanır** (`bakım tarihi + bakım sıklığı`).
- Yönetici, tüm müşteriler/bitkiler genelinde **yaklaşan ve geciken bakımları** tek ekrandan görür.
- Sahadaki personel, bitkinin üzerindeki **QR kodu okutarak** doğrudan o bitkinin bakım formuna gider — bitki aramaya gerek kalmaz.
- Her personel **sadece kendisine atanmış müşterilerin** bakımlarını görür; yöneticiler kısıtsız görür.

## MVP sonrası eklenen özellikler

İlk 20 günlük MVP tamamlandıktan sonra, gerçek kullanım geri bildirimiyle eklenen özellikler:

- **Personel–müşteri atama** — müşteri detay sayfasından bir müşteriye birden fazla personel atanabiliyor; saha modundaki "Bugünün bakımları" listesi personelin sadece kendi atandığı müşterilere göre filtreleniyor (§ 4.5).
- **Personel profili** — Personeller sayfasında her personelin kişisel bilgileri görüntülenebiliyor ve giriş şifresi admin tarafından değiştirilebiliyor.
- **Saha modunda yaklaşan bakımlar** — personel girişindeki "Bugünün bakımları" ekranına, admin panosundakiyle aynı tasarımda bir "Yaklaşan bakımlar" bölümü eklendi (önümüzdeki 7 gün).
- **Bakım fotoğrafı silme** — bitki detay sayfasındaki fotoğraf galerisinden yanlış/gereksiz fotoğraflar tek tıkla silinebiliyor.
- **Mobil yönetici menüsü** — admin paneli artık dar ekranlarda (telefon) kaybolmuyor; hamburger menüyle açılan bir kayar menü eklendi.
- **PWA / ana ekrana ekleme** — uygulama artık telefonda "ana ekrana ekle" ile gerçek bir uygulama gibi (tarayıcı çubuğu olmadan) açılabiliyor.

## Mimari özeti

Kısa özet aşağıda; veri modeli, iş kuralları ve teknoloji tercihlerinin **tam ve güncel referansı** [`docs/00-proje-genel-bakis.md`](./docs/00-proje-genel-bakis.md) dosyasındadır — özellikle:

- [§ 1 Teknoloji yığını](./docs/00-proje-genel-bakis.md#1-teknoloji-yığını)
- [§ 3 Veri modeli](./docs/00-proje-genel-bakis.md#3-veri-modeli-özet-er)
- [§ 4 İş kuralları](./docs/00-proje-genel-bakis.md#4-i̇ş-kuralları) (otomatik tarih hesaplama, yaklaşan/geciken sorguları, plantCode üretimi, silme yerine pasifleştirme)

**Kısaca:** pnpm workspace monorepo'su. `apps/api` NestJS + Prisma + PostgreSQL ile REST API'yi sağlar (JWT auth, rol bazlı yetkilendirme, personel-müşteri atama, QR üretimi, fotoğraf yükleme/silme, dashboard/raporlama endpoint'leri). `apps/web` Nuxt 4 + Pinia ile hem yönetici masaüstü panelini (`admin` layout, mobilde hamburger menüsüyle) hem de saha personelinin mobil/PWA akışını (`field` layout) tek kod tabanından sunar; `@vite-pwa/nuxt` ile telefonun ana ekranına gerçek bir uygulama gibi eklenebilir.

```
Customer 1─N Location 1─N Plant 1─N MaintenanceLog N─1 Staff
    │                                   │        └─N─ Photo
    │                                   ├─N─ MaintenanceLogAction ─N─1 MaintenanceType
    │                                   └─N─ MaintenanceLogProduct ─N─1 Product
    └─────────────── N─N (atama) ───────────────────────────────────┘ Staff
```

## Klasör yapısı

```
bitki-bakim-sistemi/
├── apps/
│   ├── api/                # NestJS backend (@hr/api)
│   │   ├── prisma/         # schema.prisma, migrations/, seed.ts
│   │   └── src/            # auth, customers, locations, plants,
│   │                       # maintenance-types, products, maintenance-logs,
│   │                       # photos, dashboard, staff, storage
│   └── web/                # Nuxt 4 frontend (@hr/web)
│       └── app/
│           ├── layouts/    # admin.vue (yönetici), field.vue (saha/mobil)
│           ├── pages/      # customers, plants, dashboard, staff, field/*
│           ├── stores/     # Pinia (auth)
│           ├── composables/# useApi (backend çağrıları)
│           ├── plugins/    # pwa.client.ts (servis çalışanı kaydı)
│           └── types/      # paylaşılan API tipleri
├── docs/                   # mimari referans + 20 günlük uygulama günlüğü
│   ├── 00-proje-genel-bakis.md
│   ├── production-notlari.md
│   └── gunler/gun-01.md … gun-20.md
├── docker-compose.yml      # yerel PostgreSQL
├── pnpm-workspace.yaml
└── .env.example
```

## Kurulum

Ön koşullar: Node.js (bkz. `.nvmrc`), pnpm 9, Docker (yerel PostgreSQL için).

```bash
# 1. Bağımlılıkları kur
pnpm install

# 2. Yerel PostgreSQL'i ayağa kaldır
docker compose up -d

# 3. Ortam değişkenlerini hazırla
cp .env.example apps/api/.env      # gerekirse değerleri düzenle
echo "NUXT_PUBLIC_API_BASE=http://localhost:3001" > apps/web/.env

# 4. Veritabanı şemasını uygula
pnpm --filter @hr/api exec prisma migrate deploy

# 5. Başlangıç verisini yükle (bakım türleri, ürünler, örnek admin/personel)
pnpm --filter @hr/api exec prisma db seed
```

`.env` dosyalarının hangi değişkenleri içermesi gerektiği için [§ 5](./docs/00-proje-genel-bakis.md#5-ortam-değişkenleri-stratejisi)'e bakın. Hiçbir `.env` dosyası git'e girmez.

## Geliştirme komutları

```bash
pnpm dev:api    # API'yi http://localhost:3001 üzerinde watch modda başlatır
pnpm dev:web    # Web'i http://localhost:3000 üzerinde başlatır
```

İkisini de aynı anda, iki ayrı terminalde çalıştırman gerekir. API çalışmadan web'deki hiçbir sayfa veri gösteremez (bkz. `apps/web/app/error.vue` ve dashboard/field sayfalarındaki "sunucuya bağlanılamadı" mesajları).

Diğer faydalı komutlar:

```bash
pnpm lint              # tüm paketlerde lint
pnpm format            # Prettier ile tüm repo'yu formatla
pnpm build:api          # API prod build
pnpm build:web          # Web prod build
```

## Test komutları

```bash
pnpm test:api           # API unit testleri (Vitest)
pnpm test:api:e2e       # API e2e testleri (gerçek DB bağlantısı gerektirir)
```

Frontend tarafında otomatik test paketi henüz yok — Gün 20'nin tam senaryo testi elle (tarayıcıdan) yapılır; adımlar için `docs/gunler/gun-20.md`'ye bakın.

## Deployment notu

Bu depo şu an tek bir production ortamına dağıtılacak şekilde yapılandırılmadı (herhangi bir PaaS/altyapı seçimi projeye bağlı). Canlıya çıkmadan önce mutlaka [`docs/production-notlari.md`](./docs/production-notlari.md) dosyasını oku — özellikle `JWT_SECRET`'in değiştirilmesi, dosya depolamanın S3/Cloudinary'e taşınması ve veritabanı yedeklemesi ile ilgili maddeler atlanabilir değildir. Kısa özet:

1. `apps/api`'yi bir Node.js barındırma ortamına (Docker imajı veya doğrudan) deploy et; `pnpm --filter @hr/api build` + `node apps/api/dist/main.js`.
2. `apps/web`'i `pnpm --filter @hr/web build` ile üretim build'ine al, `NUXT_PUBLIC_API_BASE`'i gerçek API URL'sine ayarlayarak.
3. Migration'ları `prisma migrate deploy` ile production veritabanına uygula (`prisma migrate dev` **kullanma**).
4. Production ortam değişkenlerini platformun secret yönetiminden set et, `.env` dosyası olarak diske yazma.

## Rehber ve geliştirme günlüğü

Bu sistem sıfırdan, 20 günlük bir rehber izlenerek kuruldu. Her günün hedefi, gerekçesi ve adımları için [`docs/README.md`](./docs/README.md) ve [`docs/gunler/`](./docs/gunler/) klasörüne bakabilirsin — projeye yeni katılan biri için en hızlı "nasıl buraya geldik" özeti orada.
