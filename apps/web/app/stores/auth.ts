import type { AuthUser, LoginResponse } from '~/types/api';

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('auth_token', { sameSite: 'lax' });
  const user = useCookie<AuthUser | null>('auth_user', { sameSite: 'lax' });
  const isAuthenticated = computed(() => Boolean(token.value && user.value));

  async function login(email: string, password: string) {
    const config = useRuntimeConfig();
    const response = await $fetch<{ data: LoginResponse }>('/auth/login', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email, password },
    });
    token.value = response.data.accessToken;
    user.value = response.data.staff;
    return response.data.staff;
  }

  function logout() {
    token.value = null;
    user.value = null;
    return navigateTo('/login');
  }

  return { token, user, isAuthenticated, login, logout };
});
