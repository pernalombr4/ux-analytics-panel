<script setup lang="ts">
// Horizontal bars drawn with Unovis, the charting library of the Nuxt UI
// dashboard template. One row per category; one bar per series side by side,
// or the series stacked into one bar (parts of a whole: priority mix, type
// mix). Values are period aggregates: this component never draws a time axis.
import { VisAxis, VisGroupedBar, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import { GroupedBar, StackedBar } from '@unovis/ts'

const props = withDefaults(defineProps<{
  rows: BarRow[]
  series: BarSeries[]
  format: ValueFormat
  /** Fixed end of the value axis (100 for shares); otherwise fitted to the data. */
  max?: number
  /** Width reserved for the category labels, in px. */
  labelWidth?: number
  /** Stack the series into one bar per row instead of placing them side by side. */
  stacked?: boolean
}>(), { labelWidth: 170, stacked: false })

// On a phone a fixed label column would leave the bars a sliver: cap it at
// 40% of the card.
const root = ref<HTMLElement | null>(null)
const width = ref(0)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { width.value = entry?.contentRect.width ?? 0 })
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
const labelColumn = computed(() => (width.value ? Math.min(props.labelWidth, Math.round(width.value * 0.4)) : props.labelWidth))

// Unovis lays the categories out by index; the labels come from tickFormat.
const indexOf = (_: BarRow, i: number) => i
const accessors = computed(() => props.series.map((_, s) => (d: BarRow) => d.values[s] ?? 0))
const colors = computed(() => props.series.map(s => s.color))

// Value axis: round steps (1, 2, 2.5, 5 × 10^n) ending on a tick, so the last
// gridline names a real value. Explicit ticks also keep Unovis from drawing a
// second, denser set of gridlines between the labels.
const valueTicks = computed(() => {
  const top = props.max ?? Math.max(1e-9, ...props.rows.flatMap(r => props.stacked
    ? [r.values.reduce<number>((sum, v) => sum + (v ?? 0), 0)]
    : r.values.map(v => v ?? 0)))
  const magnitude = 10 ** Math.floor(Math.log10(top))
  const step = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10].map(m => m * magnitude).find(s => top / s <= 5) ?? magnitude * 10
  const end = props.max ?? Math.ceil(top / step) * step
  return Array.from({ length: Math.floor(end / step + 1e-9) + 1 }, (_, i) => i * step)
})
const domainMax = computed(() => valueTicks.value[valueTicks.value.length - 1]!)

const rowHeight = computed(() => (props.series.length > 1 && !props.stacked ? 46 : 30))
const height = computed(() => Math.max(96, props.rows.length * rowHeight.value + 40))

const categoryLabel = (i: number) => {
  const label = props.rows[Math.round(i)]?.label ?? ''
  const max = labelColumn.value < 140 ? 18 : 28
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}
const tickNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const valueLabel = (v: number) => props.format === 'pct'
  ? `${tickNumber.format(v)}%`
  : props.format === 'seconds' ? formatValue(v, 'seconds') : tickNumber.format(v)

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]!))

function tooltip(d: BarRow): string {
  const lines = props.series.map((s, k) => ({ s, k })).filter(({ k }) => !props.stacked || (d.values[k] ?? 0) > 0).map(({ s, k }) =>
    `<div class="flex items-center gap-2"><span class="size-2.5 rounded-full shrink-0" style="background:${s.color}"></span>`
    + `<span class="text-muted">${escapeHtml(s.name)}</span><span class="ms-auto ps-3 font-medium text-highlighted tabular">${escapeHtml(formatValue(d.values[k], props.format))}</span></div>`)
  const notes = (d.notes ?? []).map(n => `<div class="text-muted">${escapeHtml(n)}</div>`)
  return `<div class="flex flex-col gap-1 text-xs max-w-72"><div class="font-semibold text-highlighted">${escapeHtml(d.label)}</div>${lines.join('')}${notes.join('')}</div>`
}

const triggers = computed(() => (props.stacked
  ? { [StackedBar.selectors.bar]: tooltip }
  : { [GroupedBar.selectors.barGroup]: tooltip }))
</script>

<template>
  <!-- Horizontal: Unovis puts the categories (x accessor) on the y scale and
       the values on the x scale. yDirection south keeps the first row on top. -->
  <div ref="root" class="viz-unovis">
    <VisXYContainer
      :data="rows"
      :height="height"
      :x-domain="[0, domainMax]"
      :y-domain="[-0.5, rows.length - 0.5]"
      y-direction="south"
      :margin="{ left: labelColumn, right: 28, bottom: 28 }"
      :auto-margin="false"
    >
      <VisStackedBar
        v-if="stacked"
        :x="indexOf"
        :y="accessors"
        :color="colors"
        orientation="horizontal"
        :rounded-corners="4"
        :bar-padding="0.36"
        :bar-min-height="2"
      />
      <VisGroupedBar
        v-else
        :x="indexOf"
        :y="accessors"
        :color="colors"
        orientation="horizontal"
        :rounded-corners="4"
        :group-padding="0.28"
        :bar-padding="0.18"
        :bar-min-height="2"
      />
      <VisAxis
        type="y"
        :tick-values="rows.map((_, i) => i)"
        :tick-format="categoryLabel"
        :tick-text-width="labelColumn - 12"
        :grid-line="false"
        :domain-line="false"
        :tick-line="false"
      />
      <VisAxis
        type="x"
        :tick-values="valueTicks"
        :tick-format="valueLabel"
        :domain-line="false"
        :tick-line="false"
      />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>
  </div>
</template>
