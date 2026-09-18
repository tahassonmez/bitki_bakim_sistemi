import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  const user = auth.user;

  if (to.path === '/' || to.path === '/login') {
    if (user && auth.token) return navigateTo(user.role === 'ADMIN' ? '/dashboard' : '/field/today');
    if (to.path === '/') return navigateTo('/login');
    return;
  }

  if (!user || !auth.token) return navigateTo('/login');

  if (
    (to.path.startsWith('/dashboard') ||
      to.path.startsWith('/staff') ||
      to.path.startsWith('/maintenance-logs')) &&
    user.role !== 'ADMIN'
  ) {
    return navigateTo('/field/today');
  }
});
