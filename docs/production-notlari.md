# Production Notları

Bu doküman, sistemi gerçek (production) bir ortamda çalıştırmadan önce gözden geçirilmesi gereken noktaları özetler. Kod tabanı bugüne kadar geliştirme (development) varsayımlarıyla yazıldı; aşağıdaki maddeler production'a geçmeden **önce** ele alınmalı.

## 1. Ortam değişkenleri

Development'ta `.env` dosyaları diskte, git'e girmeden duruyor. Production'da bu dosyalar diske yazılmaz — barındırma platformunun (Railway, Render, Fly.io, bir VPS üzerinde systemd/Docker, vb.) kendi "environment variables / secrets" ekranından set edilir.

Zorunlu değişkenler (`apps/api/.env.example`'daki şablonla aynı isimler):

| Değişken | Production'da ne olmalı |
|---|---|
| `DATABASE_URL` | Yönetilen bir PostgreSQL örneğinin bağlantı dizesi (ör. Railway/Supabase/RDS) — `localhost` değil |
| `JWT_SECRET` | **Mutlaka değiştirilmeli.** `change-me-in-production` değeriyle asla canlıya çıkma. En az 32 byte'lık rastgele bir değer üret: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | İş ihtiyacına göre kalabilir (`8h`), ama saha personeli için çok kısa süreler gün içinde tekrar login isteyebilir |
| `API_PORT` | Platformun beklediği port (çoğu PaaS bunu kendi `PORT` değişkeniyle enjekte eder — platforma göre kontrol et) |
| `NUXT_PUBLIC_API_BASE` | Frontend build'inin API'ye ulaşacağı **gerçek, HTTPS** URL — build zamanında sabitlenir, yani her ortam için ayrı build gerekir |

**Uyarı:** `JWT_SECRET` değişmeden canlıya çıkarsa, bu değeri bilen herkes geçerli bir token üretip sisteme admin olarak girebilir. Bu, atlanabilir bir adım değil.

## 2. Dosya depolama — S3/Cloudinary'e taşıma

Gün 11'de `StorageService` bilinçli olarak soyutlandı: bakım fotoğrafları şu an `apps/api` içinde yerel diske (`uploads/` klasörü, `express.static` ile servis ediliyor) yazılıyor. Bunun sebepleri:

- Çoğu PaaS'ın (Railway, Render, Heroku tarzı) dosya sistemi **kalıcı değildir** — her deploy'da veya container yeniden başlatıldığında yerel diske yazılan dosyalar silinebilir. Production'da bu, "yüklenen bakım fotoğrafları bir süre sonra kayboluyor" şeklinde sessiz bir veri kaybına yol açar.
- Yatay ölçekleme (birden fazla API instance'ı) yapılırsa, her instance kendi diskini görür — bir instance'a yüklenen fotoğraf diğerinden görünmez.

Yapılması gereken: `StorageService`'in tek dosyasını (bkz. `apps/api/src/storage/`) S3 uyumlu bir SDK (`@aws-sdk/client-s3` veya Cloudinary SDK) kullanacak şekilde değiştirmek — arayüz aynı kaldığı için `PhotosService`/`MaintenanceLogsService` tarafında **hiçbir değişiklik gerekmiyor**. Bu, soyutlamanın tam olarak amaçladığı şey.

Production'a S3/Cloudinary olmadan çıkılacaksa (geçici çözüm), en azından yerel diskin kalıcı bir volume'e (persistent volume/disk) bağlı olduğundan emin ol.

## 3. Veritabanı yedekleme

Şu an hiçbir otomatik yedekleme mekanizması yok. Production'a geçtikten sonra:

- Kullanılan yönetilen PostgreSQL servisinin (RDS, Supabase, Railway, vb.) otomatik günlük yedekleme özelliğini **aç**.
- Yedeklerin gerçekten geri yüklenebilir olduğunu ayda bir test et — "yedek alınıyor" ile "yedekten dönebiliyoruz" farklı şeylerdir.
- Müşteri/bitki/bakım geçmişi verisi bu sistemin tüm değeri — bir veri kaybı, aylarca birikmiş bakım geçmişini geri getirilemez şekilde siler.

## 4. Diğer production kontrolleri

- **CORS**: `apps/api/src/main.ts`'te CORS ayarlarının production frontend domain'ine göre kısıtlandığından emin ol (development'ta muhtemelen daha gevşek).
- **HTTPS**: Hem API hem frontend production'da mutlaka HTTPS üzerinden servis edilmeli — JWT token'lar düz HTTP üzerinden taşınmamalı.
- **Rate limiting**: `POST /auth/login` gibi endpoint'lerde brute-force koruması (ör. `@nestjs/throttler`) şu an yok — MVP sonrası backlog'a eklenmeli.
- **Loglama/izleme**: Şu an sadece konsol logu var. Production'da en azından hata izleme (Sentry benzeri) eklemek, sessiz kalan API hatalarını görünür kılar.
- **Prisma migration'ları**: Production'da `prisma migrate dev` değil, `prisma migrate deploy` kullanılmalı (bkz. kök `README.md` kurulum adımları).

## 5. Kısa özet — canlıya çıkmadan önce checklist

- [ ] `JWT_SECRET` production'a özel, rastgele, güvenli bir değerle değiştirildi
- [ ] `DATABASE_URL` yönetilen bir PostgreSQL'e işaret ediyor
- [ ] Dosya depolama S3/Cloudinary'e taşındı (veya en azından kalıcı bir volume'e bağlandı)
- [ ] Veritabanı otomatik yedekleme açık ve bir kez geri yükleme testi yapıldı
- [ ] CORS, production frontend domain'iyle kısıtlandı
- [ ] API ve frontend HTTPS üzerinden servis ediliyor
- [ ] `prisma migrate deploy` ile migration'lar production DB'sine uygulandı
