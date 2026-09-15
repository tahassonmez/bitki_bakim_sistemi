import type { FetchOptions } from 'ofetch';

export function useApi() {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('auth_token');

  const request = async <T>(path: string, options: FetchOptions<'json'> = {}) => {
    const headers = new Headers(options.headers as HeadersInit | undefined);
    if (token.value) headers.set('Authorization', `Bearer ${token.value}`);

    const response = await $fetch<{ data: T }>(path, {
      baseURL: config.public.apiBase,
      ...options,
      headers,
    });
    return response.data;
  };

  return { request };
}
