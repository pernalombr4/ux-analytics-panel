import type { Ref } from 'vue'
import type { PageStat } from '~/components/PageStats.vue'

// The ENSPACE side of a period (Chamados and Demandas of the produtos
// workspace) and where it meets Clarity: the use of each area of the system.
// Shared by the Panorama and the Riscos por área page.

// Below this many visits one request moves the rate by tens: the area is
// listed under the chart instead of drawn.
export const MIN_VISITS = 500

const pct = (part: number, whole: number) => (whole ? (100 * part) / whole : null)

export const usageColumns: DataColumn<BarRow>[] = [
  { key: 'label', label: 'Área' },
  { key: 'visits', label: 'Visitas de tela', text: row => formatValue(row.values[0] ?? null, 'int') },
  { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
]

export const rateColumns: DataColumn<BarRow>[] = [
  { key: 'label', label: 'Área' },
  { key: 'rate', label: 'Chamados por mil visitas', text: row => formatValue(row.values[0] ?? null, 'decimal') },
  { key: 'notes', label: 'Base', text: row => (row.notes ?? []).join(' · ') }
]

export function useQualitySummary(data: Ref<QualityResponse | null | undefined>) {
  const period = usePeriod()
  const kpis = computed(() => data.value?.kpis)
  const previous = computed(() => (period.compare.value ? data.value?.previous ?? null : null))
  const loaded = computed(() => Boolean(data.value && (data.value.totals.requests || data.value.totals.demands)))

  const areaLabel = (key: string | null, fallback = 'Sem área') =>
    shortLabel(data.value?.labels.areas.find(a => a.key === key)?.label ?? fallback)

  /* ---------- números ---------- */

  const stats = computed<PageStat[]>(() => {
    const k = kpis.value
    const p = previous.value
    if (!k) return []
    return [
      { key: 'requests', label: 'Chamados', icon: 'i-lucide-headset', format: 'int', value: k.requests, previous: p?.requests,
        direction: 'neutral', note: `${formatValue(k.requests_validated, 'int')} com tipo validado pela triagem.` },
      { key: 'defects', label: 'Defeitos', icon: 'i-lucide-bug', format: 'int', value: k.defects, previous: p?.defects,
        direction: 'lower', note: `${formatValue(k.defects_open, 'int')} ainda abertos. Demandas do tipo Bug.` },
      { key: 'with_demand', label: 'Viraram demanda', icon: 'i-lucide-git-pull-request-arrow', format: 'pct',
        value: pct(k.requests_with_demand, k.requests), previous: p ? pct(p.requests_with_demand, p.requests) : null,
        direction: 'neutral', note: `${formatValue(k.requests_with_demand, 'int')} de ${formatValue(k.requests, 'int')} chamados.` },
      { key: 'sla', label: 'SLA de resposta vencido', icon: 'i-lucide-alarm-clock', format: 'pct',
        value: pct(k.sla_breached, k.requests), previous: p ? pct(p.sla_breached, p.requests) : null,
        direction: 'lower', note: `${formatValue(k.sla_breached, 'int')} de ${formatValue(k.requests, 'int')}, pelo campo "SLA vencido?".` }
    ]
  })

  /* ---------- risco por área ---------- */

  const priorities = computed(() => data.value?.labels.priorities ?? [])
  const prioritySeries = computed<BarSeries[]>(() => priorities.value.map(p => ({
    name: p.label, color: `var(--viz-sev-${Math.min(5, Math.max(1, p.weight))})`
  })))

  const riskRows = computed<BarRow[]>(() => (data.value?.areas ?? [])
    .filter(a => a.defects > 0)
    .sort((a, b) => Number(a.area_key === null) - Number(b.area_key === null) || b.score - a.score || b.defects - a.defects)
    .map((a) => {
      const notes = [`Score ${formatValue(a.score, 'int')} · ${formatValue(a.defects, 'int')} defeitos, ${formatValue(a.defects_open, 'int')} abertos`]
      if (a.from_requests) notes.push(`${formatValue(a.from_requests, 'int')} chegaram por chamado`)
      if (a.no_priority) notes.push(`${formatValue(a.no_priority, 'int')} sem prioridade (fora do score)`)
      if (a.area_inherited) notes.push(`${formatValue(a.area_inherited, 'int')} com área herdada dos chamados`)
      return { key: a.area_key ?? 'sem-area', label: areaLabel(a.area_key), values: priorities.value.map(p => a.by_priority[p.key] ?? 0), notes }
    }))

  const riskColumns = computed<DataColumn<BarRow>[]>(() => [
    { key: 'label', label: 'Área' },
    ...priorities.value.map((p, i) => ({ key: p.key, label: p.label, text: (row: BarRow) => formatValue(row.values[i] ?? 0, 'int') })),
    { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
  ])

  const riskDescription = 'Defeitos (demandas do tipo Bug) criados no período, pela prioridade. Ordem pelo score: Crítica vale 5, Urgente 4, Alta 3, Média 2, Baixa 1.'

  /* ---------- uso por área (Clarity) ---------- */

  // visits: sessions summed over the screens of the area (exposure, not
  // distinct sessions). Same for every friction group, so read it from one.
  const usageByArea = computed(() => {
    const by = new Map<string | null, { visits: number, screens: number, friction: Record<string, number> }>()
    for (const u of data.value?.usage ?? []) {
      const entry = by.get(u.area_key) ?? { visits: 0, screens: 0, friction: {} }
      if (u.metric_group === 'DeadClickCount') {
        entry.visits = u.visits ?? 0
        entry.screens = u.screens
      }
      entry.friction[u.metric_group] = u.visits ? (100 * (u.affected ?? 0)) / u.visits : 0
      by.set(u.area_key, entry)
    }
    return by
  })
  const visitsOf = (key: string | null) => (key ? usageByArea.value.get(key)?.visits ?? 0 : 0)
  const totalVisits = computed(() => [...usageByArea.value.values()].reduce((sum, u) => sum + u.visits, 0))
  const mappedShare = computed(() => pct(totalVisits.value - (usageByArea.value.get(null)?.visits ?? 0), totalVisits.value))

  const usageRows = computed<BarRow[]>(() => [...usageByArea.value.entries()]
    .filter(([key, u]) => key !== null && u.visits > 0)
    .sort((a, b) => b[1].visits - a[1].visits)
    .map(([key, u]) => ({
      key: key!,
      label: areaLabel(key),
      values: [u.visits],
      notes: [`${formatValue(u.screens, 'int')} telas`,
        ...FRICTION_GROUPS.filter(g => ['DeadClickCount', 'QuickbackClick', 'ErrorClickCount'].includes(g.key))
          .map(g => `${g.label}: ${formatValue(u.friction[g.key] ?? null, 'pct')} das visitas`)]
    })))

  const usageDescription = computed(() =>
    `Visitas de tela no período, pela área de cada tela (Clarity). Uma sessão conta uma vez por tela. ${formatValue(mappedShare.value, 'pct')} das visitas caem em telas que já têm área.`)

  /* ---------- chamados por mil visitas (Clarity × ENSPACE) ---------- */

  const rateLeftOut = computed(() => {
    const out = (data.value?.areas ?? []).filter(a => a.area_key && a.requests > 0)
      .map(a => ({ a, visits: visitsOf(a.area_key) }))
    const few = out.filter(x => x.visits > 0 && x.visits < MIN_VISITS)
      .map(x => `${areaLabel(x.a.area_key)} (${formatValue(x.a.requests, 'int')} chamados em ${formatValue(x.visits, 'int')} visitas)`)
    const none = out.filter(x => x.visits === 0).map(x => areaLabel(x.a.area_key))
    return [
      few.length ? `Menos de ${MIN_VISITS} visitas: ${few.join('; ')}.` : '',
      none.length ? `Sem tela mapeada no Clarity: ${none.join(', ')}.` : ''
    ].filter(Boolean)
  })
  const rateRows = computed<BarRow[]>(() => (data.value?.areas ?? [])
    .filter(a => a.area_key && a.requests > 0 && visitsOf(a.area_key) >= MIN_VISITS)
    .map((a) => {
      const visits = visitsOf(a.area_key)
      return { key: a.area_key!, label: areaLabel(a.area_key), values: [(1000 * a.requests) / visits],
        notes: [`${formatValue(a.requests, 'int')} chamados em ${formatValue(visits, 'int')} visitas`] }
    })
    .sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0)))

  const rateDescription = `Quanto cada área gera de chamado (ENSPACE) para o quanto é usada (Clarity): corrige o volume, porque área muito usada tende a ter mais chamados. Só áreas com ${MIN_VISITS} visitas ou mais.`

  return {
    kpis, previous, loaded, areaLabel, stats,
    prioritySeries, riskRows, riskColumns, riskDescription,
    usageByArea, visitsOf, usageRows, usageDescription,
    rateRows, rateLeftOut, rateDescription
  }
}
