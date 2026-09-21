# Gün 13 — Backend Sağlamlaştırma ve CI

> 3. Hafta · Fotoğraf, raporlama, frontend temeli

Backend'i frontend'e geçmeden önce sağlamlaştırıyoruz: tutarlı hata/response formatı, en az bir e2e test, temiz lint, ve her push'ta otomatik kontrol yapan bir CI hattı.

---

## 🎯 Bugünün hedefi

1. Global `HttpExceptionFilter` ve `TransformInterceptor` (tutarlı API response formatı).
2. En az bir e2e test senaryosu: login → müşteri/konum/bitki oluştur → bakım kaydı ekle → tarih doğru mu kontrol et.
3. ESLint (type-aware) + Prettier backend'de temiz geçsin.
4. GitHub Actions workflow: push/PR'da lint + test + build.

---

## 🤔 Neden?

- Tutarlı bir hata formatı olmadan frontend'de her endpoint için ayrı hata ayrıştırma mantığı yazmak zorunda kalırsın — bugün bunu tek yerde çözmek, Gün 14'ten itibaren frontend'i çok hızlandırır.
- Bir e2e testin olması, "bu değişiklik sistemin en kritik akışını (bakım kaydı → tarih güncelleme) bozdu mu" sorusunu her commit'te otomatik cevaplıyor.
- CI, tek kişilik bir projede bile disiplin sağlıyor: `main`'e giden her şey en azından derleniyor ve testler geçiyor demektir.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-13-saglamlastirma-ci
```

### 1. Global exception filter ve interceptor

`AllExceptionsFilter` (`@Catch()`): yakalanan her hatayı `{ statusCode, message, error, timestamp, path }` formatında dön.

`TransformInterceptor` (`NestInterceptor`): başarılı her response'u `{ data: ..., timestamp }` zarfına sar. `main.ts`'de `app.useGlobalFilters(new AllExceptionsFilter())` ve `app.useGlobalInterceptors(new TransformInterceptor())`.

Global `ValidationPipe` de ekle (whitelist: true, forbidNonWhitelisted: true) — DTO'da olmayan alanları sessizce reddetsin.

### 2. E2e test

`apps/api/test/maintenance-flow.e2e-spec.ts` — Supertest ile:

```ts
it('musteri -> konum -> bitki -> bakim kaydi -> tarih guncelleme akisi', async () => {
  const { body: login } = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@wask.co', password: 'demo1234' })
    .expect(201);
  const token = login.data.accessToken;

  const customer = await request(app.getHttpServer())
    .post('/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'E2E Test Müşterisi' })
    .expect(201);

  // ...konum, bitki, bakim kaydi adimlari benzer sekilde devam eder

  const plantAfter = await request(app.getHttpServer())
    .get(`/plants/${plantId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(plantAfter.body.data.nextMaintenanceDate).toBeDefined();
});
```

> Test veritabanını ayrı tutmak istersen `apps/api/.env.test` ile ayrı bir `DATABASE_URL` (ör. `bitki_test`) kullan ve test öncesi migration'ı ona uygula — ileride CI'da bu ayrım işine yarayacak.

### 3. Lint temizliği

```bash
pnpm --filter @hr/api lint --fix
pnpm --filter @hr/api exec prettier --write .
```

Kalan hataları teker teker düzelt — `any` kullanımı varsa DTO/interface ile değiştir.

### 4. GitHub Actions

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: bitki
          POSTGRES_PASSWORD: bitki_test_password
          POSTGRES_DB: bitki_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @hr/api lint
      - run: pnpm --filter @hr/api exec prisma migrate deploy
        env:
          DATABASE_URL: postgresql://bitki:bitki_test_password@localhost:5432/bitki_test
      - run: pnpm --filter @hr/api test
        env:
          DATABASE_URL: postgresql://bitki:bitki_test_password@localhost:5432/bitki_test
          JWT_SECRET: ci-test-secret
      - run: pnpm --filter @hr/api build
```

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Hatalı bir istek atıldığında tutarlı bir JSON hata formatı dönüyor.
- [ ] E2e test yeşil, uçtan uca akışı doğruluyor.
- [ ] `pnpm --filter @hr/api lint` temiz geçiyor.
- [ ] GitHub Actions'ta CI yeşil (PR açtığında görebiliyorsun).
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 14 — Nuxt frontend iskeleti](./gun-14.md) ile frontend'e geçiyoruz.
