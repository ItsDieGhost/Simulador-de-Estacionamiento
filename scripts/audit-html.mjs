import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const [owner = 'ItsDieGhost', repo = 'simulador-estacionamiento'] = (
  process.env.GITHUB_REPOSITORY ?? 'ItsDieGhost/simulador-estacionamiento'
).split('/');
const base = (process.env.BASE_PATH ?? `/${repo}/`).replace(/\/$/, '');
void owner;

const errors = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();
const htmlFiles = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
}

function relative(filePath) {
  return path.relative(dist, filePath).replaceAll('\\', '/');
}

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ');
}

function getAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');
  const match = tag.match(pattern);
  return match ? decodeEntities(match[2] ?? match[3] ?? '') : undefined;
}

function collectTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

const skipLink = /class="skip-link"/;
const header = /<header\b/;
const footer = /<footer\b/;
const main = /<main\b[^>]*id="contenido"/;

await walk(dist);

for (const filePath of htmlFiles) {
  const file = relative(filePath);
  const html = await readFile(filePath, 'utf8');
  const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');

  if (!/<html\b[^>]*lang="es"/i.test(html)) errors.push(`${file}: falta lang="es".`);
  if (!/<meta\b[^>]*charset="utf-8"/i.test(html)) errors.push(`${file}: falta charset UTF-8.`);
  if (!/<meta\b[^>]*name="viewport"/i.test(html)) errors.push(`${file}: falta viewport.`);
  if (!main.test(html)) errors.push(`${file}: falta <main id="contenido">.`);
  if (!skipLink.test(html)) errors.push(`${file}: falta el enlace de salto.`);
  if (!header.test(html)) errors.push(`${file}: falta <header>.`);
  if (!footer.test(html)) errors.push(`${file}: falta <footer>.`);
  if (!/Última revisión:/.test(html)) errors.push(`${file}: falta la última revisión visible.`);

  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  if (h1Count !== 1) errors.push(`${file}: se esperaba 1 H1 y hay ${h1Count}.`);

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';
  if (!title) {
    errors.push(`${file}: falta <title>.`);
  } else {
    if (title.length > 60) errors.push(`${file}: title de ${title.length} caracteres (> 60).`);
    if (titles.has(title)) errors.push(`${file}: title duplicado con ${titles.get(title)}.`);
    titles.set(title, file);
  }

  const metaTags = collectTags(html, 'meta');
  const descriptionTag = metaTags.find((tag) => getAttribute(tag, 'name') === 'description');
  const description = descriptionTag ? getAttribute(descriptionTag, 'content') ?? '' : '';
  if (!description) {
    errors.push(`${file}: falta meta description.`);
  } else {
    if (description.length < 120 || description.length > 160) {
      errors.push(`${file}: description de ${description.length} caracteres (se esperan 120–160).`);
    }
    if (descriptions.has(description)) {
      errors.push(`${file}: description duplicada con ${descriptions.get(description)}.`);
    }
    descriptions.set(description, file);
  }

  if (!metaTags.some((tag) => getAttribute(tag, 'name') === 'referrer')) {
    errors.push(`${file}: falta la política de referrer.`);
  }

  const cspTag = metaTags.find(
    (tag) => getAttribute(tag, 'http-equiv')?.toLowerCase() === 'content-security-policy'
  );
  if (!cspTag) {
    errors.push(`${file}: falta la meta CSP.`);
  } else {
    const csp = getAttribute(cspTag, 'content') ?? '';
    if (/unsafe-inline|unsafe-eval/i.test(csp)) {
      errors.push(`${file}: la CSP contiene unsafe-inline o unsafe-eval.`);
    }
  }

  const canonical = collectTags(html, 'link').filter(
    (tag) => getAttribute(tag, 'rel') === 'canonical'
  );
  if (canonical.length !== 1) errors.push(`${file}: se esperaba un canonical y hay ${canonical.length}.`);

  const imageTag = metaTags.find((tag) => getAttribute(tag, 'property') === 'og:image');
  if (!imageTag || !getAttribute(imageTag, 'content')?.startsWith('https://')) {
    errors.push(`${file}: falta og:image absoluta.`);
  }

  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const [, attributes, body] of inlineScripts) {
    const type = attributes.match(/\btype\s*=\s*("([^"]*)"|'([^']*)')/i);
    const scriptType = type ? (type[2] ?? type[3] ?? '') : '';
    const hasSource = /\bsrc\s*=/i.test(attributes);
    if (!hasSource && scriptType !== 'application/ld+json' && body.trim() !== '') {
      errors.push(`${file}: hay un script inline no permitido.`);
    }
  }

  if (/<style\b/i.test(markup)) errors.push(`${file}: hay una etiqueta <style> inline.`);
  const styleAttributes = [...markup.matchAll(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi)];
  if (styleAttributes.length > 0) {
    errors.push(`${file}: hay ${styleAttributes.length} atributo(s) style inline.`);
  }
  if (/\son[a-z]+\s*=\s*["']/i.test(markup)) {
    errors.push(`${file}: hay manejadores de eventos inline (on*).`);
  }
  if (/<iframe\b/i.test(markup)) errors.push(`${file}: hay un iframe no previsto.`);

  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`${file}: IDs duplicados: ${[...new Set(duplicateIds)].join(', ')}.`);
  }

  const images = collectTags(html, 'img');
  for (const image of images) {
    if (!getAttribute(image, 'alt')) errors.push(`${file}: <img> sin alt.`);
    const src = getAttribute(image, 'src');
    if (src && src.startsWith('/') && base && !src.startsWith(base)) {
      errors.push(`${file}: imagen fuera del base: ${src}.`);
    }
  }

  const anchors = [...html.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);
  for (const anchor of anchors) {
    const target = getAttribute(anchor, 'target');
    const rel = getAttribute(anchor, 'rel') ?? '';
    if (target === '_blank' && !/noopener/.test(rel)) {
      errors.push(`${file}: enlace target="_blank" sin rel="noopener".`);
    }
    const href = getAttribute(anchor, 'href');
    if (href && href.startsWith('/') && base && href !== base && !href.startsWith(`${base}/`)) {
      errors.push(`${file}: enlace interno fuera del base: ${href}.`);
    }
  }

  const stylesheetLinks = collectTags(html, 'link').filter((tag) =>
    /stylesheet|preload/.test(getAttribute(tag, 'rel') ?? '')
  );
  for (const link of stylesheetLinks) {
    const href = getAttribute(link, 'href') ?? '';
    if (href.startsWith('/') && base && !href.startsWith(`${base}/`)) {
      errors.push(`${file}: recurso CSS fuera del base: ${href}.`);
    }
    if (/^https?:\/\//.test(href)) errors.push(`${file}: recurso CSS externo: ${href}.`);
  }

  const scripts = collectTags(html, 'script').filter((tag) => /\bsrc\s*=/.test(tag));
  for (const script of scripts) {
    const src = getAttribute(script, 'src') ?? '';
    if (/^https?:\/\//.test(src)) errors.push(`${file}: script externo: ${src}.`);
    if (src.startsWith('/') && base && !src.startsWith(`${base}/`)) {
      errors.push(`${file}: script fuera del base: ${src}.`);
    }
  }

  const navMatch = html.match(/<nav\b[^>]*class="site-nav"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!navMatch) {
    errors.push(`${file}: falta la navegación principal.`);
  } else {
    const count = [...navMatch[1].matchAll(/<a\b/gi)].length;
    if (count !== 6) errors.push(`${file}: la navegación tiene ${count} enlaces (se esperan 6).`);
  }

  const text = decodeEntities(markup.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  void text;
}

const indexFiles = htmlFiles.filter((file) => file.endsWith(`${path.sep}index.html`)).length;
if (htmlFiles.length < 7) warnings.push(`Solo se auditaron ${htmlFiles.length} archivos HTML.`);
if (indexFiles < 6) warnings.push(`Solo hay ${indexFiles} páginas index.html.`);

if (warnings.length > 0) {
  console.warn(`Auditoría HTML: ${warnings.length} advertencia(s).`);
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (errors.length > 0) {
  console.error(`Auditoría HTML: ${errors.length} error(es) en ${htmlFiles.length} archivos.`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Auditoría HTML correcta: ${htmlFiles.length} páginas, títulos y descripciones únicos, sin estilos ni scripts inline.`
  );
}
