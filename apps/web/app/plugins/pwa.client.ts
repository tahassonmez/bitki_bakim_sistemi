export default defineNuxtPlugin(() => {
  // @vite-pwa/nuxt normalde servis çalışanını (service worker) otomatik
  // kaydediyor, ama bu projede o otomatik kayıt bir sebepten devreye
  // girmiyor (manifest dosyası sunucudan doğru geliyor, sadece sayfaya
  // hiç bağlanmıyor ve servis çalışanı hiç kaydolmuyordu). Bu da "ana
  // ekrana ekle / yükle" davranışının tarayıcıda hiç tetiklenmemesine
  // yol açıyordu. Burada elle tetikleyerek garantiye alıyoruz.
  // @ts-expect-error - 'virtual:pwa-register', vite-plugin-pwa tarafından derleme sırasında sağlanan sanal bir modül
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch((error: unknown) => {
      console.warn('[pwa] servis çalışanı kaydedilemedi:', error);
    });
});
