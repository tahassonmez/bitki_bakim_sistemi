# Gün 5 — Auth Modülü ve Hafta Kapanışı

> 1. Hafta · Temel altyapı ve veri modeli

Haftanın son günü: JWT tabanlı giriş, rol bazlı yetkilendirme (admin/personel) ve haftayı `v0.1` etiketiyle kapatmak.

---

## 🎯 Bugünün hedefi

1. `AuthModule`: `bcryptjs` ile şifre karşılaştırma, `POST /auth/login` → JWT üretimi.
2. `JwtAuthGuard` ve `RolesGuard` (`@Roles('ADMIN')` decorator'ı).
3. Sadece admin yeni personel oluşturabilsin (`POST /staff`, guard'lı).
4. Login akışını Swagger üzerinden uçtan uca test et.
5. Haftayı kapat: `main`'e merge, `git tag v0.1`.

---

## 🤔 Neden?

- Personel kaydının **public olmaması** (sadece admin ekleyebilmesi) bilinçli bir tasarım kararı: sahada çalışan bir ekip uygulamasında kendi kendine kayıt olma riski yok, hesaplar admin tarafından açılıyor.
- `RolesGuard`'ı bugün kurmak, ilerideki her modülde (Gün 9'da yeni bakım türü ekleme, Gün 19'da personel yönetimi gibi) "bunu sadece admin mi yapabilir" sorusunu tek bir yerden çözmeni sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-05-auth
```

### 1. Paketler

```bash
pnpm --filter @hr/api add @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer
pnpm --filter @hr/api add -D @types/passport-jwt
```

### 2. `AuthModule`

- `AuthService.validateStaff(email, password)` → `bcrypt.compare` ile şifre kontrolü, `PrismaService` ile `staff` sorgusu.
- `AuthService.login(staff)` → `jwtService.sign({ sub: staff.id, role: staff.role })`.
- `POST /auth/login` DTO'su (`class-validator` ile `email`, `password` zorunlu).
- `JwtStrategy` (`passport-jwt`): `secretOrKey: process.env.JWT_SECRET`, `validate(payload)` içinde `{ id: payload.sub, role: payload.role }` döndür.

### 3. Guard'lar

`JwtAuthGuard extends AuthGuard('jwt')` — korumalı route'larda `@UseGuards(JwtAuthGuard)`.

`RolesGuard` + `@Roles(...roles: Role[])` decorator'ı: `Reflector` ile route metadata'sından beklenen rolleri oku, `request.user.role` ile karşılaştır.

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Post()
createStaff(@Body() dto: CreateStaffDto) { ... }
```

### 4. `StaffModule` (admin-only oluşturma)

`POST /staff`: `CreateStaffDto` (`fullName`, `email`, `phone?`, `password`, `role`), servis içinde `bcrypt.hash(password, 10)` ile `passwordHash` üret, `Staff` kaydını oluştur. Şifreyi response'tan **çıkar** (DTO/serialize ile).

### 5. Uçtan uca test

Swagger'dan:

1. Seed'deki admin (`admin@wask.co` / `demo1234`) ile `/auth/login` → token al.
2. Swagger'da "Authorize" ile token'ı gir.
3. `POST /staff` ile yeni bir personel oluştur (admin token'ıyla çalışmalı).
4. Yeni personelin token'ıyla `POST /staff` dene — `RolesGuard` reddetmeli (403).

### 6. Haftayı kapat

```bash
git add . && git commit -m "feat(auth): jwt login, roles guard ve admin-only staff olusturma"
# kendine PR aç, main'e merge et
git checkout main && git pull
git tag v0.1
git push origin v0.1
```

README'ye "Backend temel kurulum tamam (auth + veri modeli)" notu ekle.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Admin login olup JWT alabiliyor.
- [ ] JWT olmadan korumalı endpoint 401 dönüyor.
- [ ] STAFF rolündeki kullanıcı admin-only endpoint'e erişemiyor (403).
- [ ] `v0.1` tag'i GitHub'da görünüyor.

---

## 📚 Sonraki gün

2. hafta başlıyor: [Gün 6 — Customers ve Locations modülleri](./gun-06.md) ile gerçek CRUD API'lerini yazmaya başlıyoruz.
