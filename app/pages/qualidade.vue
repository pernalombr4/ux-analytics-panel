<script setup lang="ts">

// Riscos por área: Chamados and Demandas of the ENSPACE produtos workspace,
// by area of the system. Only what the workspace records: how each area is
// used (Clarity) meets these numbers on the Panorama. Defects and requests
// sit side by side and are never added up.
const period = usePeriod()
const { data, status, error } = usePanel<QualityResponse>('quality', () => period.query.value)

// Stat cards and the risk chart: shared with the Panorama.
const { kpis, loaded, areaLabel, stats, prioritySeries, riskRows, riskColumns, riskDescription } = useQualitySummary(data)

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
const requestColumns: DataColumn<BarRow>[] = [
  { key: 'label', label: 'Área' },
  { key: 'bug', label: 'Bug', text: row => formatValue(row.values[0] ?? 0, 'int') },
  { key: 'outros', label: 'Outros tipos', text: row => formatValue(row.values[1] ?? 0, 'int') },
  { key: 'notes', label: 'Detalhe', text: row => (row.notes ?? []).join(' · ') }
]

/* ---------- tabela ---------- */

interface AreaRow extends QualityArea { label: string }
const tableRows = computed<AreaRow[]>(() => (data.value?.areas ?? [])
  .map(a => ({ ...a, label: areaLabel(a.area_key) }))
  .sort((a, b) => Number(a.area_key === null) - Number(b.area_key === null) || b.score - a.score || b.requests - a.requests))
const tableColumns: DataColumn<AreaRow>[] = [
  { key: 'label', label: 'Área' },
  { key: 'requests', label: 'Chamados', text: row => formatValue(row.requests, 'int') },
  { key: 'request_bugs', label: 'Bugs relatados', text: row => formatValue(row.request_bugs, 'int') },
  { key: 'recurrences', label: 'Recorrências', text: row => formatValue(row.recurrences, 'int') },
  { key: 'defects', label: 'Defeitos', text: row => formatValue(row.defects, 'int') },
  { key: 'defects_open', label: 'Abertos', text: row => formatValue(row.defects_open, 'int') },
  { key: 'score', label: 'Score', text: row => formatValue(row.score, 'int') },
  { key: 'from_requests', label: 'Vieram de chamado', text: row => formatValue(row.from_requests, 'int') },
  { key: 'csat', label: 'CSAT', text: row => row.csat_n ? `${formatValue(row.csat, 'decimal')} (${row.csat_n})` : '–' }
]

/* ---------- como ler ---------- */

const caveats = computed(() => {
  const k = kpis.value
  if (!k) return []
  const out: string[] = []
  if (k.requests && k.requests_validated < k.requests) {
    out.push(`${formatValue(k.requests - k.requests_validated, 'int')} chamados ainda sem triagem: usam o tipo e a prioridade que o solicitante indicou.`)
  }
  if (k.area_inherited) out.push(`${formatValue(k.area_inherited, 'int')} demandas sem a Área do sistema preenchida usam a área dos chamados de origem.`)
  if (k.defects_no_area) out.push(`${formatValue(k.defects_no_area, 'int')} defeitos sem área nem chamado de origem estão em "Sem área".`)
  if (k.demands_no_status) out.push(`${formatValue(k.demands_no_status, 'int')} demandas sem status: não dá para dizer se estão abertas.`)
  if (k.inferred) out.push(`${formatValue(k.inferred, 'int')} itens vêm de fonte com valores inferidos, não lidos de campo.`)
  return out
})
</script>

<template>
  <UDashboardPanel id="qualidade">
    <template #header>
      <UDashboardNavbar title="Riscos por área">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UBadge v-if="kpis?.loaded_at" color="neutral" variant="subtle" icon="i-lucide-database" class="hidden sm:inline-flex">
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
            description="A estrutura está pronta: chamados, demandas, clientes, releases e CSAT do workspace produtos do ENSPACE, por área do sistema. Os números aparecem aqui quando houver itens no workspace."
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
              :description="riskDescription"
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

        <VizChartCard
          v-if="loaded"
          title="Todas as áreas"
          description="Defeitos e chamados lado a lado, nunca somados. Score: soma dos pesos de prioridade dos defeitos. O uso de cada área, do Clarity, está no Panorama."
        >
          <DataTable :rows="tableRows" :columns="tableColumns" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
