# Proje Genel Bakış — Mimari, Veri Modeli, Kurallar

Bu dosya tüm günlerin referans aldığı ortak zemin. Bir günün içinde "§ 3.2'ye bak" gibi bir referans görürsen buradaki numaralı bölümü kastediyor.

## 1. Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Monorepo | pnpm workspace (`apps/api` = `@hr/api`, `apps/web` = `@hr/web`) |
| Backend | NestJS + TypeScript |
| ORM / DB erişimi | Prisma + `@prisma/adapter-pg` (driver adapter) → PostgreSQL |
| Auth | `@nestjs/jwt` + `bcryptjs` |
| Validasyon | `class-validator` / `class-transformer` |
| API dokümantasyonu | `@nestjs/swagger` |
| Test | Jest (unit + e2e) |
| Lint/format | ESLint (type-aware) + Prettier |
| Frontend | Nuxt 4 (Vue 3 + TypeScript) |
| State | Pinia |
| Form | VeeValidate + Yup |
| Stil | Tailwind CSS (`@nuxtjs/tailwindcss`) |
| Excel export (ileri faz) | `exceljs` |

## 2. Klasör yapısı (hedef)

```
bitki-bakim-sistemi/
├── apps/
│   ├── api/                # NestJS (@hr/api)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── auth/
│   │       ├── customers/
│   │       ├── locations/
│   │       ├── plants/
│   │       ├── maintenance-types/
│   │       ├── products/
│   │       ├── maintenance-logs/
│   │       ├── photos/
│   │       ├── dashboard/
│   │       ├── staff/
│   │       └── prisma/prisma.service.ts
│   └── web/                 # Nuxt (@hr/web)
│       ├── layouts/
│       │   ├── admin.vue
│       │   └── field.vue
│       ├── pages/
│       ├── stores/
│       └── composables/
├── docs/                    # bu rehber
├── docker-compose.yml
├── pnpm-workspace.yaml
└── .env.example
```

## 3. Veri modeli (özet ER)

```
Customer 1─N Location 1─N Plant 1─N MaintenanceLog N─1 Staff
                                        │        │
                                        │        └─N─ Photo
                                        ├─N─ MaintenanceLogAction ─N─1 MaintenanceType
                                        └─N─ MaintenanceLogProduct ─N─1 Product
```

**Kritik nokta:** `Plant` tekil kayıttır — aynı müşteride aynı türden 50 bitki varsa 50 ayrı `Plant` satırı, 50 ayrı `plantCode`, 50 ayrı bakım geçmişi olur. Hiçbir zaman "adet" alanı olan tek bir ürün satırına indirgenmez (§ 4.4, Gün 3 ve Gün 7).

### 3.1 Alan listesi (Gün 3-4'te bu şekilde Prisma'ya dökülecek)

- **Customer**: `id`, `name`, `address`, `phone`, `email`, `notes`, `createdAt`, `updatedAt`
- **Location**: `id`, `name`, `customerId`
- **Staff**: `id`, `fullName`, `email` (unique), `phone`, `passwordHash`, `role` (`ADMIN`/`STAFF`), `isActive`
- **Plant**: `id`, `plantCode` (unique), `name`, `species`, `locationId`, `potInfo`, `sizeInfo`, `registeredAt`, `careFrequencyDays`, `lastMaintenanceDate`, `nextMaintenanceDate`, `status` (`ACTIVE`/`REMOVED`)
- **MaintenanceType**: `id`, `name` (unique), `isActive` — sulama, gübreleme, budama, ilaçlama, yaprak temizliği, toprak değişimi, saksı değişimi (seed ile gelir, admin yenisini ekleyebilir)
- **Product**: `id`, `name`, `type` (`FERTILIZER`/`PESTICIDE`/`OTHER`), `unit`, `stockQuantity` (ileri faz için şimdiden var), `notes`
- **MaintenanceLog**: `id`, `plantId`, `staffId`, `date`, `notes`
- **MaintenanceLogAction** (join): `logId`, `typeId`
- **MaintenanceLogProduct** (join): `logId`, `productId`, `quantityUsed`
- **Photo**: `id`, `logId`, `url`, `uploadedById`

## 4. İş kuralları

### 4.1 Otomatik tarih hesaplama

Bir `MaintenanceLog` oluşturulunca (tek transaction içinde):

```
plant.lastMaintenanceDate = log.date
plant.nextMaintenanceDate = log.date + plant.careFrequencyDays gün
```

