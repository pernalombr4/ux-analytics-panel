<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Panorama: the two sources together. Clarity says how the product is used;
// ENSPACE, what the produtos workspace records about it (requests and
// defects); the area of the system is where they meet. Each source has its
// own section in the sidebar; this page only puts them side by side.
// Product rule: no line over days; every chart aggregates the chosen period.
const period = usePeriod()
const { target } = useNavigation()

// Not awaited: each side fills in as its read arrives.
const usageFetch = usePainel<KpisResponse>('kpis', () => period.query.value)
const qualityFetch = usePainel<QualityResponse>('qualidade', () => period.query.value)

const usage = useUsageSummary(usageFetch.data)
const quality = useQualitySummary(qualityFetch.data)
const { current, frictionSeries, frictionRows, frictionDescription } = usage
const { loaded, prioritySeries, riskRows, riskColumns, riskDescription, usageRows, usageDescription, rateRows, rateLeftOut, rateDescription } = quality

// Each block reports its own read: a failed request is not "no data".
type Fetch = typeof usageFetch | typeof qualityFetch
const loadingOf = (f: Fetch) => f.status.value === 'pending' && !f.data.value
const errorOf = (f: Fetch) => (f.error.value ? f.error.value.statusMessage || f.error.value.message : null)

/* ---------- áreas: uso e qualidade ---------- */

// Every area with visits (Clarity) or with requests or defects (ENSPACE).
// The rate only from MIN_VISITS on, as in the chart.
interface AreaRow {
  key: string
  label: string
  visits: number | null
  requests: number
  rate: number | null
  defects: number
  defects_open: number
  score: number
}
const areaRows = computed<AreaRow[]>(() => {
  const areas = qualityFetch.data.value?.areas ?? []
  const keys = new Set<string | null>([...areas.map(a => a.area_key), ...quality.usageByArea.value.keys()])
  return [...keys].map((key) => {
    const a = areas.find(x => x.area_key === key)
    const visits = quality.usageByArea.value.get(key)?.visits || null
    const requests = a?.requests ?? 0
    return {
      key: key ?? 'sem-area',
      label: quality.areaLabel(key),
      visits,
      requests,
      rate: key && visits && visits >= MIN_VISITS ? (1000 * requests) / visits : null,
      defects: a?.defects ?? 0,
      defects_open: a?.defects_open ?? 0,
      score: a?.score ?? 0
    }
  }).sort((x, y) => Number(x.key === 'sem-area') - Number(y.key === 'sem-area')
    || y.score - x.score || y.requests - x.requests || (y.visits ?? 0) - (x.visits ?? 0))
})
const areaColumns: TableColumn<AreaRow>[] = [
  { accessorKey: 'label', header: 'Área' },
  { accessorKey: 'visits', header: 'Visitas de tela', cell: ({ row }) => formatValue(row.original.visits, 'int') },
  { accessorKey: 'requests', header: 'Chamados', cell: ({ row }) => formatValue(row.original.requests, 'int') },
  { accessorKey: 'rate', header: 'Chamados / mil visitas', cell: ({ row }) => formatValue(row.original.rate, 'decimal') },
  { accessorKey: 'defects', header: 'Defeitos', cell: ({ row }) => formatValue(row.original.defects, 'int') },
  { accessorKey: 'defects_open', header: 'Abertos', cell: ({ row }) => formatValue(row.original.defects_open, 'int') },
  { accessorKey: 'score', header: 'Score', cell: ({ row }) => formatValue(row.original.score, 'int') }
]
</script>

