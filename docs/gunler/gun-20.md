# Gün 20 — Uçtan Uca Test, Cilalama ve v1.0-mvp

> 4. Hafta · Bitki/bakım ekranları, QR/PWA, yönetici paneli, cilalama

Son gün. Bugün kod yazmaktan çok, yazdığın her şeyin gerçekten bir bütün olarak çalıştığını doğruluyorsun ve projeyi teslim edilebilir hale getiriyorsun.

---

## 🎯 Bugünün hedefi

1. Tam senaryo testi: müşteri → konum → 50 bitki (toplu) → QR → bakım kaydı → yaklaşan/geciken listeleri → yönetici paneli.
2. Boş durum (empty state) ve hata mesajı ekranlarını gözden geçir.
3. Mobil/PWA son responsive kontrolü.
4. `README.md`'yi tamamla (kurulum, ortam değişkenleri, komutlar, mimari özeti).
5. Basit bir production notu (ortam değişkenleri, dosya depolamanın S3'e taşınması gerektiği, yedekleme hatırlatması).
6. Git: son PR, `main`'e merge, `git tag v1.0-mvp`, backlog'u issue'lara döküm.

---

## 🤔 Neden?

- 19 gün boyunca parça parça test ettiğin her modül, bir araya geldiğinde beklenmedik şekilde kırılabilir (ör. bir DTO alan adı değişmiş ama frontend eski adı kullanıyor olabilir) — bu yüzden son gün mutlaka gerçek, uçtan uca bir prova gerektiriyor.
- README'nin eksiksiz olması, 3 ay sonra bu projeye dönüp "nasıl çalıştırıyordum" diye kendine sormamanı sağlıyor — ya da ileride biri projeye katılırsa onun ilk günü bu README ile başlayacak.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-20-e2e-cilalama-release
```

### 1. Tam senaryo testi (elle, tarayıcıdan)

1. Yeni bir müşteri oluştur, 1 konum ekle.
2. O konuma toplu ekleme ile 50 adet aynı türden bitki ekle — her birinin farklı `plantCode`/QR'ı olduğunu birkaç örnekte doğrula.
3. Birkaç bitkiye bakım kaydı gir (farklı işlem/ürün kombinasyonlarıyla).
4. Bir bitkinin `nextMaintenanceDate`'ini Prisma Studio'dan geçmişe çekip "Geciken Bakımlar" listesinde göründüğünü doğrula.
5. Yönetici panelinde tüm sayaçların ve listelerin doğru olduğunu kontrol et.
6. QR kodunu telefonla okutup bakım formunu doldur, fotoğraf ekle — tüm zincirin çalıştığını doğrula.

### 2. Boş durum ve hata ekranları

- Hiç bitkisi olmayan bir müşteri detayında "Henüz bitki eklenmedi" gibi bir mesaj var mı?
- Hiç geciken bakımı olmayan bir sistemde dashboard "Harika, geciken bakım yok!" gibi olumlu bir boş durum gösteriyor mu (kırmızı bir liste yerine boş bir tablo göstermek kötü bir kullanıcı deneyimi).
- API hatası döndüğünde (ör. sunucu kapalı) kullanıcıya anlamlı bir mesaj çıkıyor mu, yoksa sayfa çöküyor mu?

### 3. Mobil/responsive kontrol

Chrome DevTools mobil emülasyonu + gerçek telefonla `field` layout'undaki tüm sayfaları (bugün yapılacaklar, QR tara, bitki detay, bakım formu) küçük ekranda dene. Formdaki checkbox'ların, butonların parmakla rahatça dokunulabilir büyüklükte olduğunu doğrula.

### 4. README'yi tamamla

Kök `README.md`'de şu bölümler eksiksiz olsun: proje amacı, mimari özeti (§ 3, `docs/00-proje-genel-bakis.md`'ye link ver), klasör yapısı, kurulum adımları (`pnpm install`, `docker compose up -d`, `.env` dosyaları, `prisma migrate deploy`, `prisma db seed`), geliştirme komutları (`pnpm dev:api`, `pnpm dev:web`), test komutları, deployment notu.

### 5. Production notu

Kısa bir `docs/production-notlari.md` (ya da README'nin bir bölümü): ortam değişkenlerinin production'da nasıl set edileceği, `StorageService`'in S3/Cloudinary'e taşınması gerektiği (Gün 11'deki soyutlama sayesinde tek dosya), veritabanı yedekleme hatırlatması, `JWT_SECRET`'in production'da mutlaka değiştirilmesi gerektiği uyarısı.

### 6. Release

```bash
git add . && git commit -m "docs: readme, production notlari ve e2e dogrulama"
# kendine PR aç, main'e merge et
git checkout main && git pull
git tag v1.0-mvp
git push origin v1.0-mvp
```

GitHub'da `docs/00-proje-genel-bakis.md`'deki "MVP sonrası büyütme backlog'u" listesindeki her maddeyi ayrı bir Issue olarak aç (stok takibi, saksı/ürün envanteri, bildirimler, personel atama sistemi, raporlama/export, çoklu şube, S3'e taşıma, offline destek).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Tam senaryo (müşteri → 50 bitki → bakım → dashboard → QR) baştan sona hatasız çalışıyor.
- [ ] README, sıfırdan bir geliştiricinin projeyi ayağa kaldırabileceği kadar eksiksiz.
- [ ] `v1.0-mvp` tag'i GitHub'da görünüyor.
- [ ] Büyütme backlog'u GitHub Issues'a dökülmüş durumda.

---

## 🎉 Tebrikler

Müşteri → bitki → bakım planı → bakım işlemi → personel zincirini, geçmiş kaybı olmadan, sıfırdan kurdun. Sistem artık gerçek sahada kullanılabilir durumda; büyütme backlog'undaki maddeler bir sonraki fazın konusu.
