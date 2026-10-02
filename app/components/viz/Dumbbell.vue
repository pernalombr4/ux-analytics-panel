<script setup lang="ts">
// Before -> after per item, here Desktop -> Mobile per screen. Two series, so
// a legend is always shown (by ChartCard) and the gap is labelled directly.

const props = withDefaults(defineProps<{
  rows: DumbbellRow[]
  format: ValueFormat
  aLabel?: string
  bLabel?: string
  max?: number
}>(), { aLabel: 'Desktop', bLabel: 'Mobile' })

const top = computed(() => props.max ?? Math.max(1e-9, ...props.rows.flatMap(row => [row.a ?? 0, row.b ?? 0])))
// Readable steps: ticks land on round numbers, the axis ends on the last one.
const step = computed(() => (top.value > 50 ? 25 : top.value > 20 ? 10 : top.value > 5 ? 5 : 1))
const domain = computed(() => Math.ceil(top.value / step.value) * step.value)
const ticks = computed(() => Array.from({ length: Math.round(domain.value / step.value) + 1 }, (_, i) => i * step.value))
const at = (value: number | null) => `${((value ?? 0) / domain.value) * 100}%`

function gap(row: DumbbellRow): string {
  if (row.a === null || row.b === null) return '–'
  const diff = row.b - row.a
  return props.format === 'pct'
    ? `${diff > 0 ? '+' : ''}${formatValue(diff, 'decimal')} p.p.`
    : `${diff > 0 ? '+' : ''}${formatValue(diff, props.format)}`
}
</script>

<template>
  <div>
    <div class="grid grid-cols-[minmax(0,14rem)_1fr_5rem] gap-3 px-2 mb-1 text-xs text-muted" aria-hidden="true">
      <span />
      <span class="relative h-4">
        <span
          v-for="tick in ticks"
          :key="tick"
          class="absolute -translate-x-1/2 tabular"
          :style="{ left: at(tick) }"
        >{{ formatValue(tick, format === 'pct' ? 'pct' : 'int') }}</span>
      </span>
      <span class="text-right">{{ bLabel }} − {{ aLabel }}</span>
    </div>

    <ul class="flex flex-col">
      <li v-for="row in rows" :key="row.key">
        <UTooltip
          :text="`${row.label} · ${aLabel}: ${formatValue(row.a, format)} · ${bLabel}: ${formatValue(row.b, format)}`"
          :content="{ side: 'top' }"
        >
          <div class="grid grid-cols-[minmax(0,14rem)_1fr_5rem] items-center gap-3 rounded-md px-2 py-2 hover:bg-elevated">
            <span class="min-w-0">
              <span class="block truncate text-sm" :title="row.label">{{ row.label }}</span>
              <span v-if="row.detail" class="block truncate text-xs text-muted">{{ row.detail }}</span>
            </span>
            <span class="relative h-4">
              <span class="absolute inset-y-1/2 left-0 right-0 h-px" :style="{ background: 'var(--viz-grid)' }" />
              <span
                v-if="row.a !== null && row.b !== null"
                class="absolute top-1/2 h-0.5 -translate-y-1/2"
                :style="{
                  left: at(Math.min(row.a, row.b)),
                  width: `calc(${at(Math.abs(row.b - row.a))})`,
                  background: 'var(--viz-axis)'
                }"
              />
              <span
                v-if="row.a !== null"
                class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-(--ui-bg)"
                :style="{ left: at(row.a), background: 'var(--viz-series-1)' }"
              />
              <span
                v-if="row.b !== null"
                class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-(--ui-bg)"
                :style="{ left: at(row.b), background: 'var(--viz-series-2)' }"
              />
            </span>
            <span class="text-sm text-highlighted tabular text-right">{{ gap(row) }}</span>
          </div>
        </UTooltip>
      </li>
    </ul>
  </div>
</template>
