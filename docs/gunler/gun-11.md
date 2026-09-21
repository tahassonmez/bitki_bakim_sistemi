# Gün 11 — Fotoğraf Yükleme

> 3. Hafta · Fotoğraf, raporlama, frontend temeli

Kullanıcı isteği net: "bakım sırasında çekilen fotoğraflar" tutulmalı. Bugün bunu kuruyoruz — ama ileride S3/Cloudinary gibi bir servise taşınabilecek şekilde, depolamayı bir interface arkasına gizleyerek.

---

## 🎯 Bugünün hedefi

1. `Multer` ile dosya yükleme (`POST /maintenance-logs/:id/photos`), local diske kaydet.
2. Dosya tipi (jpg/png/heic) ve boyut validasyonu.
3. Depolamayı `StorageService` arkasına gizle (`save(file)`, `getUrl(path)`).
4. Fotoğraf silme endpoint'i.

---

## 🤔 Neden?

- `StorageService` soyutlaması bugün fazladan iş gibi görünse de (§ ileri faz backlog: "dosya depolamayı S3/Cloudinary'e taşıma") bu değişikliği tek dosyada izole ediyor — MVP local disk kullanırken bile controller/service kodun "nereye kaydedildiğini" bilmiyor.
- Dosya tipi/boyut validasyonunu şimdi koymak, sahada büyük HEIC fotoğrafların (iPhone varsayılanı) sunucuyu şişirmesini engelliyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-11-fotograf-yukleme
pnpm --filter @hr/api add @nestjs/platform-express multer
pnpm --filter @hr/api add -D @types/multer
```

`.gitignore`'a `uploads/` zaten Gün 1'de eklenmişti — kontrol et.

### 1. `StorageService` arayüzü

`apps/api/src/storage/storage.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async save(file: Express.Multer.File): Promise<string> {
    const fileName = `${randomUUID()}-${file.originalname}`;
    await writeFile(join(this.uploadDir, fileName), file.buffer);
    return fileName;
  }

  getUrl(fileName: string): string {
    return `${process.env.API_PUBLIC_URL ?? 'http://localhost:3001'}/uploads/${fileName}`;
  }

  async delete(fileName: string): Promise<void> {
    await unlink(join(this.uploadDir, fileName)).catch(() => undefined);
  }
}
```

`main.ts`'e statik dosya servisi ekle (`app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })`) ya da bu MVP'de doğrudan `StorageService.getUrl` üzerinden servis et — hangisini seçtiysen `Photo.url` alanına yazılan değerle tutarlı olsun.

`uploads/` klasörünü elle oluştur: `mkdir -p apps/api/uploads`.

### 2. Yükleme endpoint'i

`PhotosModule` → `POST /maintenance-logs/:id/photos`:

```ts
@Post(':id/photos')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
}))
async uploadPhoto(@Param('id') logId: string, @UploadedFile() file: Express.Multer.File) {
  const fileName = await this.storageService.save(file);
  return this.prisma.photo.create({
    data: { logId, url: this.storageService.getUrl(fileName), uploadedById: /* auth'tan gelen kullanıcı id'si */ '' },
  });
}
```

> `uploadedById`'yi gerçek istek yapan kullanıcıdan (`@Req() req` → `req.user.id`, Gün 5'teki JWT payload) al — sabit boş string sadece taslak, unutma.

### 3. Silme

`DELETE /photos/:id` — önce `Photo` kaydını bul, `StorageService.delete` ile dosyayı sil, sonra DB kaydını sil.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Bir bakım kaydına gerçek bir fotoğraf dosyası yüklenip URL üzerinden tarayıcıda görüntülenebiliyor.
- [ ] 8MB üstü ya da desteklenmeyen tipte dosya reddediliyor.
- [ ] Fotoğraf silindiğinde hem disk hem DB'den kalkıyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 12 — Dashboard/raporlama endpoint'leri](./gun-12.md)'nde yaklaşan ve geciken bakımları hesaplayan sorguları yazıyoruz.
