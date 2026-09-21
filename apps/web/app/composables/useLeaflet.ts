// Leaflet + OpenStreetMap harita kütüphanesini tembel yüklüyor. Google Maps'in
// aksine bunun için API anahtarı ya da faturalandırma gerekmiyor — tamamen
// ücretsiz ve açık kaynak. Modül seviyesindeki tek bir promise sayesinde
// script/stil birden fazla kez eklenmiyor.
let loadPromise: Promise<any> | null = null;

const LEAFLET_VERSION = '1.9.4';
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

export function useLeaflet() {
  function load(): Promise<any> {
    if (loadPromise) return loadPromise;

    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Leaflet yalnızca tarayıcıda yüklenebilir.'));
    }

    const w = window as any;
    if (w.L) {
      loadPromise = Promise.resolve(w.L);
      return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = JS_URL;
      script.async = true;
      script.onload = () => resolve((window as any).L);
      script.onerror = () => {
        loadPromise = null;
        reject(new Error('Leaflet script yüklenemedi.'));
      };
      document.head.appendChild(script);
    });

    return loadPromise;
  }

  return { load };
}
