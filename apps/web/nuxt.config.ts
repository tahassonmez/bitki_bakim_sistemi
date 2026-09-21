// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-17',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      // iOS Safari, manifest'teki "display: standalone" ayarını kendi başına
      // dikkate almıyor — ana ekrana eklenen sayfanın adres çubuğu olmadan,
      // gerçek bir uygulama gibi açılması için bu meta etiketleri gerekiyor.
      link: [
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        // @vite-pwa/nuxt normalde bu etiketi kendisi ekliyor ama bu projede
        // bir sebepten (henüz netleştiremediğimiz bir nedenle) otomatik ekleme
        // çalışmıyor — manifest dosyası sunucudan doğru geliyor, sadece sayfaya
        // bağlanmıyordu. Elle ekleyerek garantiye alıyoruz.
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'BitkiBakım' },
        { name: 'theme-color', content: '#203d30' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Bitki Bakım Takip',
      short_name: 'BitkiBakım',
      description: 'Saha ekibi için bitki bakım takip uygulaması',
      theme_color: '#203d30',
      background_color: '#f7f8f4',
      display: 'standalone',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
    },
    devOptions: {
      enabled: true,
    },
  },
})
