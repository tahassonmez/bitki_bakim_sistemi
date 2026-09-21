# Gün 16 — Bitki Ekranları

> 4. Hafta · Bitki/bakım ekranları, QR/PWA, yönetici paneli, cilalama

Son hafta başlıyor. Bugün sistemin en çok kullanılacak ekranını yazıyoruz: bitki listesi, oluşturma (tekil + toplu), ve bitki detay sayfası.

---

## 🎯 Bugünün hedefi

1. Bitki listesi: müşteri/konum/durum/bakım durumu (yaklaşan/geciken/normal) filtreleriyle, `plantCode` görünür.
2. Bitki oluşturma formu + **toplu ekleme** formu (Gün 7'deki `/plants/bulk` endpoint'ini kullanan, "adet" giren basit arayüz).
3. Bitki detay sayfası: bilgiler, QR kod görüntüleme/indirme, bakım geçmişi zaman çizelgesi, fotoğraf galerisi.

---

## 🤔 Neden?

- Toplu ekleme formunun ayrı ve belirgin olması önemli — kullanıcı isteğinde "aynı bitkiden 50 tane olsa bile ayrı ayrı takip edilebilsin" vurgusu var; personelin bunu her seferinde tek tek girmeye çalışıp sistemi yanlış kullanmasını engellemek için bu yol en baştan görünür olmalı.
- Bitki detay sayfasının tek noktada her şeyi göstermesi (QR + geçmiş + fotoğraflar), Gün 18'de QR okutulduğunda açılacak sayfanın zaten hazır olmasını sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-16-bitki-ekranlari
```

### 1. Bitki listesi

`apps/web/pages/plants/index.vue`:

- Filtre çubuğu: müşteri seçici, konum seçici (müşteriye bağlı olarak dinamik dolan), durum (`ACTIVE`/`REMOVED`), bakım durumu (hepsi/yaklaşan/geciken — bu son filtre frontend'de `nextMaintenanceDate` üzerinden hesaplanabilir ya da Gün 12'deki `/dashboard/upcoming`+`/overdue` endpoint'leriyle birleştirilebilir).
- Liste satırlarında: `plantCode`, ad/tür, müşteri, konum, sıradaki bakım tarihi (geciken satırlar kırmızı vurgulu).

### 2. Oluşturma formları

`apps/web/pages/plants/new.vue` — iki sekme/mod:

- **Tekil ekleme**: `name`, `species`, `locationId` (müşteri seçilince dolan bir konum dropdown'ı), `potInfo`, `sizeInfo`, `careFrequencyDays`.
- **Toplu ekleme**: aynı alanlar + `quantity` (sayı girişi, 1-500). Submit'te `POST /plants/bulk`, başarı mesajında "N adet bitki, N ayrı kodla oluşturuldu" gibi açık bir geri bildirim ver.

### 3. Bitki detay sayfası

`apps/web/pages/plants/[id].vue`:

- Üst blok: ad, tür, `plantCode`, müşteri/konum, saksı/ölçü bilgisi, sisteme giriş tarihi, bakım sıklığı, son bakım / sıradaki bakım tarihleri.
- QR bölümü: `<img :src="qrCodeUrl">` (`GET /plants/:id/qrcode` doğrudan `<img src>` olarak kullanılabilir), altında "İndir" ve "Yazdır" butonları (`window.print()` ile basit bir yazdırma yeterli).
- Bakım geçmişi: zaman çizelgesi görünümü — her satırda tarih, personel adı, yapılan işlemler (etiket/badge olarak), kullanılan ürünler, not.
- Fotoğraf galerisi: bakım kayıtlarına eklenmiş tüm fotoğrafların küçük resimlerle grid görünümü (tıklayınca büyütme).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Toplu ekleme formuyla 50 adet bitki gerçekten UI üzerinden oluşturulabiliyor.
- [ ] Bitki listesi filtrelerle doğru sonuç veriyor.
- [ ] Bitki detay sayfasında QR görüntülenip indirilebiliyor, geçmiş doğru sırayla görünüyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 17 — Bakım kaydı formu](./gun-17.md) ile personelin asıl kullanacağı formu yazıyoruz.
