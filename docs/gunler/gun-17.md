# Gün 17 — Bakım Kaydı Formu

> 4. Hafta · Bitki/bakım ekranları, QR/PWA, yönetici paneli, cilalama

Bugün personelin sahada en sık dokunacağı ekranı yazıyoruz: "Bakım Yap" formu. Çoklu işlem seçimi, ürün seçimi, not ve fotoğraf — hepsi tek formda, ama sade.

---

## 🎯 Bugünün hedefi

1. "Bakım Yap" formu: bakım türleri için çoklu seçim (checkbox grid), kullanılan ürün(ler) + miktar, personel (giriş yapan otomatik dolu), not, fotoğraf ekleme (mobil kamera destekli).
2. Gönderim sonrası bitki detay sayfasındaki "son bakım / sıradaki bakım" ve geçmiş listesinin anında güncellenmesi.

---

## 🤔 Neden?

- Checkbox grid tercih etmemizin sebebi: "sulama, gübreleme, budama..." gibi işlemler aynı anda birden fazla seçilebilmeli ve sahada eldiven takan biri bile tek dokunuşla işaretleyebilmeli — dropdown/multi-select yerine büyük, görünür checkbox'lar mobilde çok daha kullanışlı.
- Fotoğraf input'unda `capture` attribute'u kullanmamızın sebebi: personel telefonunda doğrudan kamera açılsın, galeriden seçim ekstra bir adım olmasın (istersen galeri seçeneğini de bırakabilirsin, ikisi birbirini dışlamaz).

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-17-bakim-formu
```

### 1. Form bileşeni

`apps/web/components/MaintenanceLogForm.vue` — `plantId` prop'u alır.

```vue
<template>
  <form @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-2">
      <label v-for="type in maintenanceTypes" :key="type.id" class="flex items-center gap-2 p-3 border rounded-lg">
        <input type="checkbox" :value="type.id" v-model="selectedTypeIds" class="w-5 h-5" />
        <span>{{ type.name }}</span>
      </label>
    </div>

    <!-- ürün seçimi: her ürün için checkbox + miktar input'u -->
    <!-- not alanı: textarea -->
    <!-- fotoğraf: <input type="file" accept="image/*" capture="environment" multiple> -->

    <button type="submit" class="w-full py-4 text-lg rounded-lg bg-green-600 text-white">
      Bakımı Kaydet
    </button>
  </form>
</template>
```

`selectedTypeIds`'in boş olmasını engelle (en az 1 işlem seçili olmalı — basit bir `v-if` uyarısı yeterli, ağır bir validasyon kütüphanesine gerek yok).

### 2. Gönderim akışı

```ts
async function onSubmit() {
  const log = await useApi().request(`/plants/${props.plantId}/maintenance-logs`, {
    method: 'POST',
    body: {
      date: new Date().toISOString(),
      staffId: authStore.user.id,
      typeIds: selectedTypeIds.value,
      products: selectedProducts.value,
      notes: notes.value,
    },
  });

  // fotoğrafları ayrı ayrı yükle (her biri kendi request'i, FormData ile)
  for (const file of selectedPhotos.value) {
    const formData = new FormData();
    formData.append('file', file);
    await $fetch(`${apiBase}/maintenance-logs/${log.id}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.token}` },
      body: formData,
    });
  }

  emit('saved');
}
```

### 3. Anlık güncelleme

Bitki detay sayfasında (`plants/[id].vue`) `MaintenanceLogForm`'un `@saved` event'ini dinle, tetiklenince bitki detay verisini yeniden çek (basit bir `refresh()` / `refetch()` yeterli — optimistic update'e gerek yok, mobil bağlantıda bir istek daha atmak sorun değil).

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] Bir bitkiye 2 işlem + 1 ürünle bakım kaydı UI üzerinden girilebiliyor.
- [ ] Fotoğraf eklendiğinde bakım kaydına başarıyla yükleniyor.
- [ ] Kayıt sonrası bitki detay sayfasındaki tarihler ve geçmiş listesi güncelleniyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 18 — Personel mobil akışı, PWA ve QR okuma](./gun-18.md) ile sahadaki asıl kullanım senaryosunu tamamlıyoruz.
