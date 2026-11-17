import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const [owner = 'ItsDieGhost', repo = 'simulador-estacionamiento'] = (
  process.env.GITHUB_REPOSITORY ?? 'ItsDieGhost/simulador-estacionamiento'
).split('/');
const site = (process.env.SITE_URL ?? `https://${owner}.github.io`).replace(/\/$/, '');
const base = (process.env.BASE_PATH ?? `/${repo}/`).replace(/\/$/, '');
const checkExternal = process.argv.includes('--external');

const htmlFiles = [];
const internalLinks = new Map();
const externalLinks = new Set();
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(fullPath);
  }
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[2] ?? match[3] ?? '') : undefined;
}

function decode(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&#38;', '&');
}

function resolveInternal(pathname) {
  let clean = decodeURIComponent(pathname.split('?')[0].split('#')[0]);
  if (base && clean.startsWith(`${base}/`)) clean = clean.slice(base.length);
  else if (base && clean === base) clean = '/';
  else if (base && clean.startsWith('/')) return null;

  clean = clean.replace(/^\/+/, '');
  if (clean === '' || clean.endsWith('/')) clean += 'index.html';
  return path.join(dist, clean);
}

async function exists(filePath) {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}

function addInternal(source, href) {
  const targets = internalLinks.get(href) ?? new Set();
  targets.add(source);
  internalLinks.set(href, targets);
}

async function checkExternalUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: {
        'user-agent': 'MySpot-link-check/1.0 (+https://github.com/ItsDieGhost/simulador-estacionamiento)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (response.ok) return;
    if (response.status === 405 || response.status === 403) {
      const fallback = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        headers: {
          'user-agent': 'MySpot-link-check/1.0',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (fallback.ok || fallback.status === 403) return;
      errors.push(`Externo ${url}: HTTP ${fallback.status}.`);
      return;
    }
    errors.push(`Externo ${url}: HTTP ${response.status}.`);
  } catch (error) {
    errors.push(`Externo ${url}: ${error instanceof Error ? error.message : String(error)}.`);
  }
}

await walk(dist);

for (const filePath of htmlFiles) {
  const source = path.relative(dist, filePath).replaceAll('\\', '/');
  const html = await readFile(filePath, 'utf8');
  const tags = [...html.matchAll(/<(?:a|link|script|img)\b[^>]*>/gi)].map((match) => match[0]);

  for (const tag of tags) {
    const rel = getAttribute(tag, 'rel') ?? '';
    if (rel === 'canonical' || rel === 'sitemap') continue;

    for (const attribute of ['href', 'src']) {
      const value = decode(getAttribute(tag, attribute) ?? '');
      if (!value) continue;
      if (/^(mailto:|tel:|data:)/i.test(value)) continue;
      if (value.startsWith('#')) {
        if (value.length > 1) {
          const hash = value.slice(1);
          const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (!new RegExp(`\\bid="${escaped}"`).test(html)) {
            errors.push(`${source}: ancla inexistente ${value}.`);
          }
        }
        continue;
      }

      if (/^https?:\/\//i.test(value)) {
        if (value.startsWith(`${site}${base}/`) || value === `${site}${base}`) {
          const url = new URL(value);
          const target = resolveInternal(url.pathname);
          if (!target || !(await exists(target))) {
            errors.push(`${source}: enlace propio roto ${value}.`);
          }
        } else {
          externalLinks.add(value);
        }
        continue;
      }

      const target = resolveInternal(value);
      if (!target) {
        errors.push(`${source}: ruta fuera del base ${value}.`);
        continue;
      }
      addInternal(source, value);
      if (!(await exists(target))) {
        errors.push(`${source}: enlace roto ${value}.`);
        continue;
      }

      const hash = value.split('#')[1];
      if (hash) {
        const targetHtml = await readFile(target, 'utf8');
        const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!new RegExp(`\\bid="${escaped}"`).test(targetHtml)) {
          errors.push(`${source}: ancla inexistente ${value}.`);
        }
      }
    }
  }
}

const sitemapPath = path.join(dist, 'sitemap-index.xml');
if (await exists(sitemapPath)) {
  const sitemap = await readFile(sitemapPath, 'utf8');
  const sitemaps = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const url of sitemaps) {
    const target = resolveInternal(new URL(url).pathname);
    if (!target || !(await exists(target))) errors.push(`Sitemap: falta ${url}.`);
  }
}

if (checkExternal && externalLinks.size > 0) {
  const urls = [...externalLinks];
  console.log(`Comprobando ${urls.length} enlaces externos…`);
  const queue = [...urls];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (url) await checkExternalUrl(url);
    }
  });
  await Promise.all(workers);
}

if (errors.length > 0) {
  console.error(`Enlaces: ${errors.length} problema(s).`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  const externalNote = checkExternal
    ? `${externalLinks.size} externos comprobados`
    : `${externalLinks.size} externos omitidos (usa --external)`;
  console.log(
    `Enlaces correctos: ${htmlFiles.length} páginas, ${internalLinks.size} rutas internas, ${externalNote}.`
  );
}
