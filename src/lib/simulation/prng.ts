export interface RandomSource {
  nextUint32(): number;
  nextFloat(): number;
}

/**
 * Generador determinista de 32 bits (mulberry32). La misma semilla produce
 * exactamente la misma secuencia en cualquier motor de JavaScript.
 */
export function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };

  return {
    nextUint32,
    nextFloat(): number {
      return (nextUint32() + 0.5) / 4_294_967_296;
    },
  };
}

/** Intervalo exponencial con media 1 / rate. */
export function sampleExponential(random: RandomSource, rate: number): number {
  if (!(rate > 0) || !Number.isFinite(rate)) {
    throw new RangeError('La tasa debe ser un número positivo y finito.');
  }
  return -Math.log(1 - random.nextFloat()) / rate;
}
