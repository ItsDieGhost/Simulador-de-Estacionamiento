import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const output = path.resolve('public', 'og-image.png');
await mkdir(path.dirname(output), { recursive: true });

const spots = Array.from({ length: 12 }, (_, index) => {
  const x = 758 + (index % 6) * 64;
  const y = 372 + Math.floor(index / 6) * 82;
  const busy = [0, 2, 3, 6, 7, 8, 10].includes(index);
  const accent = index === 4;
  return `<g>
    <rect x="${x}" y="${y}" width="44" height="58" rx="3" fill="${busy ? '#5ad7c2' : accent ? '#ffc400' : '#242d35'}" stroke="${busy ? '#5ad7c2' : accent ? '#ffc400' : '#7b8794'}" stroke-width="2"/>
    <rect x="${x + 8}" y="${y + 10}" width="28" height="12" rx="2" fill="${busy ? '#173a35' : '#0f1418'}" opacity="0.7"/>
    <rect x="${x + 8}" y="${y + 28}" width="28" height="12" rx="2" fill="${busy ? '#173a35' : '#0f1418'}" opacity="0.7"/>
  </g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#e9e6dd"/>
  <g stroke="#c9c3b6" stroke-width="1" opacity="0.7">
    ${Array.from({ length: 17 }, (_, i) => `<line x1="${i * 75}" y1="0" x2="${i * 75}" y2="630"/>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 75}" x2="1200" y2="${i * 75}"/>`).join('')}
  </g>
  <rect x="0" y="0" width="1200" height="18" fill="#ffc400"/>
  <g transform="translate(64 62)">
    <rect x="0" y="0" width="88" height="88" fill="#ffc400" stroke="#17191c" stroke-width="4"/>
    <text x="44" y="68" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-size="62" font-weight="700" fill="#17191c">M</text>
    <text x="112" y="40" font-family="Consolas, monospace" font-size="19" letter-spacing="4" fill="#5b6067">UNEFA TÁCHIRA</text>
    <text x="112" y="72" font-family="Arial, sans-serif" font-size="29" font-weight="700" fill="#17191c">Ingeniería de Sistemas</text>
  </g>
  <g font-family="Arial, sans-serif" fill="#17191c">
    <text x="64" y="250" font-size="91" font-weight="800" letter-spacing="-3">MYSPOT</text>
    <text x="66" y="305" font-family="Consolas, monospace" font-size="27" letter-spacing="3" fill="#383d44">SIMULADOR DE ESTACIONAMIENTO</text>
    <rect x="64" y="334" width="440" height="3" fill="#17191c"/>
    <text x="64" y="392" font-family="Consolas, monospace" font-size="24" fill="#383d44">M/M/c/K · Monte Carlo · Teoría de colas</text>
    <text x="64" y="432" font-family="Consolas, monospace" font-size="21" fill="#5b6067">Eventos discretos, semilla fija y métricas comparadas.</text>
  </g>
  <rect x="64" y="505" width="360" height="48" fill="#ffc400" stroke="#17191c" stroke-width="3"/>
  <text x="244" y="536" text-anchor="middle" font-family="Consolas, monospace" font-size="19" font-weight="700" letter-spacing="2" fill="#17191c">DIEGO ARBELÁEZ</text>
  <g>
    <rect x="690" y="205" width="450" height="380" fill="#151a1f" stroke="#17191c" stroke-width="4"/>
    <rect x="706" y="221" width="418" height="42" fill="#1d242b"/>
    <circle cx="728" cy="242" r="5" fill="#5ad7c2"/>
    <text x="744" y="248" font-family="Consolas, monospace" font-size="15" letter-spacing="2" fill="#aeb6c0">PANEL DE OCUPACIÓN</text>
    <text x="1096" y="248" text-anchor="end" font-family="Consolas, monospace" font-size="15" fill="#ffc400">64 %</text>
    <line x1="706" y1="287" x2="1124" y2="287" stroke="#39434d"/>
    <text x="716" y="326" font-family="Consolas, monospace" font-size="14" letter-spacing="1" fill="#aeb6c0">PLAZAS 01–12 / SECTOR A</text>
    ${spots}
    <line x1="706" y1="545" x2="1124" y2="545" stroke="#39434d"/>
    <text x="716" y="570" font-family="Consolas, monospace" font-size="14" fill="#aeb6c0">OCUPADAS 07 · LIBRES 04 · COLA 01</text>
  </g>
  <text x="1136" y="616" text-anchor="end" font-family="Consolas, monospace" font-size="14" fill="#5b6067">myspot / simulación educativa</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(output);
console.log(`Imagen Open Graph generada: ${path.relative(process.cwd(), output)} (1200×630).`);
