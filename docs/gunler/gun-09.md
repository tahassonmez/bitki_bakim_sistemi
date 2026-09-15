# Gün 9 — MaintenanceTypes ve Products Modülleri

> 2. Hafta · Backend çekirdek modülleri

Bugün küçük ama önemli iki lookup modülünü tamamlıyoruz: bakım işlem türleri ve kullanılan ürünler (gübre/ilaç). Bunlar yarın yazacağımız `MaintenanceLogs` modülünün dropdown/checkbox verisini besleyecek.

---

## 🎯 Bugünün hedefi

1. `MaintenanceTypesModule`: 7 standart türle seed edilmiş, admin yeni tür ekleyip pasifleştirebiliyor.
2. `ProductsModule`: gübre/ilaç/diğer CRUD.
3. Her iki modül için basit liste endpoint'leri (frontend'de dropdown/checkbox olarak kullanılacak).

---

## 🤔 Neden?

- Kullanıcı isteği açık: "sulama, gübreleme, budama, ilaçlama, yaprak temizliği, toprak değişimi, saksı değişimi gibi işlemler ayrı ayrı seçilebilmeli" — bunun çalışması için önce bu türlerin CRUD'a sahip, admin tarafından genişletilebilir bir kaynak olması gerekiyor.
- `Product.stockQuantity` alanını şimdiden şemada tutmamızın sebebi (§ ileri faz backlog): stok takibi bu MVP'nin kapsamında değil ama alan olmadan sonradan eklemek migration + veri taşıma gerektirir; alan varsa sadece kullanmaya başlarız.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-09-maintenance-types-products
```

### 1. `MaintenanceTypesModule`

```bash
pnpm --filter @hr/api exec nest g module maintenance-types
pnpm --filter @hr/api exec nest g controller maintenance-types
pnpm --filter @hr/api exec nest g service maintenance-types
```

Endpoint'ler:

- `GET /maintenance-types?activeOnly=true` (varsayılan `true` — frontend dropdown'ı sadece aktif türleri görsün)
- `POST /maintenance-types` (admin-only, `RolesGuard`)
- `PATCH /maintenance-types/:id` (isim düzeltme)
- `PATCH /maintenance-types/:id/deactivate` (silme yok, pasifleştirme — § 4.4)

### 2. `ProductsModule`

```bash
pnpm --filter @hr/api exec nest g module products
pnpm --filter @hr/api exec nest g controller products
pnpm --filter @hr/api exec nest g service products
```

`CreateProductDto`: `name`, `type` (`FERTILIZER`/`PESTICIDE`/`OTHER`), `unit?` (ör. "litre", "gram"), `stockQuantity?`, `notes?`.

Endpoint'ler: standart CRUD + `GET /products?type=FERTILIZER` filtreleme.

### 3. Admin panelinden test

Swagger'dan admin token'ıyla:

1. Yeni bir bakım türü ekle (ör. "Destek Çubuğu Takma") — pasifleştirmeden önce listelenmesini doğrula.
2. Pasifleştir, `activeOnly=true` ile listeden düştüğünü ama `activeOnly=false` ile hâlâ görünebildiğini doğrula (geçmiş kayıtlar bozulmasın).
3. Bir gübre, bir ilaç ürünü ekle.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Seed'deki 7 bakım türü `GET /maintenance-types` ile listeleniyor.
- [ ] Admin yeni tür ekleyip pasifleştirebiliyor; STAFF rolü bunu yapamıyor (403).
- [ ] En az 2 ürün (gübre + ilaç) oluşturulup filtrelenebiliyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 10 — MaintenanceLogs modülü (çekirdek iş mantığı)](./gun-10.md) — haftanın en önemli günü: bakım kaydı oluşturma ve otomatik tarih hesaplama.