<template>
  <UDashboardPanel id="panorama">
    <template #header>
      <UDashboardNavbar title="Panorama">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <CoverageBadge v-if="current" :collected="current.days_collected" :total="current.days_in_period" />
          <UBadge v-if="quality.kpis.value?.loaded_at" color="neutral" variant="subtle" icon="i-lucide-database" class="hidden md:inline-flex">
            ENSPACE lido em {{ formatDateTime(quality.kpis.value.loaded_at) }}
          </UBadge>
        </template>
      </UDashboardNavbar>
      <PageFilters compare-toggle />
    </template>

    <template #body>
      <p v-if="period.compare.value && usageFetch.data.value" class="text-sm text-muted">
        <template v-if="usage.previous.value">Comparando com {{ formatPeriod(usageFetch.data.value.previousPeriod.from, usageFetch.data.value.previousPeriod.to) }}.</template>
        <template v-else>Sem dados do Clarity de {{ formatPeriod(usageFetch.data.value.previousPeriod.from, usageFetch.data.value.previousPeriod.to) }} para comparar.</template>
      </p>

      <!-- Clarity -->
      <SourceHeading title="Uso do produto" source="Clarity" :to="target(PAGES.uso)" link-label="Visão geral do uso" />
      <UAlert
        v-if="errorOf(usageFetch)"
        color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler o Clarity" :description="errorOf(usageFetch) ?? undefined"
      />
      <USkeleton v-else-if="loadingOf(usageFetch)" class="h-36 shrink-0" />
      <PageStats v-else :stats="usage.stats.value" />

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <VizChartCard
          title="Atrito no período"
          :description="frictionDescription"
          :legend="frictionSeries.length > 1 ? frictionSeries.map(s => ({ label: s.name, color: s.color })) : undefined"
          :columns="frictionColumns" :rows="frictionRows"
          :loading="loadingOf(usageFetch)" :error="errorOf(usageFetch)"
        >
          <VizUnovisBars :rows="frictionRows" :series="frictionSeries" format="pct" :label-width="140" />
        </VizChartCard>

        <VizChartCard
          title="Onde o produto é usado"
          :description="usageDescription"
          :columns="usageColumns" :rows="usageRows"
          :loading="loadingOf(qualityFetch)" :error="errorOf(qualityFetch)"
          :empty="!usageRows.length" empty-text="Sem visitas do Clarity no período."
        >
          <VizUnovisBars :rows="usageRows" :series="[{ name: 'Visitas de tela', color: 'var(--viz-series-1)' }]" format="int" />
        </VizChartCard>
      </div>

      <!-- ENSPACE -->
      <SourceHeading title="Qualidade do produto" source="ENSPACE" :to="target(PAGES.qualidade)" link-label="Riscos por área" />
      <UAlert
        v-if="errorOf(qualityFetch)"
        color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler o ENSPACE" :description="errorOf(qualityFetch) ?? undefined"
      />
      <USkeleton v-else-if="loadingOf(qualityFetch)" class="h-36 shrink-0" />
      <UCard v-else-if="!loaded" class="shrink-0">
        <UEmpty
          icon="i-lucide-database-zap"
          title="Chamados e demandas ainda não foram carregados"
          description="Os números do workspace produtos do ENSPACE aparecem aqui quando houver itens nele."
          variant="naked"
        />
      </UCard>
      <template v-else>
        <PageStats :stats="quality.stats.value" />

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VizChartCard
            title="Risco por área"
            :description="riskDescription"
            :legend="prioritySeries.map(s => ({ label: s.name, color: s.color }))"
            :columns="riskColumns" :rows="riskRows"
            :empty="!riskRows.length" empty-text="Nenhum defeito criado no período."
          >
            <VizUnovisBars :rows="riskRows" :series="prioritySeries" format="int" stacked />
          </VizChartCard>

          <VizChartCard
            title="Chamados por mil visitas"
            :description="rateDescription"
            :columns="rateColumns" :rows="rateRows"
            :empty="!rateRows.length" :empty-text="`Nenhuma área com chamados e ${MIN_VISITS}+ visitas no período.`"
          >
            <VizUnovisBars :rows="rateRows" :series="[{ name: 'Chamados por mil visitas', color: 'var(--viz-series-1)' }]" format="decimal" />
            <p v-if="rateLeftOut.length" class="text-xs text-muted mt-3">
              Fora do gráfico. {{ rateLeftOut.join(' ') }}
            </p>
          </VizChartCard>
        </div>

        <!-- Where they meet -->
        <SourceHeading title="Áreas do sistema" source="Clarity × ENSPACE" />
        <VizChartCard
          title="Uso e qualidade por área"
          :description="`Visitas do Clarity ao lado de chamados e defeitos do ENSPACE, nunca somados. Chamados por mil visitas só a partir de ${MIN_VISITS} visitas.`"
        >
          <UTable :data="areaRows" :columns="areaColumns" class="tabular" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
