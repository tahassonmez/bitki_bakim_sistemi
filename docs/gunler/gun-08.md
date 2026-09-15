# Gün 8 — Plants Modülü (2): QR Kod Üretimi ve Bitki Detay

> 2. Hafta · Backend çekirdek modülleri

Bugün her bitkiye kendi QR kodunu veriyoruz ve bitki detay endpoint'ini, frontend'in tek çağrıda ihtiyaç duyacağı her şeyi döndürecek şekilde tamamlıyoruz.

---

## 🎯 Bugünün hedefi

1. `qrcode` paketiyle her bitki için QR üretimi (içerik: bitki detay URL'i).
2. `GET /plants/:id/qrcode` — PNG döndüren endpoint.
3. `GET /plants/:id` — müşteri, konum, saksı/ölçü, son bakım, sıradaki bakım, son N bakım özetini tek response'ta dönen zengin detay endpoint'i.

---

## 🤔 Neden?

- QR içeriğini bir "public" bitki detay URL'i yapmamızın sebebi: Gün 18'de personel telefonundan QR okuttuğunda doğrudan o URL'e gidip bitki bilgisini açabilecek — QR'ın kendisi karmaşık bir veri taşımıyor, sadece bir yönlendirme.
- Detay endpoint'ini tek çağrıda zengin hale getirmek, frontend'in (Gün 16) bitki sayfasını açarken 4-5 ayrı istek atmasını engelliyor — mobilde bu performans farkı hissedilir.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-08-plants-qr-detay
pnpm --filter @hr/api add qrcode
pnpm --filter @hr/api add -D @types/qrcode
```

### 1. QR üretimi

`apps/api/.env`'e frontend'in bitki detay sayfasının temel URL'ini ekle (frontend Gün 14'te kurulacak ama URL şablonunu şimdiden netleştirelim):

```
WEB_APP_BASE_URL=http://localhost:3000
```

`PlantsService.getQrCodeBuffer(plantId: string)`:

```ts
import * as QRCode from 'qrcode';

async getQrCodeBuffer(plantId: string): Promise<Buffer> {
  const plant = await this.prisma.plant.findUniqueOrThrow({ where: { id: plantId } });
  const url = `${process.env.WEB_APP_BASE_URL}/plants/${plant.id}`;
  return QRCode.toBuffer(url, { type: 'png', width: 400, margin: 2 });
}
```

Controller:

```ts
@Get(':id/qrcode')
async getQrCode(@Param('id') id: string, @Res() res: Response) {
  const buffer = await this.plantsService.getQrCodeBuffer(id);
  res.set({ 'Content-Type': 'image/png' });
  res.send(buffer);
}
```

### 2. Bitki detay endpoint'i

`GET /plants/:id` — Prisma `include`:

```ts
this.prisma.plant.findUniqueOrThrow({
  where: { id },
  include: {
    location: { include: { customer: true } },
    maintenanceLogs: {
      orderBy: { date: 'desc' },
      take: 5,
      include: { staff: true, actions: { include: { type: true } }, products: { include: { product: true } } },
    },
  },
});
```

Response DTO'sunda şu alanlar açıkça yer alsın: `plantCode`, `name`, `species`, `customer` (ad, adres), `location` (ad), `potInfo`, `sizeInfo`, `registeredAt`, `careFrequencyDays`, `lastMaintenanceDate`, `nextMaintenanceDate`, `status`, `recentLogs` (son 5 bakım özeti).

### 3. Hızlı test

```bash
curl -o test-qr.png http://localhost:3001/plants/<bir-plant-id>/qrcode
open test-qr.png   # ya da resmi bir görüntüleyiciyle aç
```

QR'ı telefon kamerasıyla (Google Lens ya da benzeri) okutup gerçekten `http://localhost:3000/plants/<id>` adresine yönlendirdiğini kontrol et (frontend henüz yok, 404 alman normal — önemli olan URL'in doğru üretilmesi).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Bir bitkinin QR kodu PNG olarak indirilebiliyor ve doğru URL'i taşıyor.
- [ ] `GET /plants/:id` tek çağrıda müşteri, konum, son 5 bakım kaydı dahil tüm veriyi dönüyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 9 — MaintenanceTypes ve Products modülleri](./gun-09.md)'nda bakım türleri ve ürün lookup'larını tamamlıyoruz.
