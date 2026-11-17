import type { SimulationParams, TheoryMetrics } from './types';

export interface TheoryDistribution {
  probabilities: number[];
  offeredLoad: number;
  capacity: number;
  serviceRate: number;
}

/**
 * Distribución estacionaria de un sistema M/M/c/K, donde K = c + cola.
 * Se calcula con probabilidades sin normalizar para evitar desbordamientos
 * incluso con cargas ofrecidas altas.
 */
export function computeStateProbabilities(params: SimulationParams): TheoryDistribution {
  const spaces = params.spaces;
  const queueCapacity = params.queueCapacity;
  const capacity = spaces + queueCapacity;
  const serviceRate = 60 / params.meanStayMinutes;
  const offeredLoad = params.arrivalRate / serviceRate;

  if (!(spaces >= 1) || !(queueCapacity >= 0)) {
    throw new RangeError('El número de plazas debe ser mayor que cero.');
  }

  const unnormalized = new Array<number>(capacity + 1).fill(0);
  unnormalized[0] = 1;

  for (let n = 1; n <= capacity; n += 1) {
    const previous = unnormalized[n - 1] ?? 0;
    unnormalized[n] = previous * (offeredLoad / Math.min(n, spaces));
  }

  const total = unnormalized.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new RangeError('No se pudo normalizar la distribución teórica.');
  }

  return {
    probabilities: unnormalized.map((value) => value / total),
    offeredLoad,
    capacity,
    serviceRate,
  };
}

export function computeTheoryMetrics(params: SimulationParams): TheoryMetrics {
  const { probabilities, capacity } = computeStateProbabilities(params);
  const spaces = params.spaces;

  let averageInSystem = 0;
  let averageQueue = 0;
  let averageOccupiedSpaces = 0;

  for (let n = 0; n <= capacity; n += 1) {
    const probability = probabilities[n] ?? 0;
    averageInSystem += n * probability;
    averageQueue += Math.max(0, n - spaces) * probability;
    averageOccupiedSpaces += Math.min(n, spaces) * probability;
  }

  const rejectionRate = probabilities[capacity] ?? 0;

  const effectiveArrivalRate = params.arrivalRate * (1 - rejectionRate);
  const averageWaitHours = effectiveArrivalRate > 0 ? averageQueue / effectiveArrivalRate : 0;

  return {
    rejectionRate,
    occupancy: averageOccupiedSpaces / spaces,
    averageQueue,
    averageInSystem,
    averageWaitMinutes: averageWaitHours * 60,
    averageOccupiedSpaces,
  };
}

/**
 * Fórmula de pérdidas de Erlang B, caso particular M/M/c/c (sin cola).
 * Se incluye como referencia y comprobación cruzada.
 */
export function erlangB(offeredLoad: number, servers: number): number {
  if (!(servers >= 1)) {
    throw new RangeError('El número de servidores debe ser al menos 1.');
  }
  if (offeredLoad < 0) {
    throw new RangeError('La carga ofrecida no puede ser negativa.');
  }

  let blocking = 1;
  for (let n = 1; n <= servers; n += 1) {
    blocking = (offeredLoad * blocking) / (n + offeredLoad * blocking);
  }
  return blocking;
}

export function equilibriumOfferedLoad(params: SimulationParams): number {
  const serviceRate = 60 / params.meanStayMinutes;
  return params.arrivalRate / serviceRate;
}
