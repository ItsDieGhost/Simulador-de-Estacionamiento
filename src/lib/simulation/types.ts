export interface SimulationParams {
  /** Tasa media de llegadas, en vehículos por hora. */
  arrivalRate: number;
  /** Tiempo medio de estadía, en minutos. */
  meanStayMinutes: number;
  /** Número de plazas (servidores) del estacionamiento. */
  spaces: number;
  /** Cuántos vehículos pueden esperar fuera del estacionamiento. */
  queueCapacity: number;
  /** Horizonte simulado, en horas. */
  durationHours: number;
  /** Semilla del generador pseudoaleatorio. */
  seed: number;
  /** Fracción inicial descartada como calentamiento. */
  warmupFraction?: number;
}

export interface TheoryMetrics {
  /** Probabilidad de que una llegada encuentre el sistema lleno. */
  rejectionRate: number;
  /** Fracción media de plazas ocupadas. */
  occupancy: number;
  /** Número medio de vehículos esperando. */
  averageQueue: number;
  /** Número medio de vehículos en el sistema (plazas + cola). */
  averageInSystem: number;
  /** Espera media de los vehículos aceptados, en minutos. */
  averageWaitMinutes: number;
  /** Plazas ocupadas en promedio. */
  averageOccupiedSpaces: number;
}

export interface SimulationMetrics {
  arrivals: number;
  accepted: number;
  rejected: number;
  completed: number;
  rejectionRate: number;
  occupancy: number;
  averageQueue: number;
  maxQueue: number;
  averageWaitMinutes: number;
  averageInSystem: number;
  averageOccupiedSpaces: number;
  throughputPerHour: number;
  measuredHours: number;
  warmupHours: number;
}

export interface SeriesPoint {
  /** Inicio del intervalo, en horas desde el inicio de la simulación. */
  start: number;
  /** Fin del intervalo, en horas desde el inicio de la simulación. */
  end: number;
  /** Ocupación media del intervalo, como fracción de 0 a 1. */
  occupancy: number;
  /** Cola media del intervalo, en vehículos. */
  queue: number;
}

export interface SimulationResult {
  params: Required<Omit<SimulationParams, 'warmupFraction'>> & {
    warmupFraction: number;
    serviceRate: number;
    offeredLoad: number;
    capacity: number;
  };
  metrics: SimulationMetrics;
  theory: TheoryMetrics;
  series: SeriesPoint[];
}

export interface ValidationIssue {
  field: keyof SimulationParams;
  message: string;
}

export interface FieldBounds {
  min: number;
  max: number;
  step: number;
  integer: boolean;
}

export const FIELD_BOUNDS: Record<
  'arrivalRate' | 'meanStayMinutes' | 'spaces' | 'queueCapacity' | 'durationHours' | 'seed',
  FieldBounds
> = {
  arrivalRate: { min: 1, max: 240, step: 1, integer: false },
  meanStayMinutes: { min: 10, max: 720, step: 5, integer: false },
  spaces: { min: 1, max: 300, step: 1, integer: true },
  queueCapacity: { min: 0, max: 100, step: 1, integer: true },
  durationHours: { min: 1, max: 720, step: 1, integer: false },
  seed: { min: 0, max: 2_147_483_647, step: 1, integer: true },
};

export const DEFAULT_PARAMS: Required<SimulationParams> = {
  arrivalRate: 45,
  meanStayMinutes: 75,
  spaces: 60,
  queueCapacity: 10,
  durationHours: 24,
  seed: 99,
  warmupFraction: 0.15,
};

export const MAX_WAIT_SERIES_POINTS = 60;
