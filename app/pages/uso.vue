<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Visão geral do uso: the Clarity side of the period, laid out like the home
// page of the Nuxt UI dashboard template (stat cards, chart cards, a table).
// Product rule: no line over days; every chart aggregates the chosen period,
// and the comparison with the previous period is a second bar, not a time axis.
const period = usePeriod()
const friction = useFrictionGroup()

// Not awaited: the page draws at once and each card fills in as its read
// arrives, instead of staying blank until the slowest of the four.
const kpis = usePainel<KpisResponse>('kpis', () => period.query.value)
const screensFetch = usePainel<ScreenFriction[]>('telas', () => period.query.value)
const engagementFetch = usePainel<ScreenEngagement[]>('engajamento', () => period.query.value)
const devicesFetch = usePainel<DeviceFriction[]>('dispositivos', () => period.query.value)
const { data, status, error } = kpis
const screens = computed(() => screensFetch.data.value ?? [])
const engagement = computed(() => engagementFetch.data.value ?? [])
const devices = computed(() => devicesFetch.data.value ?? [])

// Each chart card reports its own read: a failed request is not "no data".
type Fetch = typeof screensFetch | typeof engagementFetch | typeof devicesFetch
const loadingOf = (f: Fetch) => f.status.value === 'pending' && !f.data.value
const errorOf = (f: Fetch) => (f.error.value ? f.error.value.statusMessage || f.error.value.message : null)

// Stat cards and the friction chart: shared with the Panorama.
const { current, previous, stats, frictionSeries, frictionRows, frictionDescription } = useUsageSummary(data)

/* ---------- onde o atrito pesa mais ---------- */

// Sessions that hit the event on the screen: rate × sessions. Ranks by how
// many people a fix would reach, not by the rate alone.
const affectedRows = computed<BarRow[]>(() => screens.value
  .filter(s => s.metric_group === friction.group.value && s.sessions && s.sessions_with_pct !== null)
  .map(s => ({ ...s, affected: Math.round((s.sessions! * s.sessions_with_pct!) / 100) }))
  .sort((a, b) => b.affected - a.affected)
  .slice(0, 8)
  .map(s => ({
    key: s.screen,
    label: s.screen,
    values: [s.affected],
    notes: [`${formatValue(s.sessions_with_pct, 'pct')} das ${formatValue(s.sessions, 'int')} sessões da tela`]
  })))

const affectedColumns: TableColumn<BarRow>[] = [
  { accessorKey: 'label', header: 'Tela' },
  { id: 'affected', header: 'Sessões com o evento', cell: ({ row }) => formatValue(row.original.values[0] ?? null, 'int') },
  { id: 'notes', header: 'Taxa', cell: ({ row }) => (row.original.notes ?? []).join(' · ') }
]

/* ---------- onde as sessões acontecem ---------- */

const trafficRows = computed<BarRow[]>(() => [...engagement.value]
  .filter(e => e.sessions)
  .sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0))
  .slice(0, 10)
  .map(e => ({
    key: e.screen,
    label: e.screen,
    values: [e.sessions],
    notes: [`Tempo ativo médio: ${formatValue(e.active_time_avg_seconds, 'seconds')}`,
      `Páginas por sessão: ${formatValue(e.pages_per_session, 'decimal')}`]
  })))

const trafficColumns: TableColumn<BarRow>[] = [
  { accessorKey: 'label', header: 'Tela' },
  { id: 'sessions', header: 'Sessões', cell: ({ row }) => formatValue(row.original.values[0] ?? null, 'int') },
  { id: 'notes', header: 'Engajamento', cell: ({ row }) => (row.original.notes ?? []).join(' · ') }
]

/* ---------- desktop × mobile ---------- */

const deviceSessions = computed(() => {
  const by: Record<string, number> = {}
  for (const d of devices.value) by[d.device] = Math.max(by[d.device] ?? 0, d.sessions ?? 0)
  return by
})
const deviceShare = computed(() => {
  const total = Object.values(deviceSessions.value).reduce((a, b) => a + b, 0)
  const share = (device: string) => (total ? (100 * (deviceSessions.value[device] ?? 0)) / total : null)
  return { desktop: share('PC'), mobile: share('Mobile') }
})
const deviceSeries: BarSeries[] = [
  { name: 'Desktop', color: 'var(--viz-series-1)' },
  { name: 'Mobile', color: 'var(--viz-series-2)' }
]
const deviceRows = computed<BarRow[]>(() => FRICTION_GROUPS.map((group) => {
  const pick = (device: string) => devices.value.find(d => d.metric_group === group.key && d.device === device)
  return {
    key: group.key,
    label: group.label,
    values: [pick('PC')?.sessions_with_pct ?? null, pick('Mobile')?.sessions_with_pct ?? null],
    notes: [`Desktop: ${formatValue(pick('PC')?.sessions ?? null, 'int')} sessões · Mobile: ${formatValue(pick('Mobile')?.sessions ?? null, 'int')}`]
  }
}))
const deviceColumns: TableColumn<BarRow>[] = [
  { accessorKey: 'label', header: 'Atrito' },
  { id: 'pc', header: 'Desktop', cell: ({ row }) => formatValue(row.original.values[0] ?? null, 'pct') },
  { id: 'mobile', header: 'Mobile', cell: ({ row }) => formatValue(row.original.values[1] ?? null, 'pct') }
]

