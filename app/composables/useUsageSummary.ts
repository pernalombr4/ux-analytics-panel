import type { Ref } from 'vue'
import type { PageStat } from '~/components/PageStats.vue'

// The Clarity side of a period: the stat cards and the friction chart, shared
// by the Panorama and the usage overview.
const STATS = [
  { key: 'sessions', label: 'Sessões', icon: 'i-lucide-activity', format: 'int', direction: 'higher', note: 'Soma dos dias coletados.' },
  { key: 'avg_daily_users', label: 'Usuários por dia', icon: 'i-lucide-users', format: 'decimal', direction: 'higher', note: 'Média diária: usuários não se somam entre dias.' },
  { key: 'pages_per_session', label: 'Páginas por sessão', icon: 'i-lucide-layers', format: 'decimal', direction: 'neutral', note: 'Média do período. Mais não é melhor nem pior.' },
  { key: 'time_active_avg_seconds', label: 'Tempo ativo médio', icon: 'i-lucide-timer', format: 'seconds', direction: 'neutral', note: 'Por sessão, só o tempo com interação.' }
] as const

export const frictionColumns: DataColumn<BarRow>[] = [
  { key: 'label', label: 'Atrito' },
  { key: 'now', label: '% sessões', text: row => formatValue(row.values[0] ?? null, 'pct') },
  { key: 'before', label: 'Anterior', text: row => formatValue(row.values[1] ?? null, 'pct') },
  { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
]

export function useUsageSummary(data: Ref<KpisResponse | null | undefined>) {
  const period = usePeriod()
  const current = computed(() => data.value?.current)
  const previous = computed(() => (period.compare.value ? data.value?.previous ?? null : null))

  const stats = computed<PageStat[]>(() => STATS.map(stat => ({
    ...stat,
    value: (current.value?.[stat.key] ?? null) as number | null,
    previous: (previous.value?.[stat.key] ?? null) as number | null
  })))

  const frictionSeries = computed<BarSeries[]>(() => previous.value
    ? [{ name: 'Período atual', color: 'var(--viz-series-1)' }, { name: 'Período anterior', color: 'var(--viz-other)' }]
    : [{ name: 'Período atual', color: 'var(--viz-series-1)' }])

  const frictionRows = computed<BarRow[]>(() => FRICTION_GROUPS.map((group) => {
    const key = `${group.column}_sessions_pct` as keyof PeriodKpis
    const now = (current.value?.[key] ?? null) as number | null
    const before = (previous.value?.[key] ?? null) as number | null
    const events = (current.value?.[`${group.column}_events` as keyof PeriodKpis] ?? null) as number | null
    const notes = [`${formatValue(events, 'int')} eventos no período`]
    if (now !== null && before !== null) {
      const diff = now - before
      notes.push(`${diff > 0 ? '+' : ''}${formatValue(diff, 'decimal')} p.p. (${diff < 0 ? 'melhor' : diff > 0 ? 'pior' : 'igual'})`)
    }
    return { key: group.key, label: group.label, values: previous.value ? [now, before] : [now], notes }
  }))

  const frictionDescription = computed(() => previous.value
    ? 'Percentual das sessões com cada evento, contra o período anterior de mesmo tamanho. Quanto menor, melhor.'
    : 'Percentual das sessões com cada evento. Quanto menor, melhor.')

  return { current, previous, stats, frictionSeries, frictionRows, frictionDescription }
}
