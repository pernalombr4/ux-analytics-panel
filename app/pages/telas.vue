<script setup lang="ts">

const period = usePeriod()
const friction = useFrictionGroup()
const minSessions = ref(30)
const MIN_OPTIONS = [
  { label: 'Todas as telas', value: 0 },
  { label: 'Telas com 30+ sessões', value: 30 },
  { label: 'Telas com 100+ sessões', value: 100 }
]

const [{ data: screens, error }, { data: engagement }] = await Promise.all([
  usePanel<ScreenFriction[]>('screens', () => period.query.value),
  usePanel<ScreenEngagement[]>('engagement', () => period.query.value)
])
const engagementOf = computed(() => new Map((engagement.value ?? []).map(row => [row.screen, row])))

const rows = computed(() => (screens.value ?? [])
  .filter(row => row.metric_group === friction.group.value && (row.sessions ?? 0) >= minSessions.value)
  .sort((a, b) => (b.sessions_with_pct ?? 0) - (a.sessions_with_pct ?? 0)))

const coverage = (row: ScreenFriction) => row.days_present < row.days_in_period
  ? ` · ${row.days_present} de ${row.days_in_period} dias`
  : ''

const ranking = computed<RankingRow[]>(() => rows.value.slice(0, 15).map(row => ({
  key: row.screen,
  label: row.screen,
  value: row.sessions_with_pct,
  detail: `${formatValue(row.sessions, 'int')} sessões${coverage(row)}`,
  tooltip: `${row.screen}: ${formatValue(row.sessions_with_pct, 'pct')} das sessões · ${formatValue(row.events, 'int')} eventos · ${formatValue(row.sessions, 'int')} sessões`
})))

const points = computed<ScatterPoint[]>(() => rows.value.map(row => ({
  key: row.screen,
  label: row.screen,
  x: row.sessions ?? 0,
  y: row.sessions_with_pct ?? 0,
  tooltip: `${row.screen}: ${formatValue(row.sessions_with_pct, 'pct')} em ${formatValue(row.sessions, 'int')} sessões`
})))

const columns: DataColumn<ScreenFriction>[] = [
  { key: 'screen', label: 'Tela' },
  { key: 'sessions_with_pct', label: '% sessões', text: row => formatValue(row.sessions_with_pct, 'pct') },
  { key: 'events', label: 'Eventos', text: row => formatValue(row.events, 'int') },
  { key: 'sessions', label: 'Sessões', text: row => formatValue(row.sessions, 'int') },
  { key: 'active_time', label: 'Tempo ativo', text: row => formatValue(engagementOf.value.get(row.screen)?.active_time_avg_seconds, 'seconds') },
  { key: 'pages_per_session', label: 'Páginas/sessão', text: row => formatValue(engagementOf.value.get(row.screen)?.pages_per_session, 'decimal') },
  { key: 'days_present', label: 'Dias com dado' }
]

// Drill-down: the URLs of the selected screen (top cut, so partial coverage).
const selected = ref<string | null>(null)
// Fetched only when a screen is picked, and again if the period changes.
const { data: urls } = usePanel<UrlFriction[]>(
  'urls',
  () => ({ ...period.query.value, options: { screen: selected.value } }),
  { enabled: () => !!selected.value }
)
const urlRows = computed<RankingRow[]>(() => (urls.value ?? [])
  .filter(row => row.metric_group === friction.group.value)
  .sort((a, b) => (b.sessions_with_pct ?? 0) - (a.sessions_with_pct ?? 0))
  .slice(0, 10)
  .map(row => ({
    key: row.url,
    label: row.url.replace(/^https?:\/\/[^/]+/, ''),
    value: row.sessions_with_pct,
    detail: `${formatValue(row.sessions, 'int')} sessões · no top 15 em ${row.days_present} de ${row.days_in_period} dias`
  })))
</script>

<template>
  <UDashboardPanel id="telas">
    <template #header>
      <UDashboardNavbar title="Atrito por tela">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
      <PageFilters>
        <USelect v-model="friction.group.value" :items="friction.items" class="w-48" />
        <USelect v-model="minSessions" :items="MIN_OPTIONS" class="w-52" />
      </PageFilters>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler os dados" :description="error.statusMessage || error.message" />
      <template v-else>
        <VizChartCard
          :title="`Piores telas · ${friction.label.value}`"
          description="Percentual das sessões na tela que tiveram o evento. Todas as URLs de cada tela entram na conta. Tempo ativo e páginas/sessão são médias ponderadas por sessão. Clique numa tela para ver as URLs."
          :columns="columns" :rows="rows" :empty="!rows.length"
        >
          <VizBarRanking :rows="ranking" format="pct" :selected="selected" @select="selected = selected === $event ? null : $event" />
        </VizChartCard>

        <VizChartCard
          v-if="selected"
          :title="`URLs de ${selected}`"
          description="Vem do corte das 15 URLs com mais sessões por dia: a taxa vale só para os dias em que a URL entrou no corte."
          :empty="!urlRows.length" empty-text="Nenhuma URL desta tela entrou no corte diário."
        >
          <VizBarRanking :rows="urlRows" format="pct" />
        </VizChartCard>

        <VizChartCard
          :title="`Volume × atrito · ${friction.label.value}`"
          description="Canto superior direito: muita gente passa e muita gente tropeça. É por onde começar."
          :empty="!points.length"
        >
          <VizScatter :points="points" x-label="Sessões na tela" y-label="% sessões com o evento" x-format="int" y-format="pct" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
