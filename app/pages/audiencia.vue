<script setup lang="ts">
const period = usePeriod()
const friction = useFrictionGroup()

const [{ data: audience, error }, { data: tech }] = await Promise.all([
  usePanel<AudienceRow[]>('audience', () => period.query.value),
  usePanel<TechFriction[]>('technology', () => period.query.value)
])

/** Top N of one list, the tail folded into "Outros" - never a 9th colour. */
function topOf(group: string, n: number): RankingRow[] {
  const rows = (audience.value ?? []).filter(r => r.metric_group === group).sort((a, b) => b.sessions - a.sessions)
  const head = rows.slice(0, n)
  const tail = rows.slice(n)
  const label = (r: AudienceRow) => (group === 'Device' ? deviceLabel(r.label) : r.label)
  const result: RankingRow[] = head.map(r => ({
    key: r.label,
    label: label(r),
    value: r.share_pct,
    detail: `${formatValue(r.sessions, 'int')} sessões`
  }))
  if (tail.length) {
    const share = tail.reduce((sum, r) => sum + (r.share_pct ?? 0), 0)
    const sessions = tail.reduce((sum, r) => sum + r.sessions, 0)
    result.push({ key: '__other', label: `Outros (${tail.length})`, value: share, detail: `${formatValue(sessions, 'int')} sessões` })
  }
  return result
}

const devices = computed(() => (audience.value ?? [])
  .filter(r => r.metric_group === 'Device')
  .sort((a, b) => b.sessions - a.sessions))
const deviceColor = (label: string) => label === 'PC' ? 'var(--viz-series-1)' : label === 'Mobile' ? 'var(--viz-series-2)' : 'var(--viz-other)'

const NOTES: Record<string, string> = {
  Country: 'Participação dentro do grupo. Pode somar mais que o total de sessões: o Clarity conta a mesma sessão em dois países.'
}
const lists = computed(() => ['Country', 'Browser', 'OS', 'ReferrerUrl']
  .map(group => ({
    group,
    title: AUDIENCE_LABELS[group] ?? group,
    note: NOTES[group] ?? 'Participação no total de sessões do período.',
    rows: topOf(group, 8)
  }))
  .filter(list => list.rows.length))

const cells = computed<HeatCell[]>(() => (tech.value ?? [])
  .filter(r => r.metric_group === friction.group.value)
  .map(r => ({
    row: r.browser,
    col: r.os,
    value: r.sessions_with_pct,
    tooltip: `${r.browser} · ${r.os}: ${formatValue(r.sessions_with_pct, 'pct')} de ${formatValue(r.sessions, 'int')} sessões`
  })))
</script>

<template>
  <UDashboardPanel id="audiencia">
    <template #header>
      <UDashboardNavbar title="Audiência">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
      <PageFilters>
        <USelect v-model="friction.group.value" :items="friction.items" class="w-48" aria-label="Evento de atrito do mapa navegador × sistema" />
      </PageFilters>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-x"
        title="Não foi possível ler os dados" :description="error.statusMessage || error.message" />
      <template v-else>
        <VizChartCard
          title="Sessões por dispositivo"
          description="Participação no total de sessões do período."
          :empty="!devices.length"
        >
          <div class="flex h-6 w-full gap-0.5 rounded-sm overflow-hidden" role="img" aria-label="Sessões por dispositivo">
            <UTooltip v-for="d in devices" :key="d.label" :text="`${deviceLabel(d.label)}: ${formatValue(d.share_pct, 'pct')} · ${formatValue(d.sessions, 'int')} sessões`">
              <span class="h-full" :style="{ width: `${d.share_pct ?? 0}%`, background: deviceColor(d.label) }" />
            </UTooltip>
          </div>
          <ul class="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
            <li v-for="d in devices" :key="d.label" class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-full" :style="{ background: deviceColor(d.label) }" />
              <span class="text-toned">{{ deviceLabel(d.label) }}</span>
              <span class="text-highlighted tabular">{{ formatValue(d.share_pct, 'pct') }}</span>
            </li>
          </ul>
        </VizChartCard>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VizChartCard
            v-for="list in lists" :key="list.group"
            :title="list.title"
            :description="list.note"
          >
            <VizBarRanking :rows="list.rows" format="pct" />
          </VizChartCard>
        </div>

        <VizChartCard
          :title="`Navegador × sistema · ${friction.label.value}`"
          description="Percentual das sessões com o evento em cada combinação. Serve para separar problema de produto de problema de um navegador."
          :empty="!cells.length"
        >
          <VizHeatmap :cells="cells" format="pct" row-title="Navegador" />
        </VizChartCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
