# Gün 19 — Yönetici Paneli ve Personel Yönetimi

> 4. Hafta · Bitki/bakım ekranları, QR/PWA, yönetici paneli, cilalama

Kullanıcı isteğinin yönetici tarafını bugün kapatıyoruz: "bütün müşterileri, bitkileri, personelleri, yapılan bakımları, yaklaşan ve geciken bakımları tek bir ekrandan takip edebilmek."

---

## 🎯 Bugünün hedefi

1. Admin dashboard sayfası: sayaç kartları, yaklaşan/geciken bakım listeleri, son yapılan bakımlar akışı.
2. Her listeden ilgili müşteri/bitki detayına tek tıkla gidiş.
3. Personel yönetimi sayfası (admin-only): listele, ekle, pasifleştir.

---

## 🤔 Neden?

- "Tek bir ekrandan takip edebilmek" ifadesi net bir gereksinim — bu yüzden dashboard'u ayrı ayrı sayfalara dağıtmak yerine tek sayfada, yatay bölümler halinde tasarlıyoruz.
- Personelin pasifleştirilmesi (silinmemesi), geçmiş bakım kayıtlarının "kim yaptı" bilgisini kaybetmemesi için § 4.4'teki kuralın frontend karşılığı.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-19-yonetici-paneli
```

### 1. Dashboard sayfası

`apps/web/pages/dashboard/index.vue` (layout: `admin`, `ADMIN` rolü zorunlu — route middleware'de kontrol et):

- Üstte 4 sayaç kartı: toplam müşteri, toplam aktif bitki, toplam aktif personel, bugün yapılan bakım sayısı (`GET /dashboard/summary`).
- Orta bölüm, iki sütun: sol "Yaklaşan Bakımlar" (`GET /dashboard/upcoming`), sağ "Geciken Bakımlar" (`GET /dashboard/overdue`, kırmızı/turuncu vurgulu satırlar).
- Alt bölüm: "Son Yapılan Bakımlar" akışı — en son 10-15 `MaintenanceLog` kaydı (yeni bir `GET /dashboard/recent-logs` endpoint'i gerekebilir, backend'e küçük bir ek yap; kim, ne zaman, hangi bitki, hangi işlemler).
- Her satır tıklanabilir → ilgili bitki/müşteri detayına gider.

### 2. Backend'e küçük bir ek (gerekirse)

`GET /dashboard/recent-logs?limit=15` — `MaintenanceLog.findMany({ orderBy: { date: 'desc' }, take: limit, include: { plant: true, staff: true, actions: { include: { type: true } } } })`.

### 3. Personel yönetimi

`apps/web/pages/staff/index.vue` (admin-only):

- Liste: ad, e-posta, rol, aktif/pasif durumu.
- "Yeni Personel Ekle" formu (Gün 5'teki `POST /staff` endpoint'ini kullanır).
- "Pasifleştir" butonu (`PATCH /staff/:id` ile `isActive: false` — bu endpoint'i backend'de henüz yazmadıysan burada ekle).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Dashboard tek sayfada tüm özet verileri gösteriyor, listelerden detay sayfalarına gidilebiliyor.
- [ ] Yeni bir personel eklenip pasifleştirilebiliyor.
- [ ] STAFF rolündeki bir kullanıcı dashboard/personel sayfalarına erişemiyor (middleware + backend guard ikisi de çalışıyor).
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 20 — Uçtan uca test, cilalama ve v1.0-mvp](./gun-20.md) ile programı kapatıyoruz.
