# Gün 10 — MaintenanceLogs Modülü (Çekirdek İş Mantığı)

> 2. Hafta · Backend çekirdek modülleri

2. haftanın kapanış günü ve muhtemelen tüm projenin en kritik günü: bir bakım kaydı oluşturulduğunda birden fazla işlem, birden fazla ürün kaydediliyor ve bitkinin bir sonraki bakım tarihi otomatik hesaplanıyor.

---

## 🎯 Bugünün hedefi

1. `POST /plants/:id/maintenance-logs` — tarih, personel, seçilen bakım türleri (dizi), kullanılan ürünler (dizi + miktar), not.
2. Tek transaction içinde: log + join kayıtları oluştur → `Plant.lastMaintenanceDate` / `nextMaintenanceDate` güncelle.
3. `calculateNextMaintenanceDate` fonksiyonunu saf fonksiyon olarak yaz, Jest ile test et.
4. `GET /plants/:id/maintenance-logs` — geçmişi tarihe göre sıralı döndür.

---

## 🤔 Neden?

- "Bakım işlemleri sadece 'bakım yapıldı' şeklinde kaydedilmemeli" ve "her bitkinin kendi bakım geçmişi olmalı, kim tarafından hangi işlemlerle bakıldığını görebilmeliyiz" gereksinimlerinin ikisi de bu tek endpoint'te birleşiyor.
- `calculateNextMaintenanceDate`'in ayrı, saf bir fonksiyon olması (§ 4.1, genel bakış) — servis içine gömülü bir `if/else` yerine — hem test edilebilirlik hem ileride "bakım erken/geç yapıldıysa farklı hesapla" gibi bir kural eklemek istediğinde tek bir yeri değiştirmen yeterli olacak.
- Her şeyin tek transaction'da olması, yarıda kalan bir hatada (ör. ürün ilişkisi başarısız olursa) bitkinin tarihinin yanlış güncellenmiş ama log'un eksik kalmış olması gibi tutarsız durumları engelliyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-10-maintenance-logs
```

### 1. Saf tarih hesaplama fonksiyonu

`apps/api/src/maintenance-logs/calculate-next-maintenance-date.ts`:

```ts
export function calculateNextMaintenanceDate(logDate: Date, careFrequencyDays: number): Date {
  const next = new Date(logDate);
  next.setDate(next.getDate() + careFrequencyDays);
  return next;
}
```

Jest testi (`calculate-next-maintenance-date.spec.ts`):

```ts
import { calculateNextMaintenanceDate } from './calculate-next-maintenance-date';

describe('calculateNextMaintenanceDate', () => {
  it('15 gün sonrasını doğru hesaplar', () => {
    const result = calculateNextMaintenanceDate(new Date('2026-01-01'), 15);
    expect(result.toISOString().slice(0, 10)).toBe('2026-01-16');
  });

  it('ay sonunu doğru geçiyor', () => {
    const result = calculateNextMaintenanceDate(new Date('2026-01-20'), 15);
    expect(result.toISOString().slice(0, 10)).toBe('2026-02-04');
  });

  it('30 günlük bakım sıklığında yıl geçişini doğru hesaplıyor', () => {
    const result = calculateNextMaintenanceDate(new Date('2025-12-20'), 30);
    expect(result.toISOString().slice(0, 10)).toBe('2026-01-19');
  });
});
```

```bash
pnpm --filter @hr/api test calculate-next-maintenance-date
```

### 2. `MaintenanceLogsModule`

```bash
pnpm --filter @hr/api exec nest g module maintenance-logs
pnpm --filter @hr/api exec nest g controller maintenance-logs
pnpm --filter @hr/api exec nest g service maintenance-logs
```

`CreateMaintenanceLogDto`:

```ts
class CreateMaintenanceLogDto {
  @IsDateString() date: string;
  @IsString() staffId: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) typeIds: string[];
  @IsOptional() @IsArray() products?: { productId: string; quantityUsed?: number }[];
  @IsOptional() @IsString() notes?: string;
}
```

Servis:

```ts
async createLog(plantId: string, dto: CreateMaintenanceLogDto) {
  return this.prisma.$transaction(async (tx) => {
    const plant = await tx.plant.findUniqueOrThrow({ where: { id: plantId } });

    const log = await tx.maintenanceLog.create({
      data: {
        plantId,
        staffId: dto.staffId,
        date: new Date(dto.date),
        notes: dto.notes,
        actions: { create: dto.typeIds.map((typeId) => ({ typeId })) },
        products: dto.products
          ? { create: dto.products.map((p) => ({ productId: p.productId, quantityUsed: p.quantityUsed })) }
          : undefined,
      },
    });

    const nextDate = calculateNextMaintenanceDate(log.date, plant.careFrequencyDays);
    await tx.plant.update({
      where: { id: plantId },
      data: { lastMaintenanceDate: log.date, nextMaintenanceDate: nextDate },
    });

    return log;
  });
}
```

### 3. Geçmiş listesi

`GET /plants/:id/maintenance-logs` — `orderBy: { date: 'desc' }`, `include: { staff, actions: { include: { type } }, products: { include: { product } }, photos }`.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Jest testleri yeşil (`calculateNextMaintenanceDate` en az 3 senaryo).
- [ ] Bir bitkiye 2 bakım türü + 1 ürünle bakım kaydı girildiğinde `nextMaintenanceDate` doğru güncelleniyor.
- [ ] Geçmiş listesi tarihe göre sıralı, tüm ilişkili veriyle dönüyor.
- [ ] Commit + kendine PR + `main`'e merge, `git tag v0.2`.

---

## 📚 Sonraki gün

3. hafta başlıyor: [Gün 11 — Fotoğraf yükleme](./gun-11.md) ile bakım kayıtlarına fotoğraf ekleme özelliğini kuruyoruz.
