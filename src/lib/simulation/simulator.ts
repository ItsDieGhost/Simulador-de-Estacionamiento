import { sampleExponential, createRandomSource } from './prng';
import { computeStateProbabilities, computeTheoryMetrics } from './theory';
import {
  DEFAULT_PARAMS,
  FIELD_BOUNDS,
  MAX_WAIT_SERIES_POINTS,
  type SimulationMetrics,
  type SimulationParams,
  type SimulationResult,
  type SeriesPoint,
  type ValidationIssue,
} from './types';

class TimeHeap {
  private data: number[] = [];

  get size(): number {
    return this.data.length;
  }

  peek(): number | undefined {
    return this.data[0];
  }

  push(value: number): void {
    const data = this.data;
    data.push(value);
    let index = data.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      const parentValue = data[parent];
      if (parentValue === undefined || parentValue <= value) break;
      data[index] = parentValue;
      index = parent;
    }
    data[index] = value;
  }

  pop(): number | undefined {
    const data = this.data;
    if (data.length === 0) return undefined;
    const root = data[0];
    const last = data.pop();
    if (data.length === 0 || last === undefined) return root;

    let index = 0;
    const length = data.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= length) break;

      let child = left;
      const leftValue = data[left] ?? Number.POSITIVE_INFINITY;
      const rightValue = data[right] ?? Number.POSITIVE_INFINITY;
      if (right < length && rightValue < leftValue) child = right;

      const childValue = data[child];
      if (childValue === undefined || childValue >= last) break;

      data[index] = childValue;
      index = child;
    }
    data[index] = last;
    return root;
  }
}

export function validateSimulationParams(input: Partial<SimulationParams>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [field, bounds] of Object.entries(FIELD_BOUNDS) as [
    keyof typeof FIELD_BOUNDS,
    (typeof FIELD_BOUNDS)[keyof typeof FIELD_BOUNDS],
  ][]) {
    const value = input[field];
    if (value === undefined) {
      issues.push({ field, message: 'Falta este valor.' });
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      issues.push({ field, message: 'Debe ser un número finito.' });
      continue;
    }
    if (bounds.integer && !Number.isInteger(value)) {
      issues.push({ field, message: 'Debe ser un número entero.' });
      continue;
    }
    if (value < bounds.min || value > bounds.max) {
      issues.push({
        field,
        message: `Debe estar entre ${bounds.min} y ${bounds.max}.`,
      });
    }
  }

  if (input.warmupFraction !== undefined) {
    if (
      !Number.isFinite(input.warmupFraction) ||
      input.warmupFraction < 0 ||
      input.warmupFraction >= 0.5
    ) {
      issues.push({
        field: 'warmupFraction',
        message: 'El calentamiento debe estar entre 0 y 0,5.',
      });
    }
  }

  return issues;
}

export function normalizeSimulationParams(
  partial: Partial<SimulationParams> = {}
): Required<SimulationParams> {
  const merged: Required<SimulationParams> = {
    ...DEFAULT_PARAMS,
    ...partial,
    warmupFraction: partial.warmupFraction ?? DEFAULT_PARAMS.warmupFraction,
  };
  const issues = validateSimulationParams(merged);
  if (issues.length > 0) {
    throw new RangeError(`Parámetros inválidos: ${issues.map((issue) => issue.message).join(' ')}`);
  }
  return merged;
}

interface Bin {
  occupiedArea: number;
  queueArea: number;
}

