<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const { data, error } = await usePainel<HealthResponse>('saude')

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

const gaps = computed(() => (data.value?.coverage ?? []).filter(r => !r.curated).length)

// Status is never colour alone: icon + words.
function state(row?: CoverageRow) {
  if (!row || (!row.landed && !row.curated)) return { icon: 'i-lucide-circle-x', color: 'var(--viz-critical)', text: 'Perdido' }
  if (!row.curated) return { icon: 'i-lucide-clock', color: 'var(--viz-serious)', text: 'Chegou, falta curar' }
  return { icon: 'i-lucide-circle-check', color: 'var(--viz-good)', text: 'Ok' }
}

const qualityColumns: TableColumn<QualityRow>[] = [
  { accessorKey: 'severity', header: 'Gravidade' },
  { accessorKey: 'check_name', header: 'Problema' },
  { accessorKey: 'ref', header: 'Onde' },
  { accessorKey: 'rows', header: 'Linhas' },
  { accessorKey: 'detail', header: 'O que fazer' }
]

const callColumns: TableColumn<CollectionCall>[] = [
  { accessorKey: 'metric_date', header: 'Dia', cell: ({ row }) => formatDay(row.original.metric_date) },
  { accessorKey: 'breakdown_type', header: 'Recorte', cell: ({ row }) => TYPE_LABELS[row.original.breakdown_type] ?? row.original.breakdown_type },
  { accessorKey: 'fetched_local', header: 'Coletado em (SP)', cell: ({ row }) => row.original.fetched_local.slice(0, 16).replace('T', ' ') },
  { accessorKey: 'hours_off_civil_day', header: 'Desvio (h)', cell: ({ row }) => formatValue(row.original.hours_off_civil_day, 'decimal') },
  { accessorKey: 'http_status', header: 'HTTP' },
  { accessorKey: 'is_canonical', header: 'Usada', cell: ({ row }) => (row.original.is_canonical ? 'sim' : 'não') }
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
          <UTable :data="data.quality" :columns="qualityColumns" />
        </VizChartCard>

        <VizChartCard title="Cobertura por dia" description="Cada dia precisa dos sete recortes. Um dia perdido não volta: a API do Clarity só devolve as últimas 24 a 72 horas." :empty="!days.length">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted">
                  <th class="text-left font-normal py-1 pe-3">Dia</th>
                  <th v-for="t in TYPES" :key="t" class="font-normal py-1 px-2 text-center whitespace-nowrap">{{ TYPE_LABELS[t] }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in days" :key="d.day" class="border-t border-default">
                  <td class="py-1 pe-3 tabular whitespace-nowrap">{{ formatDay(d.day) }}</td>
                  <td v-for="t in TYPES" :key="t" class="py-1 px-2 text-center">
                    <UTooltip :text="state(d.types[t]).text">
                      <UIcon :name="state(d.types[t]).icon" class="size-4" :style="{ color: state(d.types[t]).color }" :aria-label="state(d.types[t]).text" />
                    </UTooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </VizChartCard>

        <VizChartCard title="Coletas fora do horário ou com falha" description="Janelas a mais de 3 horas do dia civil, ou chamadas que falharam. 'Usada' diz qual resposta o transform escreveu para o dia." :empty="!data.offHours.length" empty-text="Todas as coletas foram feitas no horário.">
          <UTable :data="data.offHours" :columns="callColumns" class="tabular" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
