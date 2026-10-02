<script setup lang="ts">
const period = usePeriod()
const { data, status, error } = await usePainel<KpisResponse>('kpis', () => period.query.value)

const current = computed(() => data.value?.current)
const previous = computed(() => (period.compare.value ? data.value?.previous ?? null : null))

const engagement = computed(() => [
  { label: 'Sessões', key: 'sessions', format: 'int', direction: 'higher' },
  { label: 'Usuários por dia (média)', key: 'avg_daily_users', format: 'decimal', direction: 'higher',
    note: 'Média diária. Usuário único do período só existe na leitura de 30 dias do Clarity.' },
  { label: 'Páginas por sessão', key: 'pages_per_session', format: 'decimal', direction: 'neutral' },
  { label: 'Tempo ativo médio', key: 'time_active_avg_seconds', format: 'seconds', direction: 'neutral' }
] as const)

const friction = FRICTION_GROUPS.map(group => ({
  label: `% sessões com ${group.label.toLowerCase()}`,
  key: `${group.column}_sessions_pct` as keyof PeriodKpis
}))

const value = (key: string) => (current.value ? current.value[key as keyof PeriodKpis] : null) as number | null
const before = (key: string) => (previous.value ? previous.value[key as keyof PeriodKpis] : null) as number | null
</script>

<template>
  <UDashboardPanel id="panorama">
    <template #header>
      <UDashboardNavbar title="Panorama">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <CoverageBadge v-if="current" :collected="current.days_collected" :total="current.days_in_period" />
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
      <template v-else>
        <p v-if="period.compare.value && data" class="text-sm text-muted">
          <template v-if="previous">Comparando com {{ formatPeriod(data.previousPeriod.from, data.previousPeriod.to) }}.</template>
          <template v-else>Sem dados de {{ formatPeriod(data.previousPeriod.from, data.previousPeriod.to) }} para comparar.</template>
        </p>

        <section class="flex flex-col gap-3">
          <h2 class="text-sm font-medium text-toned">Uso</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatTile
              v-for="tile in engagement" :key="tile.key"
              :label="tile.label" :value="value(tile.key)" :previous="before(tile.key)"
              :format="tile.format" :direction="tile.direction" :note="'note' in tile ? tile.note : undefined"
            />
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="text-sm font-medium text-toned">Atrito · quanto menor, melhor</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <StatTile
              v-for="tile in friction" :key="tile.key"
              :label="tile.label" :value="value(tile.key)" :previous="before(tile.key)"
              format="pct" direction="lower"
            />
          </div>
        </section>

        <USkeleton v-if="status === 'pending' && !data" class="h-40" />
      </template>
    </template>
  </UDashboardPanel>
</template>
