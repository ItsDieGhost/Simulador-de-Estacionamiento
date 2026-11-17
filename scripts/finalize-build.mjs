import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [owner = 'ItsDieGhost', repo = 'simulador-estacionamiento'] = (
  process.env.GITHUB_REPOSITORY ?? 'ItsDieGhost/simulador-estacionamiento'
).split('/');

const site = (process.env.SITE_URL ?? `https://${owner}.github.io`).replace(/\/$/, '');
const base = process.env.BASE_PATH ?? `/${repo}/`;
const basePrefix = base.endsWith('/') ? base.slice(0, -1) : base;
const repoUrl = `https://github.com/${owner}/${repo}`;

const absolute = (pathname) => `${site}${basePrefix}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
const dist = path.resolve('dist');

await mkdir(path.join(dist, '.well-known'), { recursive: true });

const robots = `# ${repo}
# Sitio estático; no hay rutas privadas ni paneles de administración.

User-agent: *
Allow: /

Sitemap: ${absolute('/sitemap-index.xml')}
`;

const security = `# Política de seguridad y contacto para reportes responsables.
Contact: mailto:darbelaezroballo@gmail.com
Contact: ${repoUrl}/issues
Expires: 2027-11-17T23:59:59.000Z
Preferred-Languages: es, en
Canonical: ${absolute('/.well-known/security.txt')}
Policy: ${absolute('/acerca/')}
# El sitio es estático y no procesa datos personales ni formularios.
# Los reportes se atienden por correo o en el repositorio; no se ofrece programa de recompensas.
`;

await writeFile(path.join(dist, 'robots.txt'), robots, 'utf8');
await writeFile(path.join(dist, '.well-known', 'security.txt'), security, 'utf8');

await access(path.join(dist, 'index.html'));

try {
  await access(path.join(dist, 'og-image.png'));
} catch {
  console.warn('Advertencia: falta dist/og-image.png; ejecuta npm run generate:og.');
}

console.log(`robots.txt y security.txt finalizados para ${site}${basePrefix}/.`);
