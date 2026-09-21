import type { FetchOptions } from 'ofetch';
import { useAuthStore } from '~/stores/auth';

export function useApi() {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('auth_token');

  const request = async <T>(path: string, options: FetchOptions<'json'> = {}) => {
    const headers = new Headers(options.headers as HeadersInit | undefined);
    if (token.value) headers.set('Authorization', `Bearer ${token.value}`);

    try {
      const response = await $fetch<{ data: T }>(path, {
        baseURL: String(config.public.apiBase),
        ...options,
        headers,
      });
      return response.data;
    } catch (error) {
      const status =
        (error as { response?: { status?: number } })?.response?.status ??
        (error as { statusCode?: number })?.statusCode;

      if (status === 401) {
        // Token süresi dolmuş ya da geçersiz: bunu genel bir "sunucuya
        // bağlanılamadı" hatası gibi göstermek yanıltıcı oluyor (kullanıcı
        // API'yi/veritabanını kontrol etmeye çalışıyor ama asıl sorun oturumun
        // sona ermiş olması). Sessizce çıkış yapıp giriş ekranına yönlendiriyoruz.
        const auth = useAuthStore();
        await auth.logout();
      }
      throw error;
    }
  };

  return { request };
}
