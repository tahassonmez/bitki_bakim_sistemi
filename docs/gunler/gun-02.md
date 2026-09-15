# Gün 2 — NestJS Backend İskeleti ve Prisma Bağlantısı

> 1. Hafta · Temel altyapı ve veri modeli

Bugün `apps/api` içine gerçek bir NestJS projesi kuruyoruz, Swagger'ı ve Prisma'yı (driver adapter ile) bağlıyoruz. Gün sonunda veritabanına gerçekten bağlanan bir `/health` endpoint'in olacak.

---

## 🎯 Bugünün hedefi

1. `apps/api` içinde NestJS projesini oluştur, paket adını `@hr/api` yap.
2. `@nestjs/config` ile `.env` okuma ve `@nestjs/swagger` kurulumunu tamamla.
3. Prisma'yı `@prisma/adapter-pg` driver adapter'ıyla kur ve bağla.
4. `PrismaService`'i global modül olarak ekle.
5. `/health` endpoint'i ile gerçek bir DB sorgusu çalıştır.

---

## 🤔 Neden?

- `@prisma/adapter-pg` kullanmamızın sebebi: Prisma'nın yeni driver adapter mimarisi connection pooling'i senin kontrolünde (`pg.Pool`) tutuyor — ileride serverless/edge ortamlara taşınma ya da bağlantı havuzunu özelleştirme ihtiyacı çıkarsa hazır oluyorsun.
- `/health` endpoint'i küçük görünse de "backend ayakta mı, DB'ye gerçekten bağlanabiliyor mu" sorusunu tek komutla cevaplıyor — CI'da (Gün 13) ve production'da işine yarayacak.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-02-nest-prisma-iskeleti
```

### 1. NestJS projesini oluştur

```bash
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm --skip-git --skip-install
```

`apps/api/package.json` içindeki `"name"` alanını `"@hr/api"` olarak değiştir. Sonra kökten kur:

```bash
pnpm install
```

### 2. Config ve Swagger

```bash
pnpm --filter @hr/api add @nestjs/config @nestjs/swagger
```

`apps/api/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Bitki Bakım Sistemi API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.API_PORT ?? 3001);
}
bootstrap();
```

`app.module.ts` içine `ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true })` ekle.

### 3. `apps/api/.env`

```
DATABASE_URL=postgresql://bitki:bitki_dev_password@localhost:5434/bitki_dev?schema=public
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=8h
API_PORT=3001
```

### 4. Prisma + driver adapter kurulumu

```bash
pnpm --filter @hr/api add -D prisma
pnpm --filter @hr/api add @prisma/client @prisma/adapter-pg pg
cd apps/api
pnpm dlx prisma init --datasource-provider postgresql
cd ../..
```

`apps/api/prisma/schema.prisma` başlığını driver adapter'a göre ayarla:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Prisma'nın kendi oluşturduğu `apps/api/.env` dosyasını sil/üzerine yaz — bir önceki adımdaki içerikle aynı `DATABASE_URL`'i kullansın.

### 5. `PrismaService`

`apps/api/src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`apps/api/src/prisma/prisma.module.ts` — `@Global()` işaretli, `PrismaService`'i export eden basit bir modül. `AppModule`'e ekle.

### 6. `/health` endpoint'i

`apps/api/src/health/health.controller.ts` — `PrismaService`'i inject et, basit bir `SELECT 1` (`this.prisma.$queryRaw`) çalıştırıp `{ status: 'ok', db: 'connected' }` döndür.

```bash
pnpm --filter @hr/api start:dev
```

Tarayıcıda `http://localhost:3001/api/docs` (Swagger) ve `http://localhost:3001/health` kontrol et.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] `pnpm --filter @hr/api start:dev` hatasız ayağa kalkıyor.
- [ ] `http://localhost:3001/api/docs` Swagger arayüzünü gösteriyor.
- [ ] `/health` endpoint'i gerçek bir DB sorgusuyla `ok` dönüyor.
- [ ] `apps/api/.env` git'e girmiyor (`.gitignore` çalışıyor).
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 3 — Veri modeli (1): Customer, Location, Plant, Staff](./gun-03.md)'ta gerçek Prisma şemasını yazmaya başlıyoruz.
