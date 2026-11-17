import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const [owner = 'ItsDieGhost', repo = 'simulador-estacionamiento'] = (
  process.env.GITHUB_REPOSITORY ?? 'ItsDieGhost/simulador-estacionamiento'
).split('/');

const site = process.env.SITE_URL ?? `https://${owner}.github.io`;
const base = process.env.BASE_PATH ?? `/${repo}/`;

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  image: {
    responsiveStyles: false,
  },
  vite: {
    build: {
      // La matriz exige cero scripts inline; los módulos del simulador se emiten aparte.
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "media-src 'none'",
        "manifest-src 'self'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: ["'self'"],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
});
