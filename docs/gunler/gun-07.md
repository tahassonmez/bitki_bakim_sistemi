# Gün 7 — Plants Modülü (1): CRUD ve plantCode Üretimi

> 2. Hafta · Backend çekirdek modülleri

Bugün sistemin kalbine giriyoruz. Kullanıcı isteğinin en kritik parçası burada: **aynı türden 50 bitki olsa bile her biri ayrı ayrı takip edilebilmeli.**

---

## 🎯 Bugünün hedefi

1. `PlantsModule`: oluşturma/güncelleme/silme (soft-delete: `status = REMOVED`).
2. `plantCode` otomatik üretimi — çakışmasız, sıralı.
3. **Toplu ekleme** endpoint'i: ortak bilgiler + adet → N ayrı `Plant` satırı, N ayrı kod.
4. Listeleme endpoint'i: müşteri/konum/durum filtreleriyle.

---

## 🤔 Neden?

- Bu gün, kullanıcının en çok vurguladığı gereksinimi karşılıyor: "sistem 50 bitkiyi tek bir ürün gibi değil, 50 ayrı bitki olarak takip etmeli." Toplu ekleme endpoint'i olmazsa personel 50 kaydı tek tek elle girmek zorunda kalır — bu hem yavaş hem hataya açık.
- `plantCode` üretimini transaction içinde yapmamızın sebebi: 50 bitkiyi aynı anda oluştururken iki isteğin aynı sıradaki kodu alma riskini (race condition) ortadan kaldırmak.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-07-plants-crud
```

### 1. Modül iskeleti

```bash
pnpm --filter @hr/api exec nest g module plants
pnpm --filter @hr/api exec nest g controller plants
pnpm --filter @hr/api exec nest g service plants
```

### 2. `plantCode` üretimi

Basit ve sağlam bir yaklaşım: en son oluşturulan `plantCode`'u bul, sayısal kısmını al, +1 yap, `WSK-XXXXXX` formatında sıfırla doldur. Bunu bir transaction içinde, toplu ekleme sırasında **döngü içinde art arda** üret (aynı transaction'da sıralı olduğu için çakışma olmaz):

```ts
async generatePlantCodes(count: number, tx: Prisma.TransactionClient) {
  const last = await tx.plant.findFirst({ orderBy: { plantCode: 'desc' } });
  let nextNumber = last ? parseInt(last.plantCode.split('-')[1], 10) + 1 : 1;
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(`WSK-${String(nextNumber).padStart(6, '0')}`);
    nextNumber++;
  }
  return codes;
}
```

### 3. Tekil oluşturma

`CreatePlantDto`: `name`, `species`, `locationId`, `potInfo?`, `sizeInfo?`, `careFrequencyDays` (zorunlu, gün cinsinden). Servis: `plantCode`'u tek elemanlı `generatePlantCodes` ile üret, `Plant.create`.

### 4. Toplu ekleme

`CreateBulkPlantsDto`: `name`, `species`, `locationId`, `potInfo?`, `sizeInfo?`, `careFrequencyDays`, `quantity` (1-500 arası, `@Min(1)` `@Max(500)`).

`POST /plants/bulk`:

```ts
async createBulk(dto: CreateBulkPlantsDto) {
  return this.prisma.$transaction(async (tx) => {
    const codes = await this.generatePlantCodes(dto.quantity, tx);
    const plants = await Promise.all(
      codes.map((plantCode) =>
        tx.plant.create({
          data: {
            plantCode,
            name: dto.name,
            species: dto.species,
            locationId: dto.locationId,
            potInfo: dto.potInfo,
            sizeInfo: dto.sizeInfo,
            careFrequencyDays: dto.careFrequencyDays,
          },
        }),
      ),
    );
    return plants;
  });
}
```

### 5. Listeleme ve soft-delete

`GET /plants?customerId=&locationId=&status=` — `locationId` üzerinden `customerId` filtrelemek için Prisma `where: { location: { customerId } }` kullan.

`DELETE /plants/:id` yerine `PATCH /plants/:id/status` ile `status: REMOVED` — gerçek silme yok (§ 4.4, genel bakış).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] `POST /plants/bulk` ile `quantity: 50` gönderilince 50 ayrı `Plant` satırı, 50 ayrı `plantCode` oluşuyor.
- [ ] İki ayrı toplu ekleme isteği art arda gönderildiğinde kod çakışması olmuyor.
- [ ] Listeleme müşteri/konum/durum filtreleriyle doğru çalışıyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 8 — Plants modülü (2): QR kod üretimi ve bitki detay](./gun-08.md)'da her bitkiye kendi QR kodunu veriyoruz.
