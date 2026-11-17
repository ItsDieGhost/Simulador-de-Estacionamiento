export interface Reference {
  id: number;
  /** Entrada APA 7 en texto plano, usada como respaldo. */
  citation: string;
  /** Entrada APA 7 con cursivas para la bibliografía. */
  html: string;
  /** Etiqueta breve para citas en el texto. */
  short: string;
  /** Clave de ordenación alfabética. */
  sortKey: string;
  title: string;
  url?: string;
  kind: 'paper' | 'book' | 'web' | 'standard';
  note?: string;
}

export const references: Reference[] = [
  {
    id: 1,
    kind: 'paper',
    short: 'Metropolis y Ulam, 1949',
    sortKey: 'Metropolis',
    citation:
      'Metropolis, N., & Ulam, S. (1949). The Monte Carlo method. Journal of the American Statistical Association, 44(247), 335–341.',
    html: 'Metropolis, N., &amp; Ulam, S. (1949). The Monte Carlo method. <em>Journal of the American Statistical Association, 44</em>(247), 335–341.',
    title: 'The Monte Carlo method',
    url: 'https://doi.org/10.1080/01621459.1949.10483310',
    note: 'DOI verificado en Crossref el 17 de noviembre de 2026.',
  },
  {
    id: 2,
    kind: 'book',
    short: 'Law, 2015',
    sortKey: 'Law',
    citation:
      'Law, A. M. (2015). Simulation modeling and analysis (5.ª ed.). McGraw-Hill Education.',
    html: 'Law, A. M. (2015). <em>Simulation modeling and analysis</em> (5.ª ed.). McGraw-Hill Education.',
    title: 'Simulation modeling and analysis',
    note: 'ISBN 9780073401324 (Open Library).',
  },
  {
    id: 3,
    kind: 'book',
    short: 'Kleinrock, 1975',
    sortKey: 'Kleinrock',
    citation: 'Kleinrock, L. (1975). Queueing systems: Volume 1. Theory. Wiley.',
    html: 'Kleinrock, L. (1975). <em>Queueing systems: Volume 1. Theory</em>. Wiley.',
    title: 'Queueing systems: Volume 1. Theory',
    note: 'ISBN 9780471491101 (Open Library).',
  },
  {
    id: 4,
    kind: 'book',
    short: 'Harchol-Balter, 2013',
    sortKey: 'Harchol-Balter',
    citation:
      'Harchol-Balter, M. (2013). Performance modeling and design of computer systems: Queueing theory in action. Cambridge University Press.',
    html: 'Harchol-Balter, M. (2013). <em>Performance modeling and design of computer systems: Queueing theory in action</em>. Cambridge University Press.',
    title: 'Performance modeling and design of computer systems',
    url: 'https://doi.org/10.1017/CBO9781139226424',
    note: 'DOI verificado en Crossref el 17 de noviembre de 2026.',
  },
  {
    id: 5,
    kind: 'paper',
    short: 'Little, 1961',
    sortKey: 'Little',
    citation:
      'Little, J. D. C. (1961). A proof for the queuing formula: L = λW. Operations Research, 9(3), 383–387.',
    html: 'Little, J. D. C. (1961). A proof for the queuing formula: L = λW. <em>Operations Research, 9</em>(3), 383–387.',
    title: 'A proof for the queuing formula: L = λW',
    url: 'https://doi.org/10.1287/opre.9.3.383',
    note: 'DOI verificado en Crossref el 17 de noviembre de 2026.',
  },
  {
    id: 6,
    kind: 'book',
    short: 'Banks et al., 2010',
    sortKey: 'Banks',
    citation:
      'Banks, J., Carson, J. S., Nelson, B. L., & Nicol, D. M. (2010). Discrete-event system simulation (5.ª ed.). Pearson.',
    html: 'Banks, J., Carson, J. S., Nelson, B. L., &amp; Nicol, D. M. (2010). <em>Discrete-event system simulation</em> (5.ª ed.). Pearson.',
    title: 'Discrete-event system simulation',
    note: 'ISBN 9780136062127 (Open Library).',
  },
  {
    id: 7,
    kind: 'book',
    short: 'Shoup, 2005',
    sortKey: 'Shoup',
    citation:
      'Shoup, D. C. (2005). The high cost of free parking. Planners Press, American Planning Association.',
    html: 'Shoup, D. C. (2005). <em>The high cost of free parking</em>. Planners Press, American Planning Association.',
    title: 'The high cost of free parking',
    note: 'ISBN 9781884829987 (Open Library).',
  },
  {
    id: 8,
    kind: 'standard',
    short: 'W3C, 2024',
    sortKey: 'World Wide Web Consortium 2024',
    citation:
      'World Wide Web Consortium. (2024). Web Content Accessibility Guidelines (WCAG) 2.2 [W3C Recommendation].',
    html: 'World Wide Web Consortium. (2024). <em>Web Content Accessibility Guidelines (WCAG) 2.2</em> [W3C Recommendation].',
    title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
    url: 'https://www.w3.org/TR/WCAG22/',
    note: 'Especificación W3C; URL comprobada (HTTP 200).',
  },
  {
    id: 9,
    kind: 'standard',
    short: 'W3C, 2025',
    sortKey: 'World Wide Web Consortium 2025',
    citation:
      'World Wide Web Consortium. (2025). MathML Core [W3C Candidate Recommendation Snapshot].',
    html: 'World Wide Web Consortium. (2025). <em>MathML Core</em> [W3C Candidate Recommendation Snapshot].',
    title: 'MathML Core',
    url: 'https://www.w3.org/TR/mathml-core/',
    note: 'Candidate Recommendation Snapshot del 24 de junio de 2025; URL comprobada (HTTP 200).',
  },
  {
    id: 10,
    kind: 'web',
    short: 'Mozilla, 2026',
    sortKey: 'Mozilla',
    citation:
      'Mozilla. (2026). Content Security Policy (CSP). MDN Web Docs. Recuperado el 17 de noviembre de 2026.',
    html: 'Mozilla. (2026). <em>Content Security Policy (CSP)</em>. MDN Web Docs. Recuperado el 17 de noviembre de 2026.',
    title: 'Content Security Policy (CSP)',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP',
    note: 'URL comprobada (HTTP 200) el 17 de noviembre de 2026.',
  },
  {
    id: 11,
    kind: 'web',
    short: 'Astro, 2026',
    sortKey: 'Astro',
    citation:
      'Astro. (2026). Deploy to GitHub Pages. Astro Docs. Recuperado el 17 de noviembre de 2026.',
    html: 'Astro. (2026). <em>Deploy to GitHub Pages</em>. Astro Docs. Recuperado el 17 de noviembre de 2026.',
    title: 'Deploy to GitHub Pages',
    url: 'https://docs.astro.build/en/guides/deploy/github/',
    note: 'URL comprobada (HTTP 200) el 17 de noviembre de 2026.',
  },
  {
    id: 12,
    kind: 'web',
    short: 'GitHub, 2026',
    sortKey: 'GitHub',
    citation:
      'GitHub. (2026). Securing your GitHub Pages site with HTTPS. GitHub Docs. Recuperado el 17 de noviembre de 2026.',
    html: 'GitHub. (2026). <em>Securing your GitHub Pages site with HTTPS</em>. GitHub Docs. Recuperado el 17 de noviembre de 2026.',
    title: 'Securing your GitHub Pages site with HTTPS',
    url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https',
    note: 'URL comprobada (HTTP 200) el 17 de noviembre de 2026.',
  },
  {
    id: 13,
    kind: 'web',
    short: 'OWASP Foundation, s. f.',
    sortKey: 'OWASP Foundation',
    citation:
      'OWASP Foundation. (s. f.). OWASP secure headers project. Recuperado el 17 de noviembre de 2026.',
    html: 'OWASP Foundation. (s. f.). <em>OWASP secure headers project</em>. Recuperado el 17 de noviembre de 2026.',
    title: 'OWASP secure headers project',
    url: 'https://owasp.org/www-project-secure-headers/',
    note: 'Recurso sin fecha; URL comprobada (HTTP 200) el 17 de noviembre de 2026.',
  },
  {
    id: 14,
    kind: 'standard',
    short: 'Foudil y Shafranovich, 2022',
    sortKey: 'Foudil',
    citation:
      'Foudil, E., & Shafranovich, Y. (2022). A file format to aid in security vulnerability disclosure (RFC 9116). Internet Engineering Task Force.',
    html: 'Foudil, E., &amp; Shafranovich, Y. (2022). <em>A file format to aid in security vulnerability disclosure</em> (RFC 9116). Internet Engineering Task Force.',
    title: 'A file format to aid in security vulnerability disclosure',
    url: 'https://www.rfc-editor.org/rfc/rfc9116',
    note: 'RFC 9116 (abril de 2022); URL comprobada (HTTP 200).',
  },
];

export function referenceById(id: number): Reference | undefined {
  return references.find((reference) => reference.id === id);
}

export const referencesAlphabetical: Reference[] = [...references].sort((first, second) =>
  first.sortKey.localeCompare(second.sortKey, 'es')
);