/* ---------- onde olhar primeiro ---------- */

interface WorstRow { group: string, screen: string, pct: number | null, sessions: number | null, affected: number | null }
const worst = computed<WorstRow[]>(() => FRICTION_GROUPS.map((group) => {
  const top = screens.value
    .filter(s => s.metric_group === group.key && (s.sessions ?? 0) >= 30 && s.sessions_with_pct !== null)
    .sort((a, b) => b.sessions_with_pct! - a.sessions_with_pct!)[0]
  return {
    group: group.label,
    screen: top?.screen ?? 'Nenhuma tela com 30+ sessões',
    pct: top?.sessions_with_pct ?? null,
    sessions: top?.sessions ?? null,
    affected: top ? Math.round((top.sessions! * top.sessions_with_pct!) / 100) : null
  }
}))
const worstColumns: TableColumn<WorstRow>[] = [
  { accessorKey: 'group', header: 'Atrito' },
  { accessorKey: 'screen', header: 'Pior tela' },
  { accessorKey: 'pct', header: '% sessões', cell: ({ row }) => formatValue(row.original.pct, 'pct') },
  { accessorKey: 'sessions', header: 'Sessões', cell: ({ row }) => formatValue(row.original.sessions, 'int') },
  { accessorKey: 'affected', header: 'Sessões com o evento', cell: ({ row }) => formatValue(row.original.affected, 'int') }
]
</script>

<template>
  <UDashboardPanel id="uso">
    <template #header>
      <UDashboardNavbar title="Visão geral do uso">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <CoverageBadge v-if="current" :collected="current.days_collected" :total="current.days_in_period" />
        </template>
      </UDashboardNavbar>
      <PageFilters compare-toggle>
        <USelect v-model="friction.group.value" :items="friction.items" class="w-48" aria-label="Tipo de atrito" />
      </PageFilters>
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
        <p v-if="period.compare.value" class="text-sm text-muted">
          <template v-if="previous">Comparando com {{ formatPeriod(data.previousPeriod.from, data.previousPeriod.to) }}.</template>
          <template v-else>Sem dados de {{ formatPeriod(data.previousPeriod.from, data.previousPeriod.to) }} para comparar.</template>
        </p>

        <PageStats :stats="stats" />

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VizChartCard
            title="Atrito no período"
            :description="frictionDescription"
            :legend="frictionSeries.length > 1 ? frictionSeries.map(s => ({ label: s.name, color: s.color })) : undefined"
            :columns="frictionColumns" :rows="frictionRows"
          >
            <VizUnovisBars :rows="frictionRows" :series="frictionSeries" format="pct" :label-width="140" />
          </VizChartCard>

          <VizChartCard
            :title="`Onde o atrito pesa mais · ${friction.label.value}`"
            description="Sessões que tiveram o evento em cada tela: taxa × sessões. É onde uma correção alcança mais gente."
            :columns="affectedColumns" :rows="affectedRows"
            :loading="loadingOf(screensFetch)" :error="errorOf(screensFetch)"
            :empty="!affectedRows.length"
          >
            <VizUnovisBars :rows="affectedRows" :series="[{ name: 'Sessões com o evento', color: 'var(--viz-series-1)' }]" format="int" />
          </VizChartCard>

          <VizChartCard
            title="Onde as sessões acontecem"
            description="As 10 telas com mais sessões. A sessão conta uma vez por URL da tela: quem abre duas tarefas conta duas vezes."
            :columns="trafficColumns" :rows="trafficRows"
            :loading="loadingOf(engagementFetch)" :error="errorOf(engagementFetch)"
            :empty="!trafficRows.length"
          >
            <VizUnovisBars :rows="trafficRows" :series="[{ name: 'Sessões', color: 'var(--viz-series-1)' }]" format="int" />
          </VizChartCard>

          <VizChartCard
            title="Desktop × Mobile"
            :description="`Percentual das sessões com cada evento, por dispositivo. Desktop tem ${formatValue(deviceShare.desktop, 'pct')} das sessões e mobile ${formatValue(deviceShare.mobile, 'pct')}: no mobile, poucas sessões mexem muito na taxa.`"
            :legend="deviceSeries.map(s => ({ label: s.name, color: s.color }))"
            :columns="deviceColumns" :rows="deviceRows"
            :loading="loadingOf(devicesFetch)" :error="errorOf(devicesFetch)"
            :empty="!devices.length"
          >
            <VizUnovisBars :rows="deviceRows" :series="deviceSeries" format="pct" :label-width="140" />
          </VizChartCard>
        </div>

        <VizChartCard
          title="Onde olhar primeiro"
          description="Para cada tipo de atrito, a tela com a maior taxa entre as que tiveram 30 sessões ou mais no período."
          :loading="loadingOf(screensFetch)" :error="errorOf(screensFetch)"
        >
          <UTable :data="worst" :columns="worstColumns" class="tabular" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
