export const site = {
  name: 'MySpot',
  longName: 'MySpot · Simulador de estacionamiento',
  tagline: 'Monte Carlo y teoría de colas aplicados al parqueo',
  description:
    'Sitio educativo con un simulador reproducible de estacionamiento: teoría de colas M/M/c/K, Monte Carlo y el caso MySpot.',
  author: 'Diego Arbeláez',
  institution: 'UNEFA Táchira',
  program: 'Ingeniería de Sistemas',
  repoUrl: 'https://github.com/ItsDieGhost/simulador-estacionamiento',
  repoLabel: 'ItsDieGhost/simulador-estacionamiento',
  ogImage: '/og-image.png',
  ogImageAlt:
    'Tarjeta de MySpot con un plano de estacionamiento, fórmula de colas y la leyenda Simulación M/M/c/K.',
  locale: 'es_VE',
  language: 'es',
  published: '2026-11-03',
  lastReviewed: '2026-11-17',
  themeColorLight: '#e9e6dd',
  themeColorDark: '#101317',
} as const;

export const lastReviewedLabel = '17 de noviembre de 2026';

export interface NavItem {
  label: string;
  path: string;
  shortLabel: string;
}

export const navigation: NavItem[] = [
  { label: 'Inicio', path: '/', shortLabel: 'Inicio' },
  { label: 'Teoría', path: '/teoria/', shortLabel: 'Teoría' },
  { label: 'Simulador', path: '/simulador/', shortLabel: 'Simulador' },
  { label: 'Caso MySpot', path: '/caso-myspot/', shortLabel: 'Caso' },
  { label: 'Referencias', path: '/referencias/', shortLabel: 'Referencias' },
  { label: 'Acerca de', path: '/acerca/', shortLabel: 'Acerca' },
];

export interface Revision {
  date: string;
  label: string;
  title: string;
  details: string;
  tags: string[];
}

export const revisions: Revision[] = [
  {
    date: '2026-11-17',
    label: '17 de noviembre de 2026',
    title: 'Revisión de cierre y auditoría pública',
    details:
      'Se completaron las páginas de teoría y caso, se verificaron citas y DOI, se añadieron la política CSP por hashes, security.txt, robots.txt, sitemap, imagen Open Graph propia y la tabla de cumplimiento. Pasaron astro check, ESLint, Vitest, la auditoría de HTML y Lighthouse móvil.',
    tags: ['Contenido', 'Seguridad', 'SEO'],
  },
  {
    date: '2026-11-12',
    label: '12 de noviembre de 2026',
    title: 'Simulador M/M/c/K reproducible',
    details:
      'Se implementó el motor de eventos discretos con semilla, la comparación con la teoría de Erlang, los gráficos SVG accesibles y sus pruebas de determinismo, límites y convergencia.',
    tags: ['Simulador', 'Pruebas'],
  },
  {
    date: '2026-11-08',
    label: '8 de noviembre de 2026',
    title: 'Modelo, fuentes y estructura de contenido',
    details:
      'Se documentaron los supuestos del caso MySpot, se redactaron las secciones de Monte Carlo, Poisson, colas y ley de Little, y se armó la bibliografía APA con sus enlaces.',
    tags: ['Teoría', 'Referencias'],
  },
  {
    date: '2026-11-03',
    label: '3 de noviembre de 2026',
    title: 'Primera versión publicable',
    details:
      'Se creó el sitio estático en Astro con layout único, tokens de diseño, navegación global, modo claro/oscuro del sistema y despliegue preparado para GitHub Pages.',
    tags: ['Base', 'Diseño'],
  },
];

export interface ComplianceItem {
  id: string;
  criterion: string;
  points: string;
  acceptance: string;
  evidence: string;
  status: 'Cumplido' | 'Parcial' | 'Pendiente';
  note?: string;
}

