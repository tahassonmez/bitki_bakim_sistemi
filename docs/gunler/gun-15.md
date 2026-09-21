# Gün 15 — Müşteri ve Konum Ekranları

> 3. Hafta · Fotoğraf, raporlama, frontend temeli

3. haftanın kapanışı: ilk gerçek admin ekranlarını yazıyoruz. Müşteri listesi, müşteri detayı ve konum yönetimi.

---

## 🎯 Bugünün hedefi

1. Müşteri listesi sayfası (arama/filtre).
2. Müşteri oluşturma/düzenleme formu (VeeValidate + Yup şeması).
3. Müşteri detay sayfası: bilgiler + konum listesi (ekle/düzenle) + o müşterideki bitkilerin özet listesi.

---

## 🤔 Neden?

- Kullanıcı isteği: "her müşterinin ayrı bir kaydı olsun, müşterinin adresi, iletişim bilgileri ve o müşteriye ait bütün bitkiler sistemde görülebilsin." Bu ekran tam olarak bu cümleyi karşılıyor — tek sayfada müşteri + konumlar + bitkiler bir arada.
- Formları VeeValidate + Yup ile yazmak, ileride (Gün 16, 17) çok daha karmaşık formlara (çoklu seçim, dosya yükleme) geçerken aynı doğrulama desenini tekrar kullanmanı sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-15-musteri-konum-ekranlari
```

### 1. Müşteri listesi

`apps/web/pages/customers/index.vue` (layout: `admin`):

- Üstte arama kutusu (debounce ile `GET /customers?search=`).
- Tablo/kart listesi: ad, telefon, bitki sayısı (eğer `GET /customers` özet dönmüyorsa Gün 6'daki endpoint'i genişlet).
- "Yeni Müşteri" butonu → `/customers/new`.

### 2. Oluşturma/düzenleme formu

`apps/web/pages/customers/new.vue` ve `apps/web/pages/customers/[id]/edit.vue` — ortak bir `CustomerForm.vue` bileşeni kullan:

```ts
const schema = yup.object({
  name: yup.string().required('Müşteri adı zorunlu'),
  address: yup.string().nullable(),
  phone: yup.string().nullable(),
  email: yup.string().email('Geçerli bir e-posta girin').nullable(),
  notes: yup.string().nullable(),
});
```

`useForm({ validationSchema: schema })` (VeeValidate) ile alanları bağla, submit'te `useApi().request('/customers', { method: 'POST', body })`.

### 3. Müşteri detay sayfası

`apps/web/pages/customers/[id]/index.vue`:

- Üstte müşteri bilgileri (adres, telefon, e-posta, notlar) + "Düzenle" linki.
- Orta bölüm: konum listesi, her konumun yanında "Düzenle" ve "Yeni Konum Ekle" (modal ya da inline form — basit bir modal component'i yeterli).
- Alt bölüm: o müşteriye ait bitkilerin özet listesi (ad, kod, konum, durum) — henüz `Plants` sayfası yok, bu yüzden şimdilik sadece liste, tıklanınca Gün 16'da aktif olacak bir link (`/plants/[id]`) bırak.

### 4. Konum ekle/düzenle

Basit bir modal (`LocationFormModal.vue`): `name` alanı, `customerId` otomatik dolu (mevcut sayfadan), submit'te `POST /locations` ya da `PATCH /locations/:id`.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Yeni bir müşteri oluşturulup listede görünüyor.
- [ ] Müşteri detayında en az 2 konum eklenmiş durumda.
- [ ] Form validasyon hataları (ör. boş ad) kullanıcıya düzgün gösteriliyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

4. ve son hafta başlıyor: [Gün 16 — Bitki ekranları](./gun-16.md) ile sistemin en çok kullanılacak ekranına geçiyoruz.
