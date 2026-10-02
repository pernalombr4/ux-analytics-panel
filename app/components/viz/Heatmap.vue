<script setup lang="ts">
// A grid of magnitude: one hue, light -> dark (sequential), with a scale.
// Empty cells stay empty - no data is not zero.

const props = defineProps<{ cells: HeatCell[], format: ValueFormat, rowTitle?: string }>()

const STEPS = ['--viz-seq-1', '--viz-seq-2', '--viz-seq-3', '--viz-seq-4', '--viz-seq-5', '--viz-seq-6', '--viz-seq-7']

const rows = computed(() => [...new Set(props.cells.map(c => c.row))])
const cols = computed(() => [...new Set(props.cells.map(c => c.col))])
const byKey = computed(() => new Map(props.cells.map(c => [`${c.row}\u0000${c.col}`, c])))
const values = computed(() => props.cells.map(c => c.value).filter((v): v is number => v !== null))
const min = computed(() => Math.min(...values.value))
const max = computed(() => Math.max(...values.value))

function step(value: number): number {
  const span = max.value - min.value
  if (span <= 0) return 3
  return Math.min(STEPS.length - 1, Math.floor(((value - min.value) / span) * STEPS.length))
}
const cell = (row: string, col: string) => byKey.value.get(`${row}\u0000${col}`)
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-separate border-spacing-0.5 text-sm">
      <thead>
        <tr>
          <th class="text-left font-normal text-muted px-2">{{ rowTitle }}</th>
          <th v-for="col in cols" :key="col" class="font-normal text-muted px-2 text-center">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row">
          <th class="text-left font-normal px-2 whitespace-nowrap">{{ row }}</th>
          <td v-for="col in cols" :key="col" class="p-0">
            <UTooltip
              v-if="cell(row, col)?.value != null"
              :text="cell(row, col)!.tooltip ?? `${row} · ${col}: ${formatValue(cell(row, col)!.value, format)}`"
            >
              <div
                class="h-9 min-w-16 rounded-sm grid place-items-center tabular"
                :style="{
                  background: `var(${STEPS[step(cell(row, col)!.value!)]})`,
                  color: step(cell(row, col)!.value!) >= 4 ? '#ffffff' : '#0b0b0b'
                }"
              >{{ formatValue(cell(row, col)!.value, format) }}</div>
            </UTooltip>
            <div v-else class="h-9 min-w-16 grid place-items-center text-dimmed">–</div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="values.length" class="flex items-center gap-2 mt-3 text-xs text-muted">
      <span class="tabular">{{ formatValue(min, format) }}</span>
      <span class="flex h-2 w-40 rounded-full overflow-hidden">
        <span v-for="s in STEPS" :key="s" class="flex-1" :style="{ background: `var(${s})` }" />
      </span>
      <span class="tabular">{{ formatValue(max, format) }}</span>
    </div>
  </div>
</template>
