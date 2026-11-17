import { formatInteger, formatMinutes, formatNumber, formatPercent, formatSigned } from './format';
import type { SimulationResult } from './types';

type Reading = 'close' | 'fair' | 'far';

const readingLabels: Record<Reading, string> = {
  close: 'cerca',
  fair: 'aceptable',
  far: 'lejos',
};

function readingForAbs(difference: number, closeLimit: number, fairLimit: number): Reading {
  if (difference <= closeLimit) return 'close';
  if (difference <= fairLimit) return 'fair';
  return 'far';
}

function readingCell(reading: Reading): string {
  return `<td class="reading reading--${reading}">${readingLabels[reading]}</td>`;
}

export function describeResult(result: SimulationResult): string {
  const { params, metrics } = result;
  const duration = formatNumber(params.durationHours, 0);
  const measured = formatNumber(metrics.measuredHours, 1);
  const arrivals = formatInteger(metrics.arrivals);

  if (metrics.arrivals === 0) {
    return `La corrida de <strong>${duration}\u00a0h</strong> no registró llegadas en la ventana medida de <strong>${measured}\u00a0h</strong>. Aumenta la tasa de llegadas o el horizonte para obtener una muestra.`;
  }

  return `La corrida de <strong>${duration}\u00a0h</strong> midió <strong>${measured}\u00a0h</strong> tras descartar el calentamiento. Con <strong>${params.spaces} plazas</strong> y <strong>${params.queueCapacity} puestos de espera</strong>, se registraron <strong>${arrivals} llegadas</strong> y se rechazó el <strong>${formatPercent(metrics.rejectionRate)}</strong>. La ocupación media fue <strong>${formatPercent(metrics.occupancy)}</strong>, la cola media <strong>${formatNumber(metrics.averageQueue)} vehículos</strong> y la espera media de los aceptados <strong>${formatMinutes(metrics.averageWaitMinutes)}</strong>.`;
}

export function renderComparisonTable(result: SimulationResult): string {
  const { metrics, theory, params } = result;
  const occupancyDifference = (metrics.occupancy - theory.occupancy) * 100;
  const rejectionDifference = (metrics.rejectionRate - theory.rejectionRate) * 100;
  const queueDifference = metrics.averageQueue - theory.averageQueue;
  const waitDifference = metrics.averageWaitMinutes - theory.averageWaitMinutes;

  const occupancyReading = readingForAbs(Math.abs(occupancyDifference), 2, 5);
  const rejectionReading = readingForAbs(Math.abs(rejectionDifference), 2, 5);
  const queueReading = readingForAbs(Math.abs(queueDifference), 0.5, 1.5);
  const waitReading = readingForAbs(Math.abs(waitDifference), 1, 3);

  return `<table class="data-table sim-table">
<caption>Teoría M/M/c/K frente a una corrida de ${formatNumber(params.durationHours, 0)}\u00a0h con semilla ${params.seed}. La teoría es el valor de largo plazo; la simulación, una realización finita.</caption>
<thead><tr><th scope="col">Métrica</th><th scope="col">Teoría</th><th scope="col">Simulación</th><th scope="col">Diferencia</th><th scope="col">Lectura</th></tr></thead>
<tbody>
<tr><th scope="row">Ocupación media</th><td class="num">${formatPercent(theory.occupancy)}</td><td class="num">${formatPercent(metrics.occupancy)}</td><td class="num">${formatSigned(occupancyDifference, 1, '\u00a0pp')}</td>${readingCell(occupancyReading)}</tr>
<tr><th scope="row">Tasa de rechazo</th><td class="num">${formatPercent(theory.rejectionRate)}</td><td class="num">${formatPercent(metrics.rejectionRate)}</td><td class="num">${formatSigned(rejectionDifference, 1, '\u00a0pp')}</td>${readingCell(rejectionReading)}</tr>
<tr><th scope="row">Cola media</th><td class="num">${formatNumber(theory.averageQueue)} veh</td><td class="num">${formatNumber(metrics.averageQueue)} veh</td><td class="num">${formatSigned(queueDifference, 1, '\u00a0veh')}</td>${readingCell(queueReading)}</tr>
<tr><th scope="row">Espera media</th><td class="num">${formatMinutes(theory.averageWaitMinutes)}</td><td class="num">${formatMinutes(metrics.averageWaitMinutes)}</td><td class="num">${formatSigned(waitDifference, 1, '\u00a0min')}</td>${readingCell(waitReading)}</tr>
</tbody>
</table>`;
}
