<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PageStat } from '~/components/PageStats.vue'

// Qualidade do produto: chamados and demandas of the ENSPACE produtos
// workspace, by area of the system, beside how much each area is used
// (Clarity). Defects and requests sit side by side and are never added up.
const period = usePeriod()
const { data, status, error } = usePainel<QualityResponse>('qualidade', () => period.query.value)

const kpis = computed(() => data.value?.kpis)
const previous = computed(() => (period.compare.value ? data.value?.previous ?? null : null))
const loaded = computed(() => Boolean(data.value && (data.value.totals.requests || data.value.totals.demands)))

const areaLabel = (key: string | null, fallback = 'Sem área') =>
  shortLabel(data.value?.labels.areas.find(a => a.key === key)?.label ?? fallback)
const pct = (part: number, whole: number) => (whole ? (100 * part) / whole : null)

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

const riskColumns = computed<TableColumn<BarRow>[]>(() => [
  { accessorKey: 'label', header: 'Área' },
  ...priorities.value.map((p, i) => ({ id: p.key, header: p.label, cell: ({ row }: { row: { original: BarRow } }) => formatValue(row.original.values[i] ?? 0, 'int') })),
  { id: 'notes', header: 'Detalhe', cell: ({ row }) => (row.original.notes ?? []).join(' · ') }
])

/* ---------- chamados por área ---------- */

const requestSeries: BarSeries[] = [
  { name: 'Bug', color: 'var(--viz-series-2)' },
  { name: 'Outros tipos', color: 'var(--viz-other)' }
]
const requestRows = computed<BarRow[]>(() => (data.value?.areas ?? [])
  .filter(a => a.requests > 0)
  .sort((a, b) => Number(a.area_key === null) - Number(b.area_key === null) || b.requests - a.requests)
  .map((a) => {
    const notes = [`${formatValue(a.requests_open, 'int')} abertos · ${formatValue(a.sla_breached, 'int')} com SLA vencido`]
    if (a.recurrences) notes.push(`${formatValue(a.recurrences, 'int')} recorrências`)
    if (a.csat_n) notes.push(`CSAT ${formatValue(a.csat, 'decimal')} (${formatValue(a.csat_n, 'int')} respostas)`)
    return { key: a.area_key ?? 'sem-area', label: areaLabel(a.area_key), values: [a.request_bugs, a.requests - a.request_bugs], notes }
  }))
const requestColumns: TableColumn<BarRow>[] = [
  { accessorKey: 'label', header: 'Área' },
  { id: 'bug', header: 'Bug', cell: ({ row }) => formatValue(row.original.values[0] ?? 0, 'int') },
  { id: 'outros', header: 'Outros tipos', cell: ({ row }) => formatValue(row.original.values[1] ?? 0, 'int') },
  { id: 'notes', header: 'Detalhe', cell: ({ row }) => (row.original.notes ?? []).join(' · ') }
]

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
const usageColumns: TableColumn<BarRow>[] = [
  { accessorKey: 'label', header: 'Área' },
  { id: 'visits', header: 'Visitas de tela', cell: ({ row }) => formatValue(row.original.values[0] ?? null, 'int') },
  { id: 'notes', header: 'Detalhe', cell: ({ row }) => (row.original.notes ?? []).join(' · ') }
]

/* ---------- chamados por mil visitas ---------- */

// Below this many visits one request moves the rate by tens: the area is
// listed under the chart instead of drawn.
const MIN_VISITS = 500
const rateLeftOut = computed(() => {
  const out = (data.value?.areas ?? []).filter(a => a.area_key && a.requests > 0)
    .map(a => ({ a, visits: usageByArea.value.get(a.area_key)?.visits ?? 0 }))
  const few = out.filter(x => x.visits > 0 && x.visits < MIN_VISITS)
    .map(x => `${areaLabel(x.a.area_key)} (${formatValue(x.a.requests, 'int')} chamados em ${formatValue(x.visits, 'int')} visitas)`)
  const none = out.filter(x => x.visits === 0).map(x => areaLabel(x.a.area_key))
  return [
    few.length ? `Menos de ${MIN_VISITS} visitas: ${few.join('; ')}.` : '',
    none.length ? `Sem tela mapeada no Clarity: ${none.join(', ')}.` : ''
  ].filter(Boolean)
})
const rateRows = computed<BarRow[]>(() => (data.value?.areas ?? [])
  .filter(a => a.area_key && a.requests > 0 && (usageByArea.value.get(a.area_key)?.visits ?? 0) >= MIN_VISITS)
  .map((a) => {
    const visits = usageByArea.value.get(a.area_key)!.visits
    return { key: a.area_key!, label: areaLabel(a.area_key), values: [(1000 * a.requests) / visits],
      notes: [`${formatValue(a.requests, 'int')} chamados em ${formatValue(visits, 'int')} visitas`] }
  })
  .sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0)))
