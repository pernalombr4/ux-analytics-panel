<script setup lang="ts">
// Readings of the Clarity UI run on their own clock: one window (7, 30, 90
// days) ending on one day. This page picks a reading, never the date period -
// two clocks on one page is how numbers stop agreeing.
const route = useRoute()
const router = useRouter()

const { data, error } = await usePanel<DeepResponse>('deep_metrics', () => ({
  options: { window: String(route.query.window ?? ''), end: String(route.query.end ?? '') }
}))

const readingItems = computed(() => (data.value?.readings ?? []).map(r => ({
  label: `${r.window_days} dias até ${formatDay(r.period_end)}${r.is_calendar_month ? ' · mês fechado' : ''}`,
  value: `${r.window_days}|${r.period_end}`
})))
const readingValue = computed({
  get: () => (data.value?.reading ? `${data.value.reading.window_days}|${data.value.reading.period_end}` : undefined),
  set: (value?: string) => {
    if (!value) return
    const [window, end] = value.split('|')
    router.replace({ query: { ...route.query, window, end } })
  }
})

const rows = computed(() => data.value?.rows ?? [])
const segmentMetricItems = computed(() => [...new Set(rows.value
  .filter(r => r.lens_type === 'segment' && r.overall_value_base !== null)
  .map(r => r.metric_name))]
  .map(name => ({ label: metricLabel(name), value: name })))
const segmentMetric = ref('dead_click_pct')
watch(segmentMetricItems, (items) => {
  if (items.length && !items.some(i => i.value === segmentMetric.value)) segmentMetric.value = items[0]!.value
}, { immediate: true })

// A segment defined by the metric itself ("Cliques mortos" for dead clicks) is
// 100% by construction. Kept out of the chart: it says nothing and its bar
// would flatten every other one.
const DEFINED_BY: Record<string, string> = {
  dead_clicks: 'dead_click_pct',
  quick_backs: 'quick_back_pct'
}
const tautological = computed(() => rows.value
  .filter(r => r.lens_type === 'segment' && r.metric_name === segmentMetric.value
    && DEFINED_BY[r.lens_name] === segmentMetric.value && r.dimension_value === '')
  .map(r => r.clarity_label || r.lens_name))

const segments = computed<DivergingRow[]>(() => rows.value
  .filter(r => r.lens_type === 'segment' && r.metric_name === segmentMetric.value && r.dimension_value === '')
  .filter(r => DEFINED_BY[r.lens_name] !== segmentMetric.value)
  .map(r => ({
    key: r.lens_name,
    label: r.clarity_label || r.lens_name,
    diff: r.diff_base,
    better: r.higher_is_better === null || r.diff_base === null || r.diff_base === 0
      ? null
      : (r.diff_base > 0) === r.higher_is_better,
    detail: `${formatValue(r.value_base, formatForUnit(r.unit_base))} vs. ${formatValue(r.overall_value_base, formatForUnit(r.unit_base))} no produto`
  }))
  .sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0)))

const segmentFormat = computed(() => formatForUnit(rows.value.find(r => r.metric_name === segmentMetric.value)?.unit_base ?? 'pct'))

// step_reached_pct is the conversion from the PREVIOUS step (the product of the
// steps equals the funnel conversion). The bars show how much of the first
// step got this far, which needs the steps in order: numbered "01 - Name".
interface Funnel { lens: string, label: string, conversion: number | null, median: number | null, ordered: boolean, steps: RankingRow[] }
const funnels = computed<Funnel[]>(() => {
  const byLens = new Map<string, Funnel & { raw: DeepMetric[] }>()
  for (const r of rows.value.filter(r => r.lens_type === 'funnel')) {
    const funnel = byLens.get(r.lens_name) ?? { lens: r.lens_name, label: r.clarity_label || r.lens_name, conversion: null, median: null, ordered: true, steps: [], raw: [] }
    if (r.metric_name === 'conversion_rate') funnel.conversion = r.value_base
    if (r.metric_name === 'time_to_convert_median') funnel.median = r.value_base
    if (r.metric_name === 'step_reached_pct') funnel.raw.push(r)
    byLens.set(r.lens_name, funnel)
  }
  return [...byLens.values()].map(({ raw, ...funnel }) => {
    funnel.ordered = raw.length > 0 && raw.every(r => r.step_order !== null)
    let reached = 100
    funnel.steps = [...raw]
      .sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0))
      .map((r, index) => {
        const stepRate = r.value_base ?? 0
        if (index > 0) reached = reached * stepRate / 100
        const label = r.dimension_value.replace(/^\d+\s*-\s*/, '')
        return funnel.ordered
          ? { key: r.dimension_value, label, value: reached,
              detail: index === 0 ? 'Passo 1 · início do funil' : `Passo ${r.step_order} · ${formatValue(stepRate, 'pct')} do passo anterior` }
          : { key: r.dimension_value, label, value: r.value_base, detail: 'Ordem desconhecida: conversão do passo anterior' }
      })
    return funnel
  }).sort((a, b) => (b.conversion ?? -1) - (a.conversion ?? -1))
})

