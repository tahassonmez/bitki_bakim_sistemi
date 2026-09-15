export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  const user = auth.user;

  if (to.path === '/login') {
    if (user) return navigateTo(user.role === 'ADMIN' ? '/dashboard' : '/field/today');
    return;
  }

  if (!user || !auth.token) return navigateTo('/login');

  if (to.path.startsWith('/dashboard') && user.role !== 'ADMIN') {
    return navigateTo('/field/today');
  }
});