const rateColumns: TableColumn<BarRow>[] = [
  { accessorKey: 'label', header: 'Área' },
  { id: 'rate', header: 'Chamados por mil visitas', cell: ({ row }) => formatValue(row.original.values[0] ?? null, 'decimal') },
  { id: 'notes', header: 'Base', cell: ({ row }) => (row.original.notes ?? []).join(' · ') }
]

/* ---------- tabela ---------- */

interface AreaRow extends QualityArea { label: string, visits: number | null, rate: number | null }
const tableRows = computed<AreaRow[]>(() => (data.value?.areas ?? []).map((a) => {
  const visits = a.area_key ? usageByArea.value.get(a.area_key)?.visits ?? null : null
  return { ...a, label: areaLabel(a.area_key), visits, rate: visits ? (1000 * a.requests) / visits : null }
}).sort((a, b) => Number(a.area_key === null) - Number(b.area_key === null) || b.score - a.score || b.requests - a.requests))
const tableColumns: TableColumn<AreaRow>[] = [
  { accessorKey: 'label', header: 'Área' },
  { accessorKey: 'requests', header: 'Chamados', cell: ({ row }) => formatValue(row.original.requests, 'int') },
  { accessorKey: 'request_bugs', header: 'Bugs relatados', cell: ({ row }) => formatValue(row.original.request_bugs, 'int') },
  { accessorKey: 'defects', header: 'Defeitos', cell: ({ row }) => formatValue(row.original.defects, 'int') },
  { accessorKey: 'defects_open', header: 'Abertos', cell: ({ row }) => formatValue(row.original.defects_open, 'int') },
  { accessorKey: 'score', header: 'Score', cell: ({ row }) => formatValue(row.original.score, 'int') },
  { accessorKey: 'from_requests', header: 'Vieram de chamado', cell: ({ row }) => formatValue(row.original.from_requests, 'int') },
  { accessorKey: 'csat', header: 'CSAT', cell: ({ row }) => row.original.csat_n ? `${formatValue(row.original.csat, 'decimal')} (${row.original.csat_n})` : '–' },
  { accessorKey: 'visits', header: 'Visitas', cell: ({ row }) => formatValue(row.original.visits, 'int') },
  { accessorKey: 'rate', header: 'Chamados / mil visitas', cell: ({ row }) => formatValue(row.original.rate, 'decimal') }
]

/* ---------- como ler ---------- */

const caveats = computed(() => {
  const k = kpis.value
  if (!k) return []
  const out: string[] = []
  if (k.requests && k.requests_validated < k.requests) {
    out.push(`${formatValue(k.requests - k.requests_validated, 'int')} chamados ainda sem triagem: usam o tipo e a prioridade que o solicitante indicou.`)
  }
  if (k.area_inherited) out.push(`${formatValue(k.area_inherited, 'int')} demandas sem campo de área herdaram a área dos chamados de origem.`)
  if (k.defects_no_area) out.push(`${formatValue(k.defects_no_area, 'int')} defeitos sem área nem chamado de origem estão em "Sem área".`)
  if (k.demands_no_status) out.push(`${formatValue(k.demands_no_status, 'int')} demandas sem status: não dá para dizer se estão abertas.`)
  if (k.inferred) out.push(`${formatValue(k.inferred, 'int')} itens vêm de fonte com valores inferidos, não lidos de campo.`)
  return out
})
</script>

