# Gün 12 — Dashboard/Raporlama Endpoint'leri

> 3. Hafta · Fotoğraf, raporlama, frontend temeli

Bugün "bakım zamanı yaklaşan bitkileri ve bakımı geciken bitkileri ayrıca göstermeli" ve "personel telefonundan o gün yapması gereken bakımları görebilmeli" gereksinimlerini karşılayan sorguları yazıyoruz.

---

## 🎯 Bugünün hedefi

1. `GET /dashboard/upcoming` (yaklaşan bakımlar, gün sayısı parametreli, varsayılan 7).
2. `GET /dashboard/overdue` (gecikmiş bakımlar).
3. `GET /dashboard/summary` (toplam müşteri/bitki/personel sayısı, bugün yapılan bakım sayısı).
4. `GET /staff/:id/today-tasks` (personelin telefonundan açacağı "bugün yapılacaklar" listesi).
5. `GET /customers/:id/summary` (müşteri bazlı özet).

---

## 🤔 Neden?

- Bu sorguların hepsi tek bir alana dayanıyor: `Plant.nextMaintenanceDate` (§ 4.2, genel bakış) — ayrı bir "bildirim" tablosu tutmuyoruz, her şey okuma zamanında hesaplanıyor. Bu, veri tutarsızlığı riskini ortadan kaldırıyor (ör. bir bakım kaydı silinirse ayrı bir tabloyu da güncellemeyi unutma riski yok).
- `today-tasks` endpoint'i şimdilik personel ataması olmadan (henüz atama sistemi yok — bu ileri faz backlog'unda) "tüm gecikmiş + bugünkü" listesini döndürüyor; bunu şimdiden ayrı bir endpoint yapmak, ileride atama sistemi eklendiğinde sadece bu endpoint'in içini değiştirmeni sağlayacak.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-12-dashboard-raporlama
```

### 1. `DashboardModule`

```bash
pnpm --filter @hr/api exec nest g module dashboard
pnpm --filter @hr/api exec nest g controller dashboard
pnpm --filter @hr/api exec nest g service dashboard
```

Yardımcı tarih sınırları:

```ts
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
```

`getUpcoming(days = 7)`:

```ts
const today = startOfToday();
const limit = new Date(today);
limit.setDate(limit.getDate() + days);

return this.prisma.plant.findMany({
  where: { status: 'ACTIVE', nextMaintenanceDate: { gte: today, lte: limit } },
  include: { location: { include: { customer: true } } },
  orderBy: { nextMaintenanceDate: 'asc' },
});
```

`getOverdue()`:

```ts
return this.prisma.plant.findMany({
  where: { status: 'ACTIVE', nextMaintenanceDate: { lt: startOfToday() } },
  include: { location: { include: { customer: true } } },
  orderBy: { nextMaintenanceDate: 'asc' },
});
```

`getSummary()`: `Promise.all` ile `customer.count()`, `plant.count({ where: { status: 'ACTIVE' } })`, `staff.count({ where: { isActive: true } })`, bugün oluşturulan `maintenanceLog.count({ where: { date: { gte: startOfToday() } } })`.

### 2. `today-tasks`

`GET /staff/:id/today-tasks` — v1 mantığı: giriş yapan personelin göreceği liste = tüm **gecikmiş** + **bugüne denk gelen** bitkiler (henüz personel bazlı atama yok, bu nedenle herkes aynı ortak listeyi görüyor — bu bilinçli bir MVP kararı, backlog'a not düş).

### 3. Müşteri özeti

`GET /customers/:id/summary` — o müşteriye bağlı bitki sayısı, yaklaşan sayısı, geciken sayısı (`location: { customerId: id }` üzerinden filtreleme).

### 4. Seed verisiyle doğrula

Prisma Studio'dan birkaç bitkinin `nextMaintenanceDate`'ini elle geçmişe, birkaçını yakın geleceğe çek, endpoint'lerin doğru ayırdığını Swagger'dan kontrol et.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] `upcoming` ve `overdue` listeleri seed verisiyle doğru sonuç veriyor.
- [ ] `summary` doğru sayıları dönüyor.
- [ ] `today-tasks` gecikmiş + bugünkü bitkileri birleştirip dönüyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 13 — Backend sağlamlaştırma ve CI](./gun-13.md)'da hataları düzgünleştirip GitHub Actions kuruyoruz.
