// Adres önerilerini OpenStreetMap'in ücretsiz Nominatim servisinden alıyoruz
// (Google Places Autocomplete'in ücretsiz, anahtarsız karşılığı). Nominatim'in
// kullanım kuralları (https://operations.osmfoundation.org/policies/nominatim/)
// saniyede en fazla 1 istek ve "yazarken aratma"nın gecikmeli (debounce)
// yapılmasını istiyor — bu yüzden her çağrıyı 500ms geciktiriyor ve kullanıcı
// yazmaya devam ederken önceki isteği iptal ediyoruz.
export interface AddressSuggestion {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
}

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

export function useAddressSearch() {
  const suggestions = ref<AddressSuggestion[]>([]);
  const loading = ref(false);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  function clear() {
    suggestions.value = [];
    loading.value = false;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (abortController) abortController.abort();
  }

  function search(query: string) {
    if (debounceTimer) clearTimeout(debounceTimer);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      suggestions.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;
    debounceTimer = setTimeout(async () => {
      if (abortController) abortController.abort();
      abortController = new AbortController();

      const params = new URLSearchParams({
        format: 'jsonv2',
        q: trimmed,
        countrycodes: 'tr',
        limit: '5',
        addressdetails: '0',
      });

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: abortController.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Nominatim ${response.status}`);
        const results = (await response.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
        suggestions.value = results.map((item) => ({
          id: String(item.place_id),
          displayName: item.display_name,
          lat: Number(item.lat),
          lon: Number(item.lon),
        }));
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.warn('[Adres arama] Nominatim isteği başarısız:', error);
          suggestions.value = [];
        }
      } finally {
        loading.value = false;
      }
    }, DEBOUNCE_MS);
  }

  return { suggestions, loading, search, clear };
}