<template>
  <UDashboardPanel id="qualidade">
    <template #header>
      <UDashboardNavbar title="Qualidade do produto">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UBadge v-if="kpis?.loaded_at" color="neutral" variant="subtle" icon="i-lucide-database">
            ENSPACE lido em {{ formatDateTime(kpis.loaded_at) }}
          </UBadge>
        </template>
      </UDashboardNavbar>
      <PageFilters compare-toggle />
    </template>

    <template #body>
      <UAlert
        v-if="error"
        color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler os dados" :description="error.statusMessage || error.message"
      />
      <template v-else-if="status === 'pending' && !data">
        <USkeleton class="h-36" />
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <USkeleton v-for="n in 4" :key="n" class="h-72" />
        </div>
      </template>
      <template v-else-if="data">
        <UCard v-if="!loaded" class="shrink-0">
          <UEmpty
            icon="i-lucide-database-zap"
            title="Chamados e demandas ainda não foram carregados"
            description="A estrutura está pronta: chamados, demandas, clientes, releases e CSAT do workspace produtos do ENSPACE, por área do sistema. Os números aparecem aqui quando a carga for ligada. O uso por área, abaixo, já vem do Clarity."
            variant="naked"
          />
        </UCard>

        <template v-else>
          <PageStats :stats="stats" />

          <UAlert
            v-if="caveats.length"
            color="neutral" variant="subtle" icon="i-lucide-info" title="Como ler"
          >
            <template #description>
              <ul class="list-disc ps-4 space-y-0.5">
                <li v-for="c in caveats" :key="c">{{ c }}</li>
              </ul>
            </template>
          </UAlert>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <VizChartCard
              title="Risco por área"
              description="Defeitos (demandas do tipo Bug) criados no período, pela prioridade. Ordem pelo score: Crítica vale 5, Urgente 4, Alta 3, Média 2, Baixa 1."
              :legend="prioritySeries.map(s => ({ label: s.name, color: s.color }))"
              :columns="riskColumns" :rows="riskRows"
              :empty="!riskRows.length" empty-text="Nenhum defeito criado no período."
            >
              <VizUnovisBars :rows="riskRows" :series="prioritySeries" format="int" stacked />
            </VizChartCard>

            <VizChartCard
              title="Chamados por área"
              description="Chamados abertos no período, pela área do sistema que o solicitante indicou. Tipo validado pela triagem; sem triagem, o indicado."
              :legend="requestSeries.map(s => ({ label: s.name, color: s.color }))"
              :columns="requestColumns" :rows="requestRows"
              :empty="!requestRows.length" empty-text="Nenhum chamado no período."
            >
              <VizUnovisBars :rows="requestRows" :series="requestSeries" format="int" stacked />
            </VizChartCard>
          </div>
        </template>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VizChartCard
            title="Onde o produto é usado"
            :description="`Visitas de tela no período, pela área de cada tela (Clarity). Uma sessão conta uma vez por tela. ${formatValue(mappedShare, 'pct')} das visitas caem em telas que já têm área.`"
            :columns="usageColumns" :rows="usageRows"
            :empty="!usageRows.length" empty-text="Sem visitas do Clarity no período."
          >
            <VizUnovisBars :rows="usageRows" :series="[{ name: 'Visitas de tela', color: 'var(--viz-series-1)' }]" format="int" />
          </VizChartCard>

          <VizChartCard
            v-if="loaded"
            title="Chamados por mil visitas"
            :description="`Quanto cada área gera de chamado para o quanto é usada: corrige o volume, porque área muito usada tende a ter mais chamados. Só áreas com ${MIN_VISITS} visitas ou mais.`"
            :columns="rateColumns" :rows="rateRows"
            :empty="!rateRows.length" :empty-text="`Nenhuma área com chamados e ${MIN_VISITS}+ visitas no período.`"
          >
            <VizUnovisBars :rows="rateRows" :series="[{ name: 'Chamados por mil visitas', color: 'var(--viz-series-1)' }]" format="decimal" />
            <p v-if="rateLeftOut.length" class="text-xs text-muted mt-3">
              Fora do gráfico. {{ rateLeftOut.join(' ') }}
            </p>
          </VizChartCard>
        </div>

        <VizChartCard
          v-if="loaded"
          title="Todas as áreas"
          description="Defeitos e chamados lado a lado, nunca somados. Score: soma dos pesos de prioridade dos defeitos."
        >
          <UTable :data="tableRows" :columns="tableColumns" class="tabular" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
