<script setup lang="ts">
// One series, sorted: magnitude in a single colour (never a ramp on nominal
// categories). Thin bars anchored at the baseline, rounded only at the data
// end. The whole row is the hover target, larger than the mark.

const props = withDefaults(defineProps<{
  rows: RankingRow[]
  format: ValueFormat
  max?: number
  color?: string
  selected?: string | null
}>(), { color: 'var(--viz-series-1)', selected: null })

const emit = defineEmits<{ select: [key: string] }>()

const domain = computed(() => props.max ?? Math.max(1e-9, ...props.rows.map(row => row.value ?? 0)))
const width = (value: number | null) => `${Math.max(0, Math.min(100, ((value ?? 0) / domain.value) * 100))}%`
</script>

<template>
  <ul class="flex flex-col gap-1">
    <li v-for="row in rows" :key="row.key">
      <UTooltip :text="row.tooltip ?? `${row.label}: ${formatValue(row.value, format)}`" :content="{ side: 'top' }">
        <button
          type="button"
          class="w-full grid grid-cols-[minmax(0,14rem)_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-elevated focus-visible:bg-elevated outline-none"
          :class="{ 'bg-elevated': selected === row.key }"
          @click="emit('select', row.key)"
        >
          <span class="min-w-0">
            <span class="block truncate text-sm text-default" :title="row.label">{{ row.label }}</span>
            <span v-if="row.detail" class="block truncate text-xs text-muted">{{ row.detail }}</span>
          </span>
          <span class="h-3 relative" aria-hidden="true">
            <span
              class="absolute inset-y-0 left-0 rounded-e"
              :style="{ width: width(row.value), background: color }"
            />
          </span>
          <span class="text-sm text-highlighted tabular w-16 text-right">{{ formatValue(row.value, format) }}</span>
        </button>
      </UTooltip>
    </li>
  </ul>
</template>
