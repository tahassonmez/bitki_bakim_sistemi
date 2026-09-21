# Gün 3 — Veri Modeli (1): Customer, Location, Plant, Staff

> 1. Hafta · Temel altyapı ve veri modeli

Bugün sistemin belkemiğini kuruyoruz. Veri modelin yanlış tasarlanırsa üzerine yazdığın her şey yanlış olur — bu yüzden bugünü ağırdan al, aceleye getirme.

---

## 🎯 Bugünün hedefi

1. `schema.prisma`'da `Customer`, `Location`, `Staff`, `Plant` modellerini ve `Role`/`PlantStatus` enum'larını tanımla (§ 3.1, `00-proje-genel-bakis.md`).
2. İlişkileri kur: `Customer 1─N Location 1─N Plant`.
3. `Plant.plantCode` alanına `@unique` koy.
4. İlk migration'ı çalıştır.
5. Basit bir ER diyagramıyla "aynı müşteride 50 aynı tür bitki" senaryosunu kendi kendine doğrula.

---

## 🤔 Neden?

- `Plant`'in `Location`'a, `Location`'ın `Customer`'a bağlanması (bitkinin doğrudan müşteriye değil, önce alana bağlanması) "bu müşterinin hangi alanında hangi bitkiler var" sorusunu doğal olarak cevaplıyor — ileride raporlama bunun üzerine kolayca kurulacak.
- `plantCode`'un `@unique` olması, Gün 7'de yazacağın kod üretim mantığının veritabanı seviyesinde de garanti altına alınmasını sağlıyor — uygulama kodunda bir hata olsa bile iki bitki aynı kodu alamaz.
- Enum'ları (`Role`, `PlantStatus`) şimdiden tanımlamak, ileride "personel" ve "bitki durumu" kavramlarının string yerine tip-güvenli olmasını sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-03-veri-modeli-1
docker compose up -d   # postgres ayakta değilse
```

### 1. `schema.prisma`'ya modelleri ekle

`apps/api/prisma/schema.prisma` içine (generator/datasource bloklarının altına):

```prisma
enum Role {
  ADMIN
  STAFF
}

enum PlantStatus {
  ACTIVE
  REMOVED
}

model Customer {
  id        String     @id @default(cuid())
  name      String
  address   String?
  phone     String?
  email     String?
  notes     String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  locations Location[]
}

model Location {
  id         String   @id @default(cuid())
  name       String
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  plants     Plant[]
  createdAt  DateTime @default(now())

  @@index([customerId])
}

model Staff {
  id           String   @id @default(cuid())
  fullName     String
  email        String   @unique
  phone        String?
  passwordHash String
  role         Role     @default(STAFF)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
}

model Plant {
  id                  String      @id @default(cuid())
  plantCode           String      @unique
  name                String
  species             String
  locationId          String
  location            Location    @relation(fields: [locationId], references: [id])
  potInfo             String?
  sizeInfo            String?
  registeredAt        DateTime    @default(now())
  careFrequencyDays    Int
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?
  status              PlantStatus @default(ACTIVE)
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@index([locationId])
  @@index([nextMaintenanceDate])
}
```

> `MaintenanceLog` ve ilişkili tablolar henüz yok — `Plant` modelindeki `maintenanceLogs MaintenanceLog[]` alanını **Gün 4**'te ekleyeceğiz. Bugün şema derlenirken bu alan olmadığı için hata almazsın, `Staff.maintenanceLogs` da aynı şekilde Gün 4'te gelecek.

### 2. İlk migration

```bash
cd apps/api
pnpm dlx prisma migrate dev --name init_core_entities
cd ../..
```

### 3. Doğrula

```bash
pnpm --filter @hr/api dlx prisma studio
```

Prisma Studio'da 4 tabloyu (`Customer`, `Location`, `Staff`, `Plant`) görmelisin. Elle bir müşteri, bir konum, iki-üç bitki ekleyip ilişkilerin doğru kurulduğunu (bitkinin konuma, konumun müşteriye bağlandığını) kontrol et.

### 4. Zihinsel test: 50 bitki senaryosu

Prisma Studio'da aynı `locationId`'ye sahip, aynı `name`/`species` değerine sahip ama **farklı `plantCode`'lara** sahip 3-4 satır ekleyerek senaryoyu simüle et. Her satırın kendi `id`'si olduğunu, birini silmenin (durumunu değiştirmenin) diğerlerini etkilemediğini gözlemle. Bu, Gün 7'deki toplu ekleme özelliğinin temelini oluşturuyor.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Migration hatasız çalıştı, `prisma/migrations/` altında yeni bir klasör var.
- [ ] Prisma Studio'da 4 tablo görünüyor ve ilişkiler doğru.
- [ ] Aynı müşteri/konumda birden fazla, farklı kodlu bitki elle eklenip doğrulandı.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 4 — Veri modeli (2): Bakım, ürün, fotoğraf ilişkileri + seed](./gun-04.md)'da bakım kayıtlarını ve ilişkili tabloları ekliyoruz.
