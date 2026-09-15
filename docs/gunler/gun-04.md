# Gün 4 — Veri Modeli (2): Bakım, Ürün, Fotoğraf İlişkileri + Seed

> 1. Hafta · Temel altyapı ve veri modeli

Dünkü temel varlıkların üzerine bugün sistemin asıl değerini üreten kısmı ekliyoruz: bakım kayıtları. Bir bakımda birden fazla işlem (sulama + gübreleme gibi) ve birden fazla ürün kullanılabildiği için burada iki tane çoktan-çoğa join tablosu var — bu günün en dikkat gerektiren kısmı bu.

---

## 🎯 Bugünün hedefi

1. `MaintenanceType` (lookup), `Product`, `MaintenanceLog`, `MaintenanceLogAction`, `MaintenanceLogProduct`, `Photo` modellerini ekle.
2. `Plant` ve `Staff` modellerine eksik kalan ters ilişki alanlarını (`maintenanceLogs`) ekle.
3. Migration'ı çalıştır.
4. `seed.ts` yaz: 1 admin + 2 personel, 2 müşteri, her müşteride 2 konum, **bir konuma 50 adet aynı türden bitki**, 7 standart bakım türü, birkaç ürün, birkaç geçmiş bakım kaydı.

---

## 🤔 Neden?

- `MaintenanceLogAction` ve `MaintenanceLogProduct` ayrı join tabloları olarak modellenmesinin sebebi: bir bakım kaydında "sulama + budama" gibi birden fazla işlem, "gübre A + ilaç B" gibi birden fazla ürün seçilebilmesi gerekiyor (kullanıcı isteğinin merkezinde bu var — "sadece bakım yapıldı değil, hangi işlemler yapıldığı ayrı ayrı seçilebilmeli").
- `MaintenanceType`'ın enum değil, tablo olmasının sebebi: admin ileride yeni bir bakım türü eklemek isteyebilir (§ 4.4, genel bakış — silme yok, `isActive` ile pasifleştirme var).
- Seed'de gerçekten **50 ayrı bitki** oluşturmak, "aynı türden çok sayıda bitki tekil takip edilsin" gereksinimini gün 4'te zaten test etmeni sağlıyor — bu varsayımı ileriye taşımıyoruz, en baştan doğruluyoruz.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-04-bakim-modelleri-seed
```

### 1. Yeni modelleri ekle

`schema.prisma`'ya:

```prisma
enum ProductType {
  FERTILIZER
  PESTICIDE
  OTHER
}

model MaintenanceType {
  id       String                  @id @default(cuid())
  name     String                  @unique
  isActive Boolean                 @default(true)
  actions  MaintenanceLogAction[]
}

model Product {
  id            String                   @id @default(cuid())
  name          String
  type          ProductType
  unit          String?
  stockQuantity Float?
  notes         String?
  usages        MaintenanceLogProduct[]
}

model MaintenanceLog {
  id        String                   @id @default(cuid())
  plantId   String
  plant     Plant                    @relation(fields: [plantId], references: [id])
  staffId   String
  staff     Staff                    @relation(fields: [staffId], references: [id])
  date      DateTime                 @default(now())
  notes     String?
  actions   MaintenanceLogAction[]
  products  MaintenanceLogProduct[]
  photos    Photo[]
  createdAt DateTime                 @default(now())

  @@index([plantId])
  @@index([date])
}

model MaintenanceLogAction {
  id     String          @id @default(cuid())
  logId  String
  log    MaintenanceLog  @relation(fields: [logId], references: [id])
  typeId String
  type   MaintenanceType @relation(fields: [typeId], references: [id])

  @@unique([logId, typeId])
}

model MaintenanceLogProduct {
  id           String         @id @default(cuid())
  logId        String
  log          MaintenanceLog @relation(fields: [logId], references: [id])
  productId    String
  product      Product        @relation(fields: [productId], references: [id])
  quantityUsed Float?

  @@unique([logId, productId])
}

model Photo {
  id           String         @id @default(cuid())
  logId        String
  log          MaintenanceLog @relation(fields: [logId], references: [id])
  url          String
  uploadedById String
  createdAt    DateTime       @default(now())
}
```

Şimdi `Plant` ve `Staff` modellerine eksik ters ilişkiyi ekle:

```prisma
model Plant {
  // ...Gün 3'teki alanlar aynı kalıyor
  maintenanceLogs MaintenanceLog[]
}

model Staff {
  // ...Gün 3'teki alanlar aynı kalıyor
  maintenanceLogs MaintenanceLog[]
}
```

### 2. Migration

```bash
cd apps/api
pnpm dlx prisma migrate dev --name maintenance_logs_and_products
cd ../..
```

### 3. Seed script

```bash
pnpm --filter @hr/api add -D ts-node bcryptjs
pnpm --filter @hr/api add -D @types/bcryptjs
```

`apps/api/prisma/seed.ts` — kabaca akış:

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const admin = await prisma.staff.create({
    data: { fullName: 'Admin Kullanıcı', email: 'admin@wask.co', passwordHash, role: 'ADMIN' },
  });
  const staff1 = await prisma.staff.create({
    data: { fullName: 'Ahmet Bakımcı', email: 'ahmet@wask.co', passwordHash, role: 'STAFF' },
  });

  const maintenanceTypeNames = [
    'Sulama', 'Gübreleme', 'Budama', 'İlaçlama',
    'Yaprak Temizliği', 'Toprak Değişimi', 'Saksı Değişimi',
  ];
  const types = await Promise.all(
    maintenanceTypeNames.map((name) => prisma.maintenanceType.create({ data: { name } })),
  );

  const customer = await prisma.customer.create({
    data: { name: 'Örnek AVM', address: 'İstanbul', phone: '0212...' },
  });
  const location = await prisma.location.create({
    data: { name: 'Zemin Kat Lobi', customerId: customer.id },
  });

  // 50 ayrı bitki — TEK satır değil, 50 ayrı kayıt
  const plants = [];
  for (let i = 1; i <= 50; i++) {
    const plant = await prisma.plant.create({
      data: {
        plantCode: `WSK-${String(i).padStart(6, '0')}`,
        name: 'Areka Palmiyesi',
        species: 'Dypsis lutescens',
        locationId: location.id,
        careFrequencyDays: 15,
        registeredAt: new Date(),
      },
    });
    plants.push(plant);
  }

  // birkaç geçmiş bakım kaydı
  await prisma.maintenanceLog.create({
    data: {
      plantId: plants[0].id,
      staffId: staff1.id,
      date: new Date(),
      notes: 'İlk bakım',
      actions: { create: [{ typeId: types[0].id }] }, // Sulama
    },
  });

  console.log({ admin: admin.email, plantCount: plants.length });
}

main().finally(() => prisma.$disconnect());
```

`apps/api/package.json`'a ekle:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Çalıştır:

```bash
pnpm --filter @hr/api exec prisma db seed
```

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Migration hatasız çalıştı.
- [ ] Seed sonrası Prisma Studio'da **50 ayrı `Plant` satırı**, farklı `plantCode`'larla görünüyor.
- [ ] 7 `MaintenanceType` kaydı, 1 `MaintenanceLog` + ona bağlı `MaintenanceLogAction` görünüyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 5 — Auth modülü ve hafta kapanışı](./gun-05.md)'nda JWT ile giriş yapıp korumalı endpoint'lere erişeceğiz — ve haftayı `v0.1` etiketiyle kapatacağız.
