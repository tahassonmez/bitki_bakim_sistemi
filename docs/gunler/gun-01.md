# Gün 1 — Monorepo İskeleti ve Git Kurulumu

> 1. Hafta · Temel altyapı ve veri modeli

Bugün kod yazmıyoruz, projenin "zeminini" döküyoruz: pnpm workspace, ortak lint/format kuralları, Docker ile PostgreSQL ve git deposu. Sıkıcı gelebilir ama bu gün düzgün gitmezse ilerideki 19 gün boyunca dağınıklığı taşırsın.

---

## 🎯 Bugünün hedefi

1. GitHub'da boş bir repo aç, lokalde `git init` yap, ilk commit'i at.
2. pnpm workspace'i kur (`apps/api` ve `apps/web` klasörleri, `@hr/api` / `@hr/web` paket adları).
3. Ortak konfigürasyon dosyalarını oluştur (`.gitignore`, `.editorconfig`, `.nvmrc`, `tsconfig.base.json`).
4. Docker Compose ile PostgreSQL'i ayağa kaldır.
5. Kök `README.md` taslağını yaz ve push et.

---

## 🤔 Neden?

- Monorepo'da ortak `tsconfig`/lint kuralı en baştan olmazsa, ileride iki paket farklı standartlarda büyür ve birleştirmek acı verir.
- Veritabanını Gün 1'de ayağa kaldırmak, "environment kurulumu" diye ayrı bir gün harcamanı engeller — Gün 2'de doğrudan Prisma'ya geçebilirsin.
- `.env.example` şablonunu en baştan netleştirmek, ileride hangi değişkenin nerede durduğunu (§ 5, `00-proje-genel-bakis.md`) unutmanı engeller.

---

## 🛠️ Adımlar

### 0. Node ve pnpm hazırlığı

```bash
corepack enable
corepack prepare pnpm@latest --activate
node -v   # 20.x bekleniyor
```

### 1. Repoyu oluştur

GitHub'da boş bir repo aç (ör. `bitki-bakim-sistemi`, README/gitignore eklemeden — bunları biz oluşturacağız). Sonra lokalde:

```bash
mkdir bitki-bakim-sistemi && cd bitki-bakim-sistemi
git init
echo "20" > .nvmrc
git remote add origin git@github.com:<kullanici-adin>/bitki-bakim-sistemi.git
```

### 2. pnpm workspace

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
```

Kök `package.json`:

```json
{
  "name": "bitki-bakim-sistemi",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "lint": "pnpm -r --if-present lint",
    "format": "prettier --write .",
    "dev:api": "pnpm --filter @hr/api dev",
    "dev:web": "pnpm --filter @hr/web dev"
  }
}
```

```bash
mkdir -p apps/api apps/web
```

> `apps/api` ve `apps/web` içindeki gerçek `package.json` dosyaları Gün 2 ve Gün 14'te Nest CLI / Nuxt CLI ile oluşturulacak. Bugün sadece klasörler var, boş kalabilirler.

### 3. Ortak konfigürasyon dosyaları

`.gitignore` (kök):

```
node_modules/
dist/
.nuxt/
.output/
*.log
.env
.env.*.local
uploads/
```

`.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

`tsconfig.base.json` (her iki paketin `extends` ile miras alacağı ortak ayarlar):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 4. Docker Compose ile PostgreSQL

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: bitki-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: bitki
      POSTGRES_PASSWORD: bitki_dev_password
      POSTGRES_DB: bitki_dev
    ports:
      - "5434:5432"
    volumes:
      - bitki_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bitki"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  bitki_pg_data:
```

> Host portu bilerek `5434` seçildi — makinende başka bir proje `5432`'yi kullanıyor olabilir.

`.env.example` (kök, sadece şablon — gerçek `.env` dosyaları Gün 2 ve Gün 14'te ilgili paketlerin içinde oluşacak, § 5):

```
DATABASE_URL=postgresql://bitki:bitki_dev_password@localhost:5434/bitki_dev?schema=public
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=8h
API_PORT=3001
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

Ayağa kaldır:

```bash
docker compose up -d
docker ps   # bitki-postgres "healthy" görünmeli
```

### 5. README taslağı ve ilk commit

Kök `README.md`'ye kısa bir proje tanımı, klasör yapısı ve "nasıl çalıştırılır" için bir placeholder yaz (dolduracağız). Sonra:

```bash
git add .
git commit -m "chore: pnpm workspace, docker-compose ve ortak konfigurasyon iskeleti"
git branch -M main
git push -u origin main
```

Buradan sonra **doğrudan `main`'e push yok** — Gün 2'den itibaren her gün kendi dalında (§ 6, genel bakış).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] `pnpm -v` ve `node -v` beklenen sürümleri gösteriyor.
- [ ] `docker compose up -d` sonrası `bitki-postgres` "healthy" durumda.
- [ ] `pnpm-workspace.yaml`, kök `package.json`, `.gitignore`, `.editorconfig`, `tsconfig.base.json` repoda.
- [ ] `.env.example` tüm değişkenleri listeliyor.
- [ ] İlk commit GitHub'a push edildi, repo herkese açık/özel olarak GitHub'da görünüyor.

---

## 📚 Sonraki gün

[Gün 2 — NestJS backend iskeleti ve Prisma bağlantısı](./gun-02.md)'nda `apps/api` içine gerçek bir NestJS projesi kuruyoruz ve veritabanına ilk bağlantıyı yapıyoruz.