function smartEvents(prefix: string): RankingRow[] {
  return rows.value
    .filter(r => r.lens_type === 'smart_event' && r.lens_name.startsWith(prefix) && r.metric_name === 'sessions')
    .sort((a, b) => (b.value_base ?? 0) - (a.value_base ?? 0))
    .map(r => ({ key: r.lens_name, label: r.clarity_label.replace(/^(Config|Uso) - /, ''), value: r.value_base }))
}
const configEvents = computed(() => smartEvents('config_'))
const useEvents = computed(() => smartEvents('use_'))

const TECHNICAL_ORDER = ['performance_score', 'lcp', 'inp', 'cls', 'share_good', 'share_needs_improvement', 'share_poor',
  'sessions_with_error_pct', 'total_errors', 'bot_session_pct']
const technical = computed(() => rows.value
  .filter(r => ['performance', 'js_error', 'bot_traffic'].includes(r.lens_type) && r.dimension_value === '')
  .sort((a, b) => TECHNICAL_ORDER.indexOf(a.metric_name) - TECHNICAL_ORDER.indexOf(b.metric_name))
  .map(r => ({
    key: `${r.lens_name}.${r.metric_name}`,
    label: metricLabel(r.metric_name),
    value: r.value_base,
    // the performance score is 0-100; CLS is the score that needs decimals
    format: r.metric_name === 'performance_score' ? 'int' : formatForUnit(r.unit_base),
    direction: r.higher_is_better === null ? 'neutral' : r.higher_is_better ? 'higher' : 'lower'
  } as const)))
</script>

<template>
  <UDashboardPanel id="profundas">
    <template #header>
      <UDashboardNavbar title="Segmentos, funis e eventos">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <USelect v-model="readingValue" :items="readingItems" placeholder="Nenhuma leitura" class="w-72" aria-label="Leitura do Clarity" />
          <USelect v-if="segmentMetricItems.length" v-model="segmentMetric" :items="segmentMetricItems" class="w-56" aria-label="Métrica dos segmentos" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler os dados" :description="error.statusMessage || error.message" />
      <UEmpty
        v-else-if="!data?.reading"
        icon="i-lucide-scan-eye"
        title="Nenhuma leitura do Clarity ainda"
        description="Segmentos, funis e eventos inteligentes não vêm pela API: entram pela captura manual da tela do Clarity."
      />
      <template v-else>
        <UAlert
          color="neutral" variant="subtle" icon="i-lucide-clock"
          :title="`Janela de ${data.reading.window_days} dias: ${formatPeriod(data.reading.period_start, data.reading.period_end)}`"
          description="Estes números são de uma leitura do Clarity e não seguem o período das outras páginas."
        />

        <VizChartCard
          :title="`Segmentos contra o produto inteiro · ${metricLabel(segmentMetric)}`"
          :description="`Diferença entre o segmento e o produto inteiro, na mesma janela.${tautological.length ? ` Fora do gráfico: ${tautological.join(', ')}, definido pelo próprio evento (100% por construção).` : ''}`"
          :empty="!segments.length" empty-text="Esta leitura não tem segmento com linha de base."
        >
          <VizDivergingBars :rows="segments" :format="segmentFormat" />
        </VizChartCard>

        <div v-if="funnels.length" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VizChartCard
            v-for="funnel in funnels" :key="funnel.lens"
            :title="funnel.label"
            :description="`Conversão ${formatValue(funnel.conversion, 'pct')}${funnel.median !== null ? ` · mediana até converter ${formatValue(funnel.median, 'seconds')}` : ''}. ${funnel.ordered ? 'Barras: parte das sessões do primeiro passo que chegou a cada passo.' : 'Passos sem número: a ordem não é conhecida.'}`"
            :empty="!funnel.steps.length" empty-text="Sem passos nesta leitura."
          >
            <VizBarRanking :rows="funnel.steps" format="pct" :max="100" />
          </VizChartCard>
        </div>

        <div v-if="configEvents.length || useEvents.length" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VizChartCard title="Configurar" description="Sessões que passaram por cada evento inteligente de configuração." :empty="!configEvents.length">
            <VizBarRanking :rows="configEvents" format="int" />
          </VizChartCard>
          <VizChartCard title="Usar" description="Sessões que passaram por cada evento inteligente de uso." :empty="!useEvents.length">
            <VizBarRanking :rows="useEvents" format="int" />
          </VizChartCard>
        </div>

        <section v-if="technical.length" class="flex flex-col gap-3">
          <h2 class="text-sm font-medium text-toned">Desempenho, erros e bots</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatTile v-for="t in technical" :key="t.key" :label="t.label" :value="t.value" :format="t.format" :direction="t.direction" />
          </div>
        </section>
      </template>
    </template>
  </UDashboardPanel>
</template>
