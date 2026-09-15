# Gün 6 — Customers ve Locations Modülleri

> 2. Hafta · Backend çekirdek modülleri

Bugünden itibaren gerçek CRUD modüllerini yazmaya başlıyoruz. İlk durak: müşteri kayıtları ve onlara bağlı alanlar/konumlar.

---

## 🎯 Bugünün hedefi

1. `CustomersModule`: tam CRUD (`class-validator` DTO'ları, Swagger dokümantasyonu).
2. `LocationsModule`: bir müşteriye bağlı konum CRUD'u.
3. Müşteri detay response'unu, ileride (Gün 15) frontend'in ihtiyaç duyacağı şekilde (konumlar dahil) genişletilebilir tasarla.

---

## 🤔 Neden?

- "Müşterinin adresi, iletişim bilgileri ve bütün bitkileri sistemde görülebilsin" gereksinimi burada başlıyor — önce müşteri ve konum iskeletini sağlam kurmadan bitki modülüne geçmek, ilişkileri sonradan yamalı hale getirir.
- Konumun ayrı bir kaynak olması ("Lobi", "2. Kat" gibi), ileride bir müşterinin onlarca bitkisi olduğunda "hangi alanda ne var" sorusunu tek sorguyla cevaplamanı sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-06-customers-locations
```

### 1. `CustomersModule`

```bash
pnpm --filter @hr/api exec nest g module customers
pnpm --filter @hr/api exec nest g controller customers
pnpm --filter @hr/api exec nest g service customers
```

`CreateCustomerDto` / `UpdateCustomerDto`: `name` (zorunlu), `address?`, `phone?`, `email?`, `notes?` — `class-validator` (`@IsString()`, `@IsOptional()`, `@IsEmail()`).

Endpoint'ler:

- `POST /customers`
- `GET /customers` (arama parametresi: `?search=` isimde arama)
- `GET /customers/:id` (konumları ve — Gün 7'den sonra — bitki sayısını da içerecek şekilde `include`)
- `PATCH /customers/:id`
- `DELETE /customers/:id` (gerçek silme yerine, ileride bitkisi varsa engelleme mantığı eklenebilir — şimdilik basit silme yeterli, notu backlog'a yaz)

Tüm route'lara `@UseGuards(JwtAuthGuard)` ekle — müşteri verisi sadece giriş yapmış kullanıcılara açık.

### 2. `LocationsModule`

```bash
pnpm --filter @hr/api exec nest g module locations
pnpm --filter @hr/api exec nest g controller locations
pnpm --filter @hr/api exec nest g service locations
```

`CreateLocationDto`: `name` (zorunlu), `customerId` (zorunlu).

Endpoint'ler (düz kaynak, `customerId` query/body ile filtrelenir — iç içe route yerine bunu tercih ediyoruz çünkü ileride "konumu taşı" gibi işlemler daha basit kalır):

- `POST /locations`
- `GET /locations?customerId=...`
- `PATCH /locations/:id`
- `DELETE /locations/:id`

### 3. Müşteri detay response'unu genişlet

`GET /customers/:id` servisinde Prisma `include: { locations: true }` kullan; response DTO'sunu (`CustomerDetailDto`) ileride bitki sayısı gibi alanlar eklenebilecek şekilde ayrı bir tipte tut.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Swagger'dan bir müşteri oluşturulup güncellenip silinebiliyor.
- [ ] Bir müşteriye 2 konum eklenip `GET /customers/:id` içinde görünüyor.
- [ ] Guard'sız istek 401 dönüyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 7 — Plants modülü (1): CRUD ve plantCode üretimi](./gun-07.md)'nda asıl kritik modüle geçiyoruz: bitkiler.