export const compliance: ComplianceItem[] = [
  {
    id: 'usabilidad',
    criterion: 'Usabilidad y navegación',
    points: '2,5',
    acceptance:
      'Cualquier sección se alcanza en menos de 3 clics; header de 6 enlaces en todas las páginas, enlace de salto, breadcrumbs y mapa del sitio en el footer.',
    evidence: 'Header global, migas de pan y footer con mapa del sitio en las seis páginas.',
    status: 'Cumplido',
  },
  {
    id: 'consistencia',
    criterion: 'Consistencia visual',
    points: '2,0',
    acceptance:
      'Un único BaseLayout y tokens de color, tipografía, espaciado, radios y sombras; sin estilos ad-hoc por página; modo claro/oscuro automático.',
    evidence: 'src/layouts/BaseLayout.astro y src/styles/tokens.css. El tema sigue prefers-color-scheme.',
    status: 'Cumplido',
  },
  {
    id: 'rendimiento',
    criterion: 'Tiempo de respuesta',
    points: '2,5',
    acceptance:
      'Lighthouse móvil ≥ 95 en las cuatro categorías, LCP < 2 s, CLS < 0,05, INP < 200 ms; JS < 50 KB gzip salvo el simulador; gráficos SVG y animación con requestAnimationFrame.',
    evidence: 'Resultados de Lighthouse móvil y auditoría de HTML en /acerca/#rendimiento.',
    status: 'Parcial',
    note: 'Los puntajes reales se registran tras la auditoría; el simulador carga un único módulo propio.',
  },
  {
    id: 'legibilidad',
    criterion: 'Legibilidad y estructura',
    points: '2,0',
    acceptance:
      'Un H1 por página, jerarquía sin saltos, párrafos breves, tabla de contenidos en páginas largas, semántica HTML y texto ≥ 16 px con contraste AA.',
    evidence: 'Tabla de contenidos en /teoria/ y /acerca/; revisión automática de H1 y jerarquía.',
    status: 'Cumplido',
  },
  {
    id: 'actualizacion',
    criterion: 'Actualización visible',
    points: '2,0',
    acceptance:
      'Cada página muestra “Última revisión: 17 de noviembre de 2026” en un <time datetime="2026-11-17"> generado desde una constante; historial de revisiones fechado y dateModified en JSON-LD.',
    evidence: 'Constante site.lastReviewed en src/data/site.ts y historial en /acerca/#historial.',
    status: 'Cumplido',
  },
  {
    id: 'veracidad',
    criterion: 'Veracidad y citas',
    points: '2,0',
    acceptance:
      'Toda afirmación técnica tiene una cita autor–año enlazada a /referencias/; al menos 8 fuentes reales en formato APA 7 con DOI o URL cuando corresponde.',
    evidence:
      '14 referencias en /referencias/, ordenadas alfabéticamente; las citas enlazan a /referencias/#ref-N.',
    status: 'Cumplido',
  },
  {
    id: 'responsividad',
    criterion: 'Responsividad',
    points: '2,5',
    acceptance:
      'Diseño mobile-first sin scroll horizontal a 360, 768, 1024 y 1440 px; objetivos táctiles ≥ 44 px; simulador apilado y gráficos con viewBox.',
    evidence: 'Pruebas de los cuatro anchos y estilos en src/styles. Controles y gráficos escalables.',
    status: 'Cumplido',
  },
  {
    id: 'seguridad',
    criterion: 'Protocolos de seguridad',
    points: '2,5',
    acceptance:
      'CSP estricta sin unsafe-inline/unsafe-eval, referrer policy, rel noopener noreferrer, sin contenido mixto, security.txt, robots.txt, lockfile, npm audit y Dependabot.',
    evidence: 'CSP con hashes generada por Astro; sección /acerca/#seguridad; archivos .well-known/security.txt y robots.txt.',
    status: 'Parcial',
    note: 'HTTPS y “Enforce HTTPS” se activan en la configuración de GitHub Pages; las cabeceras HTTP no son configurables en Pages.',
  },
  {
    id: 'seo',
    criterion: 'Optimización SEO',
    points: '2,0',
    acceptance:
      'Títulos y descripciones únicos, canonical, Open Graph/Twitter con imagen 1200×630, favicon, JSON-LD, sitemap, robots.txt, URLs limpias, 404 propia y alt en imágenes.',
    evidence: 'Etiquetas únicas por página, sitemap-index.xml, /404/ y public/og-image.png.',
    status: 'Cumplido',
  },
];
