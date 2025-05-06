import { cookies as nextCookies } from 'next/headers';

export function getSSRClientCookies() {
  const cookieStore = nextCookies();
  return {
    getAll: () => cookieStore.getAll(),
    setAll: (cookies: { name: string; value: string; options?: any }[]) => {
      cookies.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
    removeAll: (cookies: { name: string }[]) => {
      cookies.forEach(({ name }) => {
        cookieStore.delete(name);
      });
    },
  };
} 