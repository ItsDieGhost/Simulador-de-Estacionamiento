const decimalFormats = new Map<number, Intl.NumberFormat>();

function decimalFormat(digits: number): Intl.NumberFormat {
  const cached = decimalFormats.get(digits);
  if (cached) return cached;
  const format = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  decimalFormats.set(digits, format);
  return format;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return decimalFormat(digits).format(value);
}

export function formatInteger(value: number): string {
  return formatNumber(value, 0);
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${formatNumber(fraction * 100, digits)}\u00a0%`;
}

export function formatMinutes(minutes: number, digits = 1): string {
  return `${formatNumber(minutes, digits)}\u00a0min`;
}

export function formatRate(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}\u00a0veh/h`;
}

export function formatHours(hours: number, digits = 1): string {
  return `${formatNumber(hours, digits)}\u00a0h`;
}

export function formatSigned(value: number, digits = 1, suffix = ''): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${formatNumber(Math.abs(value), digits)}${suffix}`;
}

export function formatClock(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${formatInteger(wholeHours)}:${minutes.toString().padStart(2, '0')}`;
}

export function formatInterval(start: number, end: number): string {
  return `${formatClock(start)}–${formatClock(end)}`;
}

export function formatDuration(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  if (Number.isInteger(rounded)) return `${formatInteger(rounded)}\u00a0h`;
  return `${formatNumber(rounded, 1)}\u00a0h`;
}
