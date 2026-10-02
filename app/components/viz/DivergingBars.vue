<script setup lang="ts">
// Above or below a baseline. Two opposite hues and a neutral midpoint; the
// colour says better or worse (from higher_is_better), the sign says above or
// below, and the label repeats it in words.

const props = defineProps<{ rows: DivergingRow[], format: ValueFormat }>()

const domain = computed(() => Math.max(1e-9, ...props.rows.map(row => Math.abs(row.diff ?? 0))))
const half = (value: number | null) => `${(Math.abs(value ?? 0) / domain.value) * 50}%`

function color(row: DivergingRow): string {
  if (row.better === null || !row.diff) return 'var(--viz-other)'
  return row.better ? 'var(--viz-better)' : 'var(--viz-worse)'
}

function text(row: DivergingRow): string {
  if (row.diff === null) return '–'
  const sign = row.diff > 0 ? '+' : ''
  const amount = props.format === 'pct'
    ? `${sign}${formatValue(row.diff, 'decimal')} p.p.`
    : `${sign}${formatValue(row.diff, props.format)}`
  if (row.better === null || !row.diff) return amount
  return `${amount} · ${row.better ? 'melhor' : 'pior'}`
}
</script>

<template>
  <ul class="flex flex-col gap-1">
    <li v-for="row in rows" :key="row.key">
      <UTooltip :text="row.tooltip ?? `${row.label}: ${text(row)}`" :content="{ side: 'top' }">
        <div class="grid grid-cols-[minmax(0,13rem)_1fr_8rem] items-center gap-3 rounded-md px-2 py-1.5 hover:bg-elevated">
          <span class="min-w-0">
            <span class="block truncate text-sm" :title="row.label">{{ row.label }}</span>
            <span v-if="row.detail" class="block truncate text-xs text-muted">{{ row.detail }}</span>
          </span>
          <span class="relative h-3">
            <span class="absolute inset-y-[-4px] left-1/2 w-px" :style="{ background: 'var(--viz-axis)' }" />
            <span
              v-if="row.diff"
              class="absolute inset-y-0"
              :class="row.diff > 0 ? 'left-1/2 rounded-e' : 'right-1/2 rounded-s'"
              :style="{ width: half(row.diff), background: color(row) }"
            />
          </span>
          <span class="text-sm text-highlighted tabular text-right">{{ text(row) }}</span>
        </div>
      </UTooltip>
    </li>
  </ul>
</template>
