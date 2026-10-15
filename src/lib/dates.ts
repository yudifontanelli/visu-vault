/**
 * Calendar-date helpers. Dates are stored as 'YYYY-MM-DD' strings and computed
 * in UTC, so day differences never drift with daylight-saving changes.
 */

export type ISODate = string;

const DAY = 86_400_000;

export const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

function parse(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const t = new Date(parse(iso) + days * DAY);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, '0');
  const d = String(t.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parse(to) - parse(from)) / DAY);
}

/** "15 OUT" */
export function formatShort(iso: ISODate): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1].slice(0, 3).toUpperCase()}`;
}

/** "15 de outubro de 2026" */
export function formatLong(iso: ISODate): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** "QUA · 15 OUT 2026" */
export function formatFolio(iso: ISODate): string {
  const [y] = iso.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(parse(iso)).getUTCDay()];
  return `${weekday} · ${formatShort(iso)} ${y}`;
}

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function roman(n: number): string {
  let out = '';
  let rest = Math.max(0, Math.floor(n));
  for (const [v, s] of ROMAN) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}

/** "em 3 dias", "hoje", "há 2 dias" — relative to `today`. */
export function relativeDays(iso: ISODate, today: ISODate): string {
  const n = daysBetween(today, iso);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  if (n === -1) return 'ontem';
  return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
}
