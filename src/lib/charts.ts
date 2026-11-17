import {
  formatInterval,
  formatMinutes,
  formatNumber,
  formatPercent,
} from './simulation/format';
import type { SeriesPoint, SimulationResult } from './simulation/types';

const WIDTH = 640;
const HEIGHT = 300;
const MARGIN = { top: 24, right: 18, bottom: 46, left: 64 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Coordenada SVG: siempre con punto decimal, nunca con coma. */
function pos(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function niceQueueMax(maxQueue: number): number {
  const candidate = Math.ceil(maxQueue / 2) * 2;
  return Math.max(2, candidate);
}

function hourLabel(hours: number): string {
  const digits = Number.isInteger(Math.round(hours * 10) / 10) ? 0 : 1;
  return `${formatNumber(hours, digits)} h`;
}

function xLabel(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0
    ? hourLabel(wholeHours)
    : `${formatNumber(wholeHours + minutes / 60, 1)} h`;
}

interface PlotGeometry {
  xFor: (hours: number) => number;
  yFor: (value: number) => number;
}

function geometry(maxValue: number, duration: number): PlotGeometry {
  return {
    xFor: (hours) => MARGIN.left + (clamp(hours, 0, duration) / duration) * PLOT_WIDTH,
    yFor: (value) => MARGIN.top + (1 - clamp(value, 0, maxValue) / maxValue) * PLOT_HEIGHT,
  };
}

function linePath(
  points: SeriesPoint[],
  plot: PlotGeometry,
  valueOf: (point: SeriesPoint) => number
): string {
  return points
    .map((point, index) => {
      const hours = (point.start + point.end) / 2;
      const x = plot.xFor(hours);
      const y = plot.yFor(valueOf(point));
      return `${index === 0 ? 'M' : 'L'}${pos(x)} ${pos(y)}`;
    })
    .join(' ');
}

function areaPath(
  points: SeriesPoint[],
  plot: PlotGeometry,
  valueOf: (point: SeriesPoint) => number,
  baseline: number
): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const startX = plot.xFor((first.start + first.end) / 2);
  const endX = plot.xFor((last.start + last.end) / 2);
  return `${linePath(points, plot, valueOf)} L${pos(endX)} ${pos(baseline)} L${pos(startX)} ${pos(baseline)} Z`;
}

function gridLines(
  ticks: number[],
  plot: PlotGeometry,
  axis: 'x' | 'y',
  formatter: (value: number) => string
): string {
  const labels: string[] = [];
  const lines: string[] = [];

  for (const tick of ticks) {
    if (axis === 'y') {
      const y = plot.yFor(tick);
      lines.push(
        `<line class="chart-grid-line" x1="${MARGIN.left}" y1="${pos(y)}" x2="${MARGIN.left + PLOT_WIDTH}" y2="${pos(y)}"/>`
      );
      labels.push(
        `<text class="chart-tick" x="${MARGIN.left - 10}" y="${pos(y + 5)}" text-anchor="end">${escapeXml(formatter(tick))}</text>`
      );
    } else {
      const x = plot.xFor(tick);
      lines.push(
        `<line class="chart-grid-line" x1="${pos(x)}" y1="${MARGIN.top}" x2="${pos(x)}" y2="${MARGIN.top + PLOT_HEIGHT}"/>`
      );
      labels.push(
        `<text class="chart-tick" x="${pos(x)}" y="${MARGIN.top + PLOT_HEIGHT + 26}" text-anchor="middle">${escapeXml(formatter(tick))}</text>`
      );
    }
  }

  return `<g aria-hidden="true">${lines.join('')}</g>${labels.join('')}`;
}

interface FrameArgs {
  label: string;
  description: string;
  plot: PlotGeometry;
  yTicks: number[];
  yFormatter: (value: number) => string;
  xTicks: number[];
  duration: number;
  warmupHours: number;
}

function frame(args: FrameArgs, body: string): string {
  const { label, description, plot, yTicks, yFormatter, xTicks, duration, warmupHours } = args;
  const warmupX = plot.xFor(warmupHours);
  const warmupWidth = warmupX - MARGIN.left;
  const warmup =
    warmupWidth > 8
      ? `<rect class="chart-warmup" x="${MARGIN.left}" y="${MARGIN.top}" width="${pos(warmupWidth)}" height="${PLOT_HEIGHT}"/>${
          warmupWidth > 86
            ? `<text class="chart-note" x="${MARGIN.left + 8}" y="${MARGIN.top + 17}">calentamiento</text>`
            : ''
        }`
      : '';

  return `<svg class="chart-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeXml(label)}" xmlns="http://www.w3.org/2000/svg" focusable="false">
<title>${escapeXml(label)}</title>
<desc>${escapeXml(description)}</desc>
<rect class="chart-plot-bg" x="${MARGIN.left}" y="${MARGIN.top}" width="${PLOT_WIDTH}" height="${PLOT_HEIGHT}"/>
${warmup}
${gridLines(yTicks, plot, 'y', yFormatter)}
${gridLines(xTicks, plot, 'x', xLabel)}
<line class="chart-axis" x1="${MARGIN.left}" y1="${MARGIN.top + PLOT_HEIGHT}" x2="${MARGIN.left + PLOT_WIDTH}" y2="${MARGIN.top + PLOT_HEIGHT}"/>
<text class="chart-axis-label" x="${MARGIN.left + PLOT_WIDTH}" y="${HEIGHT - 10}" text-anchor="end">horas desde el inicio · ${escapeXml(formatNumber(duration, 0))} h</text>
${body}
</svg>`;
}

function xTicksFor(duration: number): number[] {
  return [0, duration * 0.25, duration * 0.5, duration * 0.75, duration];
}

export function renderOccupancyChart(result: SimulationResult): string {
  const { series, params, metrics } = result;
  const maxOccupancy = series.reduce((max, point) => Math.max(max, point.occupancy), 0);
  const plot = geometry(1, params.durationHours);
  const meanY = plot.yFor(metrics.occupancy);
  const meanLabelY = meanY < MARGIN.top + 22 ? meanY + 17 : meanY - 7;
  const last = series[series.length - 1];
  const warmupHours = params.durationHours * params.warmupFraction;

  const body = `<path class="chart-area chart-area--occupancy" d="${areaPath(series, plot, (point) => point.occupancy, MARGIN.top + PLOT_HEIGHT)}"/>
<line class="chart-average" x1="${MARGIN.left}" y1="${pos(meanY)}" x2="${MARGIN.left + PLOT_WIDTH}" y2="${pos(meanY)}"/>
<text class="chart-note chart-note--right" x="${MARGIN.left + PLOT_WIDTH - 8}" y="${pos(meanLabelY)}" text-anchor="end">media ${escapeXml(formatPercent(metrics.occupancy))}</text>
<path class="chart-line chart-line--occupancy" d="${linePath(series, plot, (point) => point.occupancy)}"/>
${last ? `<circle class="chart-dot" cx="${pos(plot.xFor((last.start + last.end) / 2))}" cy="${pos(plot.yFor(last.occupancy))}" r="4"/>` : ''}`;

  return frame(
    {
      label: `Ocupación media por intervalo en un estacionamiento de ${params.spaces} plazas`,
      description: `Serie temporal de ocupación. Media ${formatPercent(metrics.occupancy)}; pico por intervalo ${formatPercent(maxOccupancy)}. La franja inicial corresponde a ${formatMinutes(params.durationHours * params.warmupFraction * 60)} de calentamiento, excluidos de las métricas.`,
      plot,
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      yFormatter: (value) => formatPercent(value, 0),
      xTicks: xTicksFor(params.durationHours),
      duration: params.durationHours,
      warmupHours,
    },
    body
  );
}

export function renderQueueChart(result: SimulationResult): string {
  const { series, params, metrics } = result;
  const observedMax = series.reduce((max, point) => Math.max(max, point.queue), metrics.maxQueue);
  const maxQueue = niceQueueMax(observedMax);
  const plot = geometry(maxQueue, params.durationHours);
  const meanY = plot.yFor(metrics.averageQueue);
  const meanLabelY = meanY < MARGIN.top + 22 ? meanY + 17 : meanY - 7;
  const last = series[series.length - 1];
  const warmupHours = params.durationHours * params.warmupFraction;

  const body = `<path class="chart-area chart-area--queue" d="${areaPath(series, plot, (point) => point.queue, MARGIN.top + PLOT_HEIGHT)}"/>
<line class="chart-average" x1="${MARGIN.left}" y1="${pos(meanY)}" x2="${MARGIN.left + PLOT_WIDTH}" y2="${pos(meanY)}"/>
<text class="chart-note chart-note--right" x="${MARGIN.left + PLOT_WIDTH - 8}" y="${pos(meanLabelY)}" text-anchor="end">media ${escapeXml(formatNumber(metrics.averageQueue))} veh</text>
<path class="chart-line chart-line--queue" d="${linePath(series, plot, (point) => point.queue)}"/>
${last ? `<circle class="chart-dot chart-dot--queue" cx="${pos(plot.xFor((last.start + last.end) / 2))}" cy="${pos(plot.yFor(last.queue))}" r="4"/>` : ''}`;

  const yStep = maxQueue / 4;
  return frame(
    {
      label: `Longitud media de la cola por intervalo en un estacionamiento de ${params.spaces} plazas`,
      description: `Serie temporal de la cola. Media ${formatNumber(metrics.averageQueue)} vehículos; máximo ${formatNumber(metrics.maxQueue, 0)}. La franja inicial corresponde a ${formatMinutes(params.durationHours * params.warmupFraction * 60)} de calentamiento, excluidos de las métricas.`,
      plot,
      yTicks: [0, yStep, yStep * 2, yStep * 3, maxQueue],
      yFormatter: (value) => formatNumber(value, Number.isInteger(value) ? 0 : 1),
      xTicks: xTicksFor(params.durationHours),
      duration: params.durationHours,
      warmupHours,
    },
    body
  );
}

export function renderSeriesTable(result: SimulationResult): string {
  const rows = result.series
    .map((point) => {
      const occupancy = formatPercent(point.occupancy);
      const queue = formatNumber(point.queue);
      return `<tr><th scope="row">${escapeXml(formatInterval(point.start, point.end))}</th><td>${occupancy}</td><td>${queue}</td></tr>`;
    })
    .join('');

  const binMinutes = (result.metrics.measuredHours / Math.max(result.series.length, 1)) * 60;

  return `<table class="data-table chart-table">
<caption>Datos de las gráficas. Intervalos de ${formatNumber(binMinutes, 0)} minutos; el calentamiento inicial (${formatMinutes(result.params.durationHours * result.params.warmupFraction * 60)}) está excluido.</caption>
<thead><tr><th scope="col">Intervalo</th><th scope="col">Ocupación media</th><th scope="col">Cola media</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

