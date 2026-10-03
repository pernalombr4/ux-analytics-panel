<script setup lang="ts">
// The row of stat cards at the top of a page, as in the Nuxt UI dashboard
// template. Each card: a number, how it moved against the previous period
// (in words too, never by colour alone) and one line of context.
export interface PageStat {
  key: string
  label: string
  icon: string
  value: number | null
  format: ValueFormat
  previous?: number | null
  /** Which way is good. 'neutral' when more is not better or worse. */
  direction?: 'higher' | 'lower' | 'neutral'
  note?: string
}

const props = defineProps<{ stats: PageStat[] }>()

const cards = computed(() => props.stats.map((stat) => {
  const { value, previous } = stat
  let badge: { text: string, color: 'success' | 'error' | 'neutral', icon: string } | null = null
  if (value !== null && previous !== null && previous !== undefined && previous !== 0) {
    const change = stat.format === 'pct' ? value - previous : ((value - previous) / previous) * 100
    const unit = stat.format === 'pct' ? ' p.p.' : '%'
    const direction = stat.direction ?? 'neutral'
    const good = direction === 'neutral' || Math.abs(change) < 1e-9 ? null : (change > 0) === (direction === 'higher')
    badge = {
      text: `${change > 0 ? '+' : ''}${formatValue(change, 'decimal')}${unit}${good === null ? '' : good ? ' · melhor' : ' · pior'}`,
      color: good === null ? 'neutral' : good ? 'success' : 'error',
      icon: change > 0 ? 'i-lucide-arrow-up-right' : change < 0 ? 'i-lucide-arrow-down-right' : 'i-lucide-minus'
    }
  }
  return { ...stat, badge }
}))
</script>

<template>
  <UPageGrid :class="['gap-4 sm:gap-6 lg:gap-px', stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4']">
    <UPageCard
      v-for="stat in cards" :key="stat.key"
      :icon="stat.icon"
      :title="stat.label"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">{{ formatValue(stat.value, stat.format) }}</span>
        <UBadge v-if="stat.badge" :color="stat.badge.color" variant="subtle" :icon="stat.badge.icon" class="text-xs">
          {{ stat.badge.text }}
        </UBadge>
      </div>
      <p v-if="stat.note" class="text-xs text-muted">{{ stat.note }}</p>
    </UPageCard>
  </UPageGrid>
</template>
