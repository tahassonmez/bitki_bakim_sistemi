# Gün 14 — Nuxt Frontend İskeleti

> 3. Hafta · Fotoğraf, raporlama, frontend temeli

Backend 13 gün boyunca sağlamlaştı, şimdi sırada frontend var. Bugün iskeleti kuruyoruz: Nuxt 4, Tailwind, Pinia, VeeValidate/Yup, iki ayrı layout (yönetici / saha) ve auth akışı.

---

## 🎯 Bugünün hedefi

1. `apps/web`'de Nuxt 4 projesi (`@hr/web`), Tailwind, Pinia, VeeValidate+Yup kurulumu.
2. İki layout: `admin` (geniş ekran) ve `field` (mobil, sade, büyük dokunmatik alanlar).
3. API çağrıları için tek bir composable (`useApi()`), JWT'yi otomatik ekleyen interceptor.
4. `auth` Pinia store'u, login sayfası, route middleware (rol bazlı yönlendirme).

---

## 🤔 Neden?

- İki ayrı layout'u en baştan ayırmak önemli: kullanıcı isteği net — "personelin telefonundan kullanımı kolay olmalı, gereksiz karmaşık ekranlar olmamalı." Admin ekranı ile saha ekranını aynı bileşenlerle karıştırırsan ikisi de birbirine yapışır, ileride sadeleştirmek zorlaşır.
- Tek bir `useApi()` composable'ı, Gün 13'te kurduğun tutarlı response/hata formatını frontend'in her yerinde tekrar ayrıştırmak yerine bir kere ele almanı sağlıyor.

---

## 🛠️ Adımlar

### 0. Dalını aç

```bash
git checkout -b feature/gun-14-nuxt-iskelet
```

### 1. Nuxt projesini oluştur

```bash
pnpm dlx nuxi@latest init apps/web --package-manager pnpm --gitInit false
```

`apps/web/package.json`'daki `"name"`'i `"@hr/web"` yap. Kökten kur:

```bash
pnpm install
```

### 2. Tailwind, Pinia, VeeValidate

```bash
pnpm --filter @hr/web add -D @nuxtjs/tailwindcss
pnpm --filter @hr/web add @pinia/nuxt pinia
pnpm --filter @hr/web add vee-validate yup
```

`apps/web/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
});
```

`apps/web/.env`:

```
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

### 3. İki layout

`apps/web/layouts/admin.vue` — üstte/yanda geniş bir navigasyon (Müşteriler, Bitkiler, Personel, Dashboard), `<slot />` içerik alanı.

`apps/web/layouts/field.vue` — üstte sadece geri butonu ve başlık, alt kısımda büyük dokunmatik bir "QR Tara" butonu (Gün 18'de işlevsel olacak), içerik tek sütun, geniş boşluklu.

### 4. `useApi()` composable

`apps/web/composables/useApi.ts`:

```ts
export function useApi() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const request = async <T>(path: string, options: any = {}): Promise<T> => {
    const response = await $fetch<{ data: T }>(path, {
      baseURL: config.public.apiBase,
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      ...options,
    });
    return response.data;
  };

  return { request };
}
```

### 5. `auth` Pinia store + login sayfası

`apps/web/stores/auth.ts` — `token`, `user` (id, fullName, role), `login(email, password)` (useApi ile `/auth/login` çağırır, token'ı state + bir çerez/localStorage'a yazar — SSR ile uyumlu olması için `useCookie` tercih et), `logout()`.

`apps/web/pages/login.vue` — VeeValidate + Yup ile email/şifre formu, `authStore.login` çağırır, rol `ADMIN` ise `/dashboard`'a, `STAFF` ise `/field/today`'e yönlendirir.

### 6. Route middleware

`apps/web/middleware/auth.global.ts` — giriş yapılmamışsa `/login`'e yönlendir; login sayfasındayken zaten giriş yapılmışsa role göre ana sayfaya yönlendir.

---

## ✅ Bugünün çıktısı (Definition of Done)

- [ ] `pnpm --filter @hr/web dev` çalışıyor, Tailwind sınıfları uygulanıyor.
- [ ] Admin kullanıcı login olup admin layout'una, personel login olup field layout'una düşüyor.
- [ ] Token olmadan korumalı bir sayfaya gidilince `/login`'e yönlendiriliyor.
- [ ] Commit + kendine PR + `main`'e merge.

---

## 📚 Sonraki gün

[Gün 15 — Müşteri ve konum ekranları](./gun-15.md) ile ilk gerçek admin ekranlarını yazıyoruz.
