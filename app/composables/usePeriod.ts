// The period every chart below the filter row aggregates. Lives in the URL
// (?from&to&compare) so a view can be shared as a link.

export type PresetKey = 'last-month' | 'month-to-date' | 'last-30' | 'last-90' | 'custom'

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** Today in Sao Paulo, as YYYY-MM-DD. The data is labelled with that clock. */
export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

function addDays(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

function presetRange(key: Exclude<PresetKey, 'custom'>): { from: string, to: string } {
  const today = todayInSaoPaulo()
  const yesterday = addDays(today, -1) // the newest day that can be collected
  const firstOfMonth = `${today.slice(0, 8)}01`
  switch (key) {
    case 'last-month': {
      const to = addDays(firstOfMonth, -1)
      return { from: `${to.slice(0, 8)}01`, to }
    }
    case 'month-to-date':
      return firstOfMonth > yesterday ? presetRange('last-month') : { from: firstOfMonth, to: yesterday }
    case 'last-30':
      return { from: addDays(yesterday, -29), to: yesterday }
    case 'last-90':
      return { from: addDays(yesterday, -89), to: yesterday }
  }
}

export const PRESETS: { key: Exclude<PresetKey, 'custom'>, label: string }[] = [
  { key: 'last-month', label: 'Mês passado' },
  { key: 'month-to-date', label: 'Mês atual até ontem' },
  { key: 'last-30', label: 'Últimos 30 dias' },
  { key: 'last-90', label: 'Últimos 90 dias' }
]

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function usePeriod() {
  const route = useRoute()
  const router = useRouter()

  const range = computed(() => {
    const from = String(route.query.from ?? '')
    const to = String(route.query.to ?? '')
    return ISO.test(from) && ISO.test(to) && from <= to ? { from, to } : presetRange('last-month')
  })

  const preset = computed<PresetKey>(() => {
    const match = PRESETS.find(({ key }) => {
      const candidate = presetRange(key)
      return candidate.from === range.value.from && candidate.to === range.value.to
    })
    return match?.key ?? 'custom'
  })

  const compare = computed(() => route.query.compare !== '0')

  const label = computed(() => {
    const { from, to } = range.value
    const lastDay = addDays(`${addDays(`${from.slice(0, 8)}28`, 4).slice(0, 8)}01`, -1)
    if (from.endsWith('-01') && to === lastDay) {
      const month = MONTHS[Number(from.slice(5, 7)) - 1]!
      return `${month.charAt(0).toUpperCase()}${month.slice(1)} de ${from.slice(0, 4)}`
    }
    return formatPeriod(from, to)
  })

  function update(query: Record<string, string>) {
    router.replace({ query: { ...route.query, ...query } })
  }

  return {
    from: computed(() => range.value.from),
    to: computed(() => range.value.to),
    preset,
    compare,
    label,
    query: computed(() => ({ from: range.value.from, to: range.value.to })),
    setPreset: (key: Exclude<PresetKey, 'custom'>) => update(presetRange(key)),
    setRange: (from: string, to: string) => update({ from, to }),
    setCompare: (value: boolean) => update({ compare: value ? '1' : '0' })
  }
}
