<script setup lang="ts">
// A number and how it moved. No sparkline: the dashboard shows periods, never
// a point per day. The delta says "melhor/pior" in words, not by colour alone.
const props = defineProps<{
  label: string
  value: number | null
  format: ValueFormat
  previous?: number | null
  /** Which way is good. 'neutral' when more can mean engagement or confusion. */
  direction?: 'higher' | 'lower' | 'neutral'
  note?: string
}>()

const delta = computed(() => {
  if (props.previous === null || props.previous === undefined || props.value === null) return null
  const diff = props.value - props.previous
  // Rates move in percentage points; everything else in relative change.
  const text = props.format === 'pct'
    ? `${diff > 0 ? '+' : ''}${formatValue(diff, 'decimal')} p.p.`
    : props.previous === 0
      ? null
      : `${diff > 0 ? '+' : ''}${formatValue((diff / props.previous) * 100, 'decimal')}%`
  if (text === null) return null
  const direction = props.direction ?? 'neutral'
  const flat = Math.abs(diff) < 1e-9
  const good = flat || direction === 'neutral' ? null : (diff > 0) === (direction === 'higher')
  return {
    text,
    icon: flat ? 'i-lucide-minus' : diff > 0 ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-right',
    verdict: good === null ? '' : good ? 'melhor' : 'pior',
    color: good === null ? 'var(--ui-text-muted)' : good ? 'var(--viz-good-text)' : 'var(--viz-critical)'
  }
})
</script>

<template>
  <UCard :ui="{ body: 'p-4' }">
    <p class="text-sm text-muted">{{ label }}</p>
    <p class="mt-1 text-2xl font-semibold text-highlighted">{{ formatValue(value, format) }}</p>
    <p v-if="delta" class="mt-1 flex items-center gap-1 text-sm" :style="{ color: delta.color }">
      <UIcon :name="delta.icon" class="size-4 shrink-0" />
      <span class="tabular">{{ delta.text }}</span>
      <span v-if="delta.verdict">· {{ delta.verdict }}</span>
      <span class="text-muted">vs. anterior</span>
    </p>
    <p v-if="note" class="mt-1 text-xs text-muted">{{ note }}</p>
  </UCard>
</template>
