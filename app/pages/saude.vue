<script setup lang="ts">
import type { EnTableColumn } from '@be-enlighten/enspace-sdk-ui/base'

const { data, error } = await usePanel<HealthResponse>('health')

const TYPES = ['overall', 'url', 'device', 'browser_os', 'url_device', 'screen', 'screen_device']
const TYPE_LABELS: Record<string, string> = {
  overall: 'Totais', url: 'URL', device: 'Dispositivo', browser_os: 'Navegador × SO',
  url_device: 'URL × disp.', screen: 'Tela', screen_device: 'Tela × disp.'
}

const days = computed(() => {
  const byDay = new Map<string, Record<string, CoverageRow>>()
  for (const row of data.value?.coverage ?? []) {
    byDay.set(row.metric_date, { ...byDay.get(row.metric_date), [row.breakdown_type]: row })
  }
  return [...byDay.entries()].map(([day, types]) => ({ day, types }))
})

// One row per day, one column per breakdown: the cell is the status icon.
const coverageColumns: EnTableColumn[] = [
  { key: 'day', label: 'Dia' },
  ...TYPES.map(type => ({ key: type, label: TYPE_LABELS[type] ?? type, align: 'center' as const }))
]

const gaps = computed(() => (data.value?.coverage ?? []).filter(r => !r.curated).length)

// Status is never colour alone: icon + words.
function state(row?: CoverageRow) {
  if (!row || (!row.landed && !row.curated)) return { icon: 'i-lucide-circle-x', color: 'var(--viz-critical)', text: 'Perdido' }
  if (!row.curated) return { icon: 'i-lucide-clock', color: 'var(--viz-serious)', text: 'Chegou, falta curar' }
  return { icon: 'i-lucide-circle-check', color: 'var(--viz-good)', text: 'Ok' }
}

const qualityColumns: DataColumn<QualityRow>[] = [
  { key: 'severity', label: 'Gravidade' },
  { key: 'check_name', label: 'Problema' },
  { key: 'ref', label: 'Onde' },
  { key: 'rows', label: 'Linhas' },
  { key: 'detail', label: 'O que fazer' }
]

const reviewedColumns: DataColumn<ReviewedRow>[] = [
  { key: 'check_name', label: 'Problema' },
  { key: 'ref', label: 'Onde' },
  { key: 'decision', label: 'Decisão' },
  { key: 'reviewed_at', label: 'Revisado em', text: row => formatDay(row.reviewed_at.slice(0, 10)) }
]

const callColumns: DataColumn<CollectionCall>[] = [
  { key: 'metric_date', label: 'Dia', text: row => formatDay(row.metric_date) },
  { key: 'breakdown_type', label: 'Recorte', text: row => TYPE_LABELS[row.breakdown_type] ?? row.breakdown_type },
  { key: 'fetched_local', label: 'Coletado em (SP)', text: row => row.fetched_local.slice(0, 16).replace('T', ' ') },
  { key: 'hours_off_civil_day', label: 'Desvio (h)', text: row => formatValue(row.hours_off_civil_day, 'decimal') },
  { key: 'http_status', label: 'HTTP' },
  { key: 'is_canonical', label: 'Usada', text: row => (row.is_canonical ? 'sim' : 'não') }
]
</script>

<template>
  <UDashboardPanel id="saude">
    <template #header>
      <UDashboardNavbar title="Saúde dos dados">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler os dados" :description="error.statusMessage || error.message" />
      <template v-else-if="data">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UCard :ui="{ body: 'p-4' }">
            <p class="text-sm text-muted">Problemas de qualidade</p>
            <p class="mt-1 text-2xl font-semibold text-highlighted">{{ data.quality.length }}</p>
          </UCard>
          <UCard :ui="{ body: 'p-4' }">
            <p class="text-sm text-muted">Recortes faltando (35 dias)</p>
            <p class="mt-1 text-2xl font-semibold text-highlighted">{{ gaps }}</p>
          </UCard>
          <UCard :ui="{ body: 'p-4' }">
            <p class="text-sm text-muted">Respostas na fila do transform</p>
            <p class="mt-1 text-2xl font-semibold text-highlighted">{{ data.queued }}</p>
          </UCard>
        </div>

        <VizChartCard title="Qualidade" description="O que precisa de revisão antes de confiar num número." :empty="!data.quality.length" empty-text="Nada a revisar.">
          <DataTable :rows="data.quality" :columns="qualityColumns" />
        </VizChartCard>

        <VizChartCard
          v-if="data.reviewed?.length"
          title="Já revisados"
          description="Problemas que não têm conserto e já foram analisados. Saem da lista acima, mas o dado continua marcado aqui."
        >
          <DataTable :rows="data.reviewed" :columns="reviewedColumns" />
        </VizChartCard>

        <VizChartCard title="Cobertura por dia" description="Cada dia precisa dos sete recortes. Um dia perdido não volta: a API do Clarity só devolve as últimas 24 a 72 horas." :empty="!days.length">
          <EnTable :columns="coverageColumns" :rows="days" :column-sizing="{ day: 120 }" class="tabular">
            <template #cell-day="{ row }">
              {{ formatDay(row.day) }}
            </template>
            <template v-for="t in TYPES" :key="t" #[`cell-${t}`]="{ row }">
              <UTooltip :text="state(row.types[t]).text">
                <UIcon :name="state(row.types[t]).icon" class="size-4" :style="{ color: state(row.types[t]).color }" :aria-label="state(row.types[t]).text" />
              </UTooltip>
            </template>
          </EnTable>
        </VizChartCard>

        <VizChartCard title="Coletas fora do horário ou com falha" description="Janelas a mais de 3 horas do dia civil, ou chamadas que falharam. 'Usada' diz qual resposta o transform escreveu para o dia." :empty="!data.offHours.length" empty-text="Todas as coletas foram feitas no horário.">
          <DataTable :rows="data.offHours" :columns="callColumns" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
