<script setup lang="ts">

const period = usePeriod()
const friction = useFrictionGroup()
const minMobile = ref(10)
const MIN_OPTIONS = [
  { label: 'Mobile com 10+ sessões', value: 10 },
  { label: 'Mobile com 30+ sessões', value: 30 },
  { label: 'Todas as telas', value: 0 }
]

const [{ data: screens, error }, { data: devices }] = await Promise.all([
  usePanel<ScreenFriction[]>('screens', () => ({ ...period.query.value, options: { device: true } })),
  usePanel<DeviceFriction[]>('devices', () => period.query.value)
])

const SERIES = [
  { key: 'PC', label: 'Desktop', color: 'var(--viz-series-1)' },
  { key: 'Mobile', label: 'Mobile', color: 'var(--viz-series-2)' }
]

interface Pair { screen: string, desktop?: ScreenFriction, mobile?: ScreenFriction }

const pairs = computed(() => {
  const byScreen = new Map<string, Pair>()
  for (const row of screens.value ?? []) {
    if (row.metric_group !== friction.group.value) continue
    const pair = byScreen.get(row.screen) ?? { screen: row.screen }
    if (row.device === 'PC') pair.desktop = row
    if (row.device === 'Mobile') pair.mobile = row
    byScreen.set(row.screen, pair)
  }
  return [...byScreen.values()]
    .filter(p => p.desktop && p.mobile && (p.mobile.sessions ?? 0) >= minMobile.value)
    .sort((a, b) => ((b.mobile!.sessions_with_pct ?? 0) - (b.desktop!.sessions_with_pct ?? 0))
      - ((a.mobile!.sessions_with_pct ?? 0) - (a.desktop!.sessions_with_pct ?? 0)))
})

const dumbbell = computed<DumbbellRow[]>(() => pairs.value.slice(0, 15).map(p => ({
  key: p.screen,
  label: p.screen,
  a: p.desktop!.sessions_with_pct,
  b: p.mobile!.sessions_with_pct,
  detail: `${formatValue(p.desktop!.sessions, 'int')} sessões desktop · ${formatValue(p.mobile!.sessions, 'int')} mobile`
})))

const pairColumns: DataColumn<Pair>[] = [
  { key: 'screen', label: 'Tela' },
  { key: 'desktop', label: 'Desktop', text: row => formatValue(row.desktop?.sessions_with_pct, 'pct') },
  { key: 'mobile', label: 'Mobile', text: row => formatValue(row.mobile?.sessions_with_pct, 'pct') },
  { key: 'mobile_sessions', label: 'Sessões mobile', text: row => formatValue(row.mobile?.sessions, 'int') }
]

const grouped = computed<GroupedRow[]>(() => FRICTION_GROUPS.map(group => ({
  key: group.key,
  label: group.label,
  values: SERIES.map(series => {
    const row = (devices.value ?? []).find(d => d.metric_group === group.key && d.device === series.key)
    return {
      series: series.key,
      value: row?.sessions_with_pct ?? null,
      tooltip: row ? `${series.label}: ${formatValue(row.sessions_with_pct, 'pct')} de ${formatValue(row.sessions, 'int')} sessões` : undefined
    }
  })
})))

const mobileSessions = computed(() => (devices.value ?? [])
  .find(d => d.device === 'Mobile' && d.metric_group === 'DeadClickCount')?.sessions ?? null)
</script>

<template>
  <UDashboardPanel id="dispositivos">
    <template #header>
      <UDashboardNavbar title="Desktop × Mobile">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
      <PageFilters>
        <USelect v-model="friction.group.value" :items="friction.items" class="w-48" />
        <USelect v-model="minMobile" :items="MIN_OPTIONS" class="w-56" />
      </PageFilters>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler os dados" :description="error.statusMessage || error.message" />
      <template v-else>
        <VizChartCard
          :title="`Qual a pior versão de cada tela · ${friction.label.value}`"
          description="Percentual das sessões com o evento, no desktop e no mobile. Ordenado pela diferença: no topo, as telas que o mobile mais piora."
          :legend="SERIES" :columns="pairColumns" :rows="pairs" :empty="!dumbbell.length"
          empty-text="Nenhuma tela tem sessões suficientes nos dois dispositivos neste período."
        >
          <VizDumbbell :rows="dumbbell" format="pct" />
        </VizChartCard>

        <VizChartCard
          title="Atrito por dispositivo"
          :description="mobileSessions !== null
            ? `O mobile teve ${formatValue(mobileSessions, 'int')} sessões no período: cada sessão pesa mais na taxa dele.`
            : 'Percentual das sessões com cada evento.'"
          :legend="SERIES" :empty="!(devices ?? []).length"
        >
          <VizGroupedBars :rows="grouped" :series="SERIES" format="pct" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
