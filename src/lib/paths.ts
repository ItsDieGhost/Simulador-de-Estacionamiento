const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export function withBase(path: string): string {
  if (path === '/' || path === '') return BASE;
  return `${BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function stripBase(pathname: string): string {
  if (pathname === BASE || pathname === BASE.slice(0, -1)) return '/';
  if (pathname.startsWith(BASE)) {
    const rest = pathname.slice(BASE.length - 1);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}
