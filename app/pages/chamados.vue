<script setup lang="ts">
import type { PageStat } from '~/components/PageStats.vue'

// Chamados: who opens them, of what type, from where and how triage closed
// them. Every chart is a cut of one grouped table (the cube) the API returns
// for the period.
const period = usePeriod()
const { data, status, error } = usePanel<RequestsResponse>('requests', () => period.query.value)

const kpis = computed(() => data.value?.kpis)
const previous = computed(() => (period.compare.value ? data.value?.previous ?? null : null))
const cube = computed(() => data.value?.cube ?? [])
const loaded = computed(() => Boolean(data.value?.totals.requests))
const pct = (part: number, whole: number) => (whole ? (100 * part) / whole : null)

const typeLabel = (key: string | null) => data.value?.labels.requestTypes.find(t => t.key === key)?.label ?? 'Sem tipo'
const clientLabel = (key: string | null) => data.value?.labels.clients.find(c => c.key === key)?.label ?? 'Sem cliente'
const clientTier = (key: string | null) => data.value?.labels.clients.find(c => c.key === key)?.tier ?? null
// A code the field no longer lists (an old option) shows as such, not raw.
const optionLabel = (field: string, key: string | null, empty: string) => {
  if (key === null) return empty
  const label = data.value?.labels.options.find(o => o.category === 'chamados' && o.field === field && o.key === key)?.label
  return label ? shortLabel(label) : `${key} (fora da lista atual)`
}

interface Totals { requests: number, open: number, validated: number, with_demand: number, recurrences: number, sla_breached: number, csat_sum: number, csat_n: number, groups: Record<string, number> }
function rollup(key: (row: RequestCubeRow) => string | null) {
  const by = new Map<string | null, Totals>()
  for (const row of cube.value) {
    const k = key(row)
    const t = by.get(k) ?? { requests: 0, open: 0, validated: 0, with_demand: 0, recurrences: 0, sla_breached: 0, csat_sum: 0, csat_n: 0, groups: {} }
    t.requests += row.requests
    t.open += row.open
    t.validated += row.validated
    t.with_demand += row.with_demand
    t.recurrences += row.recurrences
    t.sla_breached += row.sla_breached
    t.csat_sum += row.csat_sum ?? 0
    t.csat_n += row.csat_n
    const group = requestTypeGroup(row.type_key)
    t.groups[group] = (t.groups[group] ?? 0) + row.requests
    by.set(k, t)
  }
  // "Sem ..." is not a category: it goes last.
  return [...by.entries()].sort((a, b) => Number(a[0] === null) - Number(b[0] === null) || b[1].requests - a[1].requests)
}

/* ---------- números ---------- */

const stats = computed<PageStat[]>(() => {
  const k = kpis.value
  const p = previous.value
  if (!k) return []
  return [
    { key: 'requests', label: 'Chamados', icon: 'i-lucide-headset', format: 'int', value: k.requests, previous: p?.requests,
      direction: 'neutral', note: 'Abertos no período.' },
    { key: 'open', label: 'Ainda abertos', icon: 'i-lucide-inbox', format: 'pct', value: pct(k.requests_open, k.requests),
      previous: p ? pct(p.requests_open, p.requests) : null, direction: 'lower',
      note: `${formatValue(k.requests_open, 'int')} de ${formatValue(k.requests, 'int')}, pelo status de hoje.` },
    { key: 'validated', label: 'Com triagem', icon: 'i-lucide-list-checks', format: 'pct', value: pct(k.requests_validated, k.requests),
      previous: p ? pct(p.requests_validated, p.requests) : null, direction: 'higher',
      note: 'Tipo confirmado pela triagem ("Tipo validado").' },
    { key: 'recurrences', label: 'Recorrências', icon: 'i-lucide-repeat', format: 'int', value: k.recurrences, previous: p?.recurrences,
      direction: 'lower', note: 'Chamados marcados como recorrência de um problema já relatado.' }
  ]
})

/* ---------- por tipo ---------- */

// One bar per type, coloured by its group, so Bug has the same colour here
// as in the client chart.
const typeRows = computed<BarRow[]>(() => rollup(r => r.type_key).map(([key, t]) => ({
  key: key ?? 'sem-tipo', label: typeLabel(key),
  values: REQUEST_TYPE_GROUPS.map(g => (g.key === requestTypeGroup(key) ? t.requests : 0)),
  notes: [`${formatValue(t.validated, 'int')} com tipo validado · ${formatValue(t.open, 'int')} abertos`,
    `${formatValue(t.with_demand, 'int')} viraram demanda`]
})))

/* ---------- por cliente ---------- */

