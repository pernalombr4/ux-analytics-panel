const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const twoDecimals = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export type ValueFormat = 'int' | 'decimal' | 'pct' | 'seconds' | 'score' | 'raw'

const DASH = '–'

export function formatValue(value: number | null | undefined, format: ValueFormat): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH
  switch (format) {
    case 'int': return integer.format(value)
    case 'decimal': return decimal.format(value)
    case 'pct': return `${decimal.format(value)}%`
    case 'seconds': return formatDuration(value)
    case 'score': return twoDecimals.format(value)
    default: return String(value)
  }
}

/** 472 -> "7 min 52 s", 0.39 -> "390 ms". Decimals only below 10 s. */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return `${integer.format(seconds * 1000)} ms`
  if (seconds < 10) return `${decimal.format(seconds)} s`
  if (seconds < 60) return `${integer.format(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds - minutes * 60)
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

/** The format that fits a deep metric's base unit. */
export function formatForUnit(unit: string): ValueFormat {
  switch (unit) {
    case 'pct': return 'pct'
    case 'seconds': return 'seconds'
    case 'score': return 'score'
    default: return 'int'
  }
}

/** '2026-09-30' -> '30/09/2026'. Built by hand: a Date would shift the day. */
export function formatDay(day: string, withYear = true): string {
  const [year, month, date] = day.split('-')
  return withYear ? `${date}/${month}/${year}` : `${date}/${month}`
}

export function formatPeriod(from: string, to: string): string {
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${formatDay(from, !sameYear)} – ${formatDay(to)}`
}
