<script setup lang="ts">
// A few categories, two series side by side (Desktop, Mobile). Each series
// keeps its colour on every page. Sessions ride in the tooltip: a rate on a
// small sample must never travel without its sample size.

const props = defineProps<{
  rows: GroupedRow[]
  series: { key: string, label: string, color: string }[]
  format: ValueFormat
}>()

const domain = computed(() => Math.max(1e-9, ...props.rows.flatMap(row => row.values.map(v => v.value ?? 0))))
const width = (value: number | null) => `${((value ?? 0) / domain.value) * 100}%`
const colorOf = (key: string) => props.series.find(s => s.key === key)?.color ?? 'var(--viz-other)'
const labelOf = (key: string) => props.series.find(s => s.key === key)?.label ?? key
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="row in rows" :key="row.key" class="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 px-2">
      <span class="text-sm truncate" :title="row.label">{{ row.label }}</span>
      <span class="flex flex-col gap-0.5">
        <UTooltip
          v-for="item in row.values"
          :key="item.series"
          :text="item.tooltip ?? `${labelOf(item.series)}: ${formatValue(item.value, format)}`"
          :content="{ side: 'right' }"
        >
          <span class="grid grid-cols-[1fr_4rem] items-center gap-2 py-0.5">
            <span class="h-2.5 relative">
              <span
                class="absolute inset-y-0 left-0 rounded-e"
                :style="{ width: width(item.value), background: colorOf(item.series) }"
              />
            </span>
            <span class="text-xs text-toned tabular text-right">{{ formatValue(item.value, format) }}</span>
          </span>
        </UTooltip>
      </span>
    </li>
  </ul>
</template>
