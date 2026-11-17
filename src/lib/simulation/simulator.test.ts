import { describe, expect, it } from 'vitest';
import { erlangB } from './theory';
import { normalizeSimulationParams, simulate, validateSimulationParams } from './simulator';
import { createRandomSource, sampleExponential } from './prng';
import type { SimulationParams } from './types';

const stableScenario: Partial<SimulationParams> = {
  arrivalRate: 18,
  meanStayMinutes: 60,
  spaces: 20,
  queueCapacity: 5,
  durationHours: 720,
  seed: 2026,
  warmupFraction: 0.1,
};

describe('generador pseudoaleatorio', () => {
  it('es determinista y produce valores en [0, 1)', () => {
    const first = createRandomSource(12345);
    const second = createRandomSource(12345);
    for (let index = 0; index < 10_000; index += 1) {
      const value = first.nextFloat();
      expect(value).toBe(second.nextFloat());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('genera exponenciales positivas con la media solicitada', () => {
    const random = createRandomSource(7);
    const samples = Array.from({ length: 50_000 }, () => sampleExponential(random, 2));
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    expect(Math.min(...samples)).toBeGreaterThan(0);
    expect(mean).toBeCloseTo(0.5, 1);
  });
});

describe('validación de parámetros', () => {
  it('acepta los valores por defecto', () => {
    expect(validateSimulationParams(normalizeSimulationParams())).toEqual([]);
  });

  it('rechaza plazas no enteras, valores fuera de rango y semillas negativas', () => {
    const issues = validateSimulationParams({
      arrivalRate: 0,
      meanStayMinutes: 10,
      spaces: 2.5,
      queueCapacity: -1,
      durationHours: 24,
      seed: -4,
    });
    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['arrivalRate', 'spaces', 'queueCapacity', 'seed'])
    );
  });

  it('normaliza con los valores por defecto sin mutar la entrada', () => {
    const partial: Partial<SimulationParams> = { spaces: 12 };
    const normalized = normalizeSimulationParams(partial);
    expect(normalized.spaces).toBe(12);
    expect(normalized.arrivalRate).toBe(45);
    expect(partial.spaces).toBe(12);
  });
});

describe('simulación M/M/c/K', () => {
  it('es determinista para la misma semilla', () => {
    const first = simulate(stableScenario);
    const second = simulate(stableScenario);
    expect(second).toEqual(first);
  });

  it('cambia la realización al cambiar la semilla', () => {
    const first = simulate(stableScenario);
    const second = simulate({ ...stableScenario, seed: 2027 });
    expect(second.metrics.rejectionRate).not.toBe(first.metrics.rejectionRate);
  });

  it('conserva el flujo de vehículos y los límites físicos', () => {
    const result = simulate(stableScenario);
    const { metrics } = result;
    expect(metrics.accepted + metrics.rejected).toBe(metrics.arrivals);
    expect(metrics.occupancy).toBeGreaterThanOrEqual(0);
    expect(metrics.occupancy).toBeLessThanOrEqual(1);
    expect(metrics.averageQueue).toBeGreaterThanOrEqual(0);
    expect(metrics.maxQueue).toBeGreaterThanOrEqual(metrics.averageQueue);
    expect(metrics.averageInSystem).toBeCloseTo(
      metrics.averageOccupiedSpaces + metrics.averageQueue,
      10
    );
  });

  it('se aproxima a la teoría M/M/c/K en una corrida larga', () => {
    const result = simulate(stableScenario);
    const { metrics, theory } = result;
    expect(metrics.rejectionRate).toBeCloseTo(theory.rejectionRate, 2);
    expect(metrics.occupancy).toBeCloseTo(theory.occupancy, 2);
    expect(metrics.averageQueue).toBeCloseTo(theory.averageQueue, 0);
    expect(metrics.averageWaitMinutes).toBeCloseTo(theory.averageWaitMinutes, -1);
  });

  it('coincide con Erlang B cuando no hay cola', () => {
    const params: Partial<SimulationParams> = {
      arrivalRate: 3,
      meanStayMinutes: 30,
      spaces: 5,
      queueCapacity: 0,
      durationHours: 720,
      seed: 99,
      warmupFraction: 0.1,
    };
    const result = simulate(params);
    expect(result.metrics.averageQueue).toBe(0);
    expect(result.metrics.rejectionRate).toBeCloseTo(erlangB(1.5, 5), 2);
    expect(result.theory.rejectionRate).toBeCloseTo(erlangB(1.5, 5), 10);
  });

  it('excluye el calentamiento de series y métricas', () => {
    const result = simulate({ durationHours: 10, warmupFraction: 0.2, spaces: 10, queueCapacity: 2 });
    expect(result.metrics.warmupHours).toBeCloseTo(2, 10);
    expect(result.metrics.measuredHours).toBeCloseTo(8, 10);
    expect(result.series[0]?.start).toBeCloseTo(2, 10);
    expect(result.series[result.series.length - 1]?.end).toBeCloseTo(10, 10);
    expect(result.series.length).toBeGreaterThanOrEqual(12);
    expect(result.series.length).toBeLessThanOrEqual(60);
  });

  it('publica métricas coherentes con las plazas y la cola', () => {
    const result = simulate({
      arrivalRate: 60,
      meanStayMinutes: 120,
      spaces: 40,
      queueCapacity: 0,
      durationHours: 100,
      seed: 3,
    });
    expect(result.params.capacity).toBe(40);
    expect(result.params.offeredLoad).toBeCloseTo(120, 10);
    expect(result.metrics.occupancy).toBeLessThanOrEqual(1);
    expect(result.metrics.averageQueue).toBe(0);
    expect(result.metrics.rejectionRate).toBeGreaterThan(0);
    expect(result.theory.averageQueue).toBe(0);
  });
});

describe('fórmula de Erlang B', () => {
  it('reproduce valores conocidos', () => {
    expect(erlangB(1, 1)).toBeCloseTo(0.5, 10);
    expect(erlangB(2, 2)).toBeCloseTo(0.4, 10);
    expect(erlangB(0, 4)).toBe(0);
  });

  it('rechaza entradas inválidas', () => {
    expect(() => erlangB(1, 0)).toThrow(RangeError);
    expect(() => erlangB(-1, 2)).toThrow(RangeError);
  });
});