export function simulate(input: Partial<SimulationParams> = {}): SimulationResult {
  const params = normalizeSimulationParams(input);
  const random = createRandomSource(params.seed);
  const serviceRate = 60 / params.meanStayMinutes;
  const capacity = params.spaces + params.queueCapacity;
  const warmupHours = params.durationHours * params.warmupFraction;
  const measuredHours = params.durationHours - warmupHours;

  if (!(measuredHours > 0)) {
    throw new RangeError('La ventana de medición debe ser mayor que cero.');
  }

  const binCount = Math.min(
    MAX_WAIT_SERIES_POINTS,
    Math.max(12, Math.round(measuredHours))
  );
  const binWidth = measuredHours / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, () => ({
    occupiedArea: 0,
    queueArea: 0,
  }));

  const departures = new TimeHeap();
  const waiting: number[] = [];
  const nextServiceTime = (): number => sampleExponential(random, serviceRate);

  let currentTime = 0;
  let nextArrival = sampleExponential(random, params.arrivalRate);

  let occupied = 0;
  let measuredArrivals = 0;
  let measuredAccepted = 0;
  let measuredRejected = 0;
  let measuredCompleted = 0;
  let measuredMaxQueue = 0;
  let waitSum = 0;

  let occupiedArea = 0;
  let queueArea = 0;
  let queueLength = 0;

  const accumulateBins = (from: number, to: number): void => {
    let cursor = from;
    while (cursor < to - 1e-12) {
      const index = Math.min(
        binCount - 1,
        Math.max(0, Math.floor((cursor - warmupHours) / binWidth))
      );
      const bin = bins[index];
      const binEnd = warmupHours + (index + 1) * binWidth;
      const end = Math.min(to, binEnd);
      if (bin === undefined || !(end > cursor)) break;
      bin.occupiedArea += occupied * (end - cursor);
      bin.queueArea += queueLength * (end - cursor);
      cursor = end;
    }
  };

  const accumulate = (from: number, to: number): void => {
    if (!(to > from)) return;
    const measuredFrom = Math.max(from, warmupHours);
    if (to <= measuredFrom) return;
    occupiedArea += occupied * (to - measuredFrom);
    queueArea += queueLength * (to - measuredFrom);
    accumulateBins(measuredFrom, to);
  };

  while (currentTime < params.durationHours) {
    const nextDeparture = departures.peek();
    const departureFirst =
      nextDeparture !== undefined && nextDeparture <= nextArrival && nextDeparture <= params.durationHours;
    const eventTime = departureFirst
      ? (nextDeparture as number)
      : Math.min(nextArrival, params.durationHours);

    if (eventTime > params.durationHours) break;

    accumulate(currentTime, eventTime);
    currentTime = eventTime;

    if (departureFirst) {
      departures.pop();
      currentTime = Math.max(currentTime, nextDeparture as number);
      occupied -= 1;
      if (currentTime >= warmupHours) {
        measuredCompleted += 1;
      }

      const nextInLine = waiting.shift();
      if (nextInLine !== undefined) {
        const waitHours = Math.max(0, currentTime - nextInLine);
        if (currentTime >= warmupHours && nextInLine >= warmupHours - 1e-9) {
          waitSum += waitHours;
        }
        occupied += 1;
        queueLength = waiting.length;
        departures.push(currentTime + nextServiceTime());
      }
      continue;
    }

    if (nextArrival > params.durationHours) break;

    currentTime = Math.max(currentTime, nextArrival);
    if (currentTime >= warmupHours) {
      measuredArrivals += 1;
    }

    if (occupied < params.spaces) {
      occupied += 1;
      if (currentTime >= warmupHours) {
        measuredAccepted += 1;
      }
      departures.push(currentTime + nextServiceTime());
    } else if (queueLength < params.queueCapacity) {
      waiting.push(currentTime);
      queueLength = waiting.length;
      if (currentTime >= warmupHours) {
        measuredAccepted += 1;
        measuredMaxQueue = Math.max(measuredMaxQueue, queueLength);
      }
    } else {
      if (currentTime >= warmupHours) {
        measuredRejected += 1;
      }
    }

    nextArrival = currentTime + sampleExponential(random, params.arrivalRate);
  }

  accumulate(currentTime, params.durationHours);

  const series: SeriesPoint[] = bins.map((bin, index) => {
    const start = warmupHours + index * binWidth;
    return {
      start,
      end: start + binWidth,
      occupancy: params.spaces > 0 ? bin.occupiedArea / binWidth / params.spaces : 0,
      queue: bin.queueArea / binWidth,
    };
  });

  const averageOccupiedSpaces = occupiedArea / measuredHours;
  const averageQueue = queueArea / measuredHours;

  const metrics: SimulationMetrics = {
    arrivals: measuredArrivals,
    accepted: measuredAccepted,
    rejected: measuredRejected,
    completed: measuredCompleted,
    rejectionRate: measuredArrivals > 0 ? measuredRejected / measuredArrivals : 0,
    occupancy: params.spaces > 0 ? averageOccupiedSpaces / params.spaces : 0,
    averageQueue,
    maxQueue: measuredMaxQueue,
    averageWaitMinutes: measuredAccepted > 0 ? (waitSum / measuredAccepted) * 60 : 0,
    averageInSystem: averageOccupiedSpaces + averageQueue,
    averageOccupiedSpaces,
    throughputPerHour: measuredCompleted / measuredHours,
    measuredHours,
    warmupHours,
  };

  const distribution = computeStateProbabilities(params);
  const theory = computeTheoryMetrics(params);

  return {
    params: {
      ...params,
      serviceRate,
      offeredLoad: distribution.offeredLoad,
      capacity,
    },
    metrics,
    theory,
    series,
  };
}