Bu hesaplama saf bir fonksiyon olarak yazılır (`calculateNextMaintenanceDate(date, frequencyDays)`), servis içinde çağrılır, DB trigger'ı **kullanılmaz** — çünkü Jest ile test edilebilir olması ve ileride istisna eklenebilmesi gerekiyor (Gün 10).

### 4.2 Yaklaşan / geciken bakım

Ayrı bir tablo yok. Sorgu zamanında hesaplanır:

- **Geciken**: `nextMaintenanceDate < bugün`
- **Yaklaşan**: `bugün <= nextMaintenanceDate <= bugün + X gün` (X varsayılan 7, parametrik)

### 4.3 plantCode üretimi ve toplu ekleme

50 bitkiyi tek seferde eklerken her birinin **benzersiz** `plantCode` alması gerekir. Uygulama seviyesinde sıralı sayaç kullanılacaksa toplu ekleme bir transaction içinde yapılmalı ki yarışma durumu (race condition) kod çakışmasına yol açmasın (Gün 7).

### 4.4 Silme yerine durum değişikliği

`Plant`, `Staff`, `MaintenanceType` hiçbir zaman veritabanından fiziksel olarak silinmez — geçmiş bakım kayıtları referans bütünlüğünü kaybetmesin diye `status`/`isActive` alanıyla pasifleştirilir.

## 5. Ortam değişkenleri stratejisi

- Kök `.env.example`: tüm değişkenlerin şablonu (referans amaçlı, gerçek `.env` değil).
- `apps/api/.env`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `API_PORT` — Prisma ve NestJS `ConfigModule` bunu okur.
- `apps/web/.env`: `NUXT_PUBLIC_API_BASE` — frontend'in backend'e nasıl ulaşacağı.
- Hiçbir `.env` dosyası git'e girmez (`.gitignore`'da).
- Production'a özel notlar (S3, JWT_SECRET, yedekleme) için bkz. [`docs/production-notlari.md`](./production-notlari.md).

## 6. Git iş akışı

- `main` her zaman çalışır durumda.
- Her gün: `git checkout -b feature/gun-XX-kisa-aciklama`.
- Commit mesajı formatı: [Conventional Commits](https://www.conventionalcommits.org/) — `feat(...)`, `fix(...)`, `chore(...)`, `docs(...)`, `test(...)`.
- Gün sonunda kendine PR aç → diff'i oku → `main`'e merge et.
- Hafta kapanışlarında (Gün 5/10/15/20) `git tag vX.Y` at.
- GitHub Projects board: **Backlog / Bugün / Devam Ediyor / Bitti** dört sütunu, her günün görevleri o günün kartı.

## 7. "Bitti tanımı" felsefesi

Her günün sonunda somut, test edilebilir bir çıktı olacak (bir endpoint çalışıyor, bir ekran açılıyor, bir test yeşil). Çıktıyı doğrulamadan bir sonraki güne geçme — borç biriktirmek, ileride bütün günleri geciktirir.

## 8. MVP sonrası büyütme backlog'u

v1.0-mvp kapsam dışı bırakılan, bir sonraki fazın konusu olan maddeler. Her biri Gün 20'de ayrı bir GitHub Issue olarak açılır.

1. **Stok takibi** — `Product.stockQuantity` alanı şemada hazır durumda ama kullanım sonrası otomatik düşme, minimum stok uyarısı ve stok giriş ekranı yok.
2. **Saksı/ürün envanteri** — saksı ve bakım ürünlerinin kendi başına envanter kalemleri olarak (miktar, birim maliyet, tedarikçi) takip edilmesi.
3. **Bildirimler** — yaklaşan/geciken bakımlar için e-posta veya push bildirimi (şu an sadece dashboard'da pasif olarak görünüyor, kimseye proaktif haber verilmiyor).
4. **Personel atama sistemi** — bakım görevlerinin belirli bir personele önceden atanması; şu an herhangi bir personel herhangi bir bitkinin bakımını girebiliyor.
5. **Raporlama / export** — müşteri bazlı, tarih aralıklı PDF/Excel raporu (§ 1'de `exceljs` bağımlılığı ileri faz için önceden not edilmişti).
6. **Çoklu şube desteği** — birden fazla ekip/şubenin aynı sistemde ayrı ayrı çalışabilmesi (yetkilendirme ve veri izolasyonu gerektirir).
7. **Dosya depolamanın S3'e taşınması** — `StorageService` soyutlaması bunun için hazır (§ production-notlari.md), ama üretimde hâlâ yerel diske yazıyor.
8. **Offline destek** — PWA şu an sadece "add to home screen" ve statik varlık cache'i sağlıyor; saha ekibinin internetsiz bakım kaydı girip senkron edebilmesi ayrı bir iş.