const groupSeries = REQUEST_TYPE_GROUPS.map(g => ({ name: g.label, color: g.color }))
const clientRows = computed<BarRow[]>(() => rollup(r => r.client_id).slice(0, 12).map(([key, t]) => {
  const tier = clientTier(key)
  const notes = [`${formatValue(t.open, 'int')} abertos · ${formatValue(t.sla_breached, 'int')} com SLA vencido`]
  if (tier) notes.unshift(`Tier ${tier}`)
  if (t.csat_n) notes.push(`CSAT ${formatValue(t.csat_sum / t.csat_n, 'decimal')} (${t.csat_n})`)
  return { key: key ?? 'sem-cliente', label: clientLabel(key), values: REQUEST_TYPE_GROUPS.map(g => t.groups[g.key] ?? 0), notes }
}))
const clientShare = computed(() => {
  const rows = rollup(r => r.client_id)
  const total = rows.reduce((sum, [, t]) => sum + t.requests, 0)
  const top = rows.slice(0, 3).reduce((sum, [, t]) => sum + t.requests, 0)
  return pct(top, total)
})

/* ---------- origem e desfecho ---------- */

const originRows = computed<BarRow[]>(() => rollup(r => r.origin).map(([key, t]) => ({
  key: key ?? 'sem-origem', label: optionLabel('origem', key, 'Sem origem'), values: [t.requests],
  notes: [`${formatValue(t.open, 'int')} abertos`]
})))
const outcomeRows = computed<BarRow[]>(() => rollup(r => r.outcome).map(([key, t]) => ({
  key: key ?? 'sem-desfecho', label: optionLabel('desfecho_analise', key, 'Sem desfecho (triagem pendente)'), values: [t.requests],
  notes: [`${formatValue(t.with_demand, 'int')} viraram demanda`]
})))

const simpleColumns = (label: string, value: string): DataColumn<BarRow>[] => [
  { key: 'label', label },
  { key: 'v', label: value, text: row => formatValue(row.values[0] ?? 0, 'int') },
  { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
]
const typeColumns: DataColumn<BarRow>[] = [
  { key: 'label', label: 'Tipo' },
  { key: 'v', label: 'Chamados', text: row => formatValue(row.values.reduce<number>((sum, v) => sum + (v ?? 0), 0), 'int') },
  { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
]
const groupColumns: DataColumn<BarRow>[] = [
  { key: 'label', label: 'Cliente' },
  ...REQUEST_TYPE_GROUPS.map((g, i) => ({ key: g.key, label: g.label, text: (row: BarRow) => formatValue(row.values[i] ?? 0, 'int') })),
  { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
]
</script>

<template>
  <UDashboardPanel id="chamados">
    <template #header>
      <UDashboardNavbar title="Chamados">
        <template #leading><UDashboardSidebarCollapse /></template>
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
            title="Chamados ainda não foram carregados"
            description="A estrutura está pronta para a categoria Chamados do workspace produtos do ENSPACE. Os números aparecem aqui quando houver itens no workspace."
            variant="naked"
          />
        </UCard>

        <template v-else>
          <PageStats :stats="stats" />

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <VizChartCard
              title="Por cliente"
              :description="`Os clientes que mais abriram chamados no período, pelo tipo. Os três primeiros somam ${formatValue(clientShare, 'pct')} dos chamados.`"
              :legend="groupSeries.map(s => ({ label: s.name, color: s.color }))"
              :columns="groupColumns" :rows="clientRows"
              :empty="!clientRows.length"
            >
              <VizUnovisBars :rows="clientRows" :series="groupSeries" format="int" stacked />
            </VizChartCard>

            <VizChartCard
              title="Por tipo"
              description="Tipo validado pela triagem; sem triagem, o que o solicitante indicou."
              :legend="groupSeries.map(s => ({ label: s.name, color: s.color }))"
              :columns="typeColumns" :rows="typeRows"
              :empty="!typeRows.length"
            >
              <VizUnovisBars :rows="typeRows" :series="groupSeries" format="int" stacked />
            </VizChartCard>

            <VizChartCard
              title="Origem"
              description="Quem registrou: o cliente direto ou o time interno em nome dele."
              :columns="simpleColumns('Origem', 'Chamados')" :rows="originRows"
              :empty="!originRows.length"
            >
              <VizUnovisBars :rows="originRows" :series="[{ name: 'Chamados', color: 'var(--viz-series-1)' }]" format="int" />
            </VizChartCard>

            <VizChartCard
              title="Desfecho da análise"
              description="Como a triagem encerrou a análise de cada chamado."
              :columns="simpleColumns('Desfecho', 'Chamados')" :rows="outcomeRows"
              :empty="!outcomeRows.length"
            >
              <VizUnovisBars :rows="outcomeRows" :series="[{ name: 'Chamados', color: 'var(--viz-series-1)' }]" format="int" />
            </VizChartCard>
          </div>
        </template>
      </template>
    </template>
  </UDashboardPanel>
</template>
