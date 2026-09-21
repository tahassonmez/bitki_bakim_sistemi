# Bitki Bakım Takip Sistemi — Sıfırdan Uygulama Rehberi

Bu klasör, peyzaj/bitki bakım takip sistemini **sıfırdan, gün gün** kurman için hazırlandı. Her gün kendi dosyasında (`gunler/gun-01.md`, `gunler/gun-02.md`, ...) — hedefi, "neden böyle yapıyoruz"u ve adım adım komutları/kod parçalarını içeriyor. Dosyaları sen oluşturacaksın; buradaki kod blokları kopyala-yapıştır değil, **anlayarak yazman** için referans.

## Nasıl kullanılır

1. Önce [`00-proje-genel-bakis.md`](./00-proje-genel-bakis.md) dosyasını oku — veri modeli, klasör yapısı ve git kurallarının tamamı orada. Günlük dosyalar buna sık sık referans verecek.
2. Her sabah o günün dosyasını aç, **Bugünün hedefi** bölümünü oku, `feature/gun-XX-...` dalını aç.
3. **Adımlar**'ı sırayla uygula. Bir adımda takılırsan bir önceki günün "Bugünün çıktısı" bölümünü kontrol et — çoğu sorun bir önceki günden taşınan eksik bir adımdan kaynaklanır.
4. Gün sonunda **Bugünün çıktısı (Definition of Done)** listesindeki her maddeyi işaretleyebiliyor musun kontrol et. İşaretleyemiyorsan bir sonraki güne geçme.
5. `main`'e merge et, gerekiyorsa `git tag` at, ertesi güne geç.

## Program

| Hafta | Odak | Günler |
|---|---|---|
| 1 | Temel altyapı ve veri modeli | [Gün 1](./gunler/gun-01.md) – [Gün 5](./gunler/gun-05.md) |
| 2 | Backend çekirdek modülleri | [Gün 6](./gunler/gun-06.md) – [Gün 10](./gunler/gun-10.md) |
| 3 | Fotoğraf, raporlama, frontend temeli | [Gün 11](./gunler/gun-11.md) – [Gün 15](./gunler/gun-15.md) |
| 4 | Bitki/bakım ekranları, QR/PWA, yönetici paneli, cilalama | [Gün 16](./gunler/gun-16.md) – [Gün 20](./gunler/gun-20.md) |

Tüm günlerin tek tek listesi:

- [Gün 1 — Monorepo iskeleti ve Git kurulumu](./gunler/gun-01.md)
- [Gün 2 — NestJS backend iskeleti ve Prisma bağlantısı](./gunler/gun-02.md)
- [Gün 3 — Veri modeli (1): Customer, Location, Plant, Staff](./gunler/gun-03.md)
- [Gün 4 — Veri modeli (2): Bakım, ürün, fotoğraf ilişkileri + seed](./gunler/gun-04.md)
- [Gün 5 — Auth modülü ve hafta kapanışı](./gunler/gun-05.md)
- [Gün 6 — Customers ve Locations modülleri](./gunler/gun-06.md)
- [Gün 7 — Plants modülü (1): CRUD ve plantCode üretimi](./gunler/gun-07.md)
- [Gün 8 — Plants modülü (2): QR kod üretimi ve bitki detay](./gunler/gun-08.md)
- [Gün 9 — MaintenanceTypes ve Products modülleri](./gunler/gun-09.md)
- [Gün 10 — MaintenanceLogs modülü (çekirdek iş mantığı)](./gunler/gun-10.md)
- [Gün 11 — Fotoğraf yükleme](./gunler/gun-11.md)
- [Gün 12 — Dashboard/raporlama endpoint'leri](./gunler/gun-12.md)
- [Gün 13 — Backend sağlamlaştırma ve CI](./gunler/gun-13.md)
- [Gün 14 — Nuxt frontend iskeleti](./gunler/gun-14.md)
- [Gün 15 — Müşteri ve konum ekranları](./gunler/gun-15.md)
- [Gün 16 — Bitki ekranları](./gunler/gun-16.md)
- [Gün 17 — Bakım kaydı formu](./gunler/gun-17.md)
- [Gün 18 — Personel mobil akışı, PWA ve QR okuma](./gunler/gun-18.md)
- [Gün 19 — Yönetici paneli ve personel yönetimi](./gunler/gun-19.md)
- [Gün 20 — Uçtan uca test, cilalama ve v1.0-mvp](./gunler/gun-20.md)

## Git kuralı (her gün geçerli)

- Her gün kendi dalında çalışılır: `feature/gun-XX-kisa-aciklama`.
- Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/) formatında: `feat(plants): plantCode üretimi ve toplu ekleme`.
- Gün sonunda kendine PR aç, diff'i oku, `main`'e merge et.
- Hafta sonlarında (Gün 5/10/15/20) `main` üzerine tag at: `v0.1`, `v0.2`, `v0.3`, `v1.0-mvp`.

İyi çalışmalar — sistemin omurgası (müşteri → bitki → bakım planı → bakım kaydı → personel) ilk 10 günde kuruluyor, geri kalan 10 gün bunun üzerine ekran ve cila.
