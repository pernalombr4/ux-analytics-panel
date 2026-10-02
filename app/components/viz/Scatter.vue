<script setup lang="ts">
// Volume x friction: one series, the extremes labelled, the rest in the
// tooltip. Points get a surface ring so overlaps stay readable. The SVG is
// drawn at the container's real width, so text stays at its real size.
const props = withDefaults(defineProps<{
  points: ScatterPoint[]
  xLabel: string
  yLabel: string
  xFormat: ValueFormat
  yFormat: ValueFormat
  labelTop?: number
}>(), { labelTop: 5 })

const H = 280
const PAD = { top: 12, right: 16, bottom: 28, left: 52 }

const container = ref<HTMLElement | null>(null)
const W = ref(640)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { if (entry) W.value = Math.max(280, entry.contentRect.width) })
  if (container.value) observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** Round ticks (1, 2 or 5 times a power of ten), at most ~5 steps. */
function niceScale(value: number): { max: number, ticks: number[] } {
  const top = value > 0 ? value : 1
  const raw = top / 5
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map(f => f * magnitude).find(s => s >= raw)!
  const max = Math.ceil(top / step) * step
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) }
}

const xScale = computed(() => niceScale(Math.max(0, ...props.points.map(p => p.x))))
const yScale = computed(() => niceScale(Math.max(0, ...props.points.map(p => p.y))))
const sx = (x: number) => PAD.left + (x / xScale.value.max) * (W.value - PAD.left - PAD.right)
const sy = (y: number) => H - PAD.bottom - (y / yScale.value.max) * (H - PAD.top - PAD.bottom)
const labelled = computed(() => new Set([...props.points].sort((a, b) => b.y - a.y).slice(0, props.labelTop).map(p => p.key)))

const hovered = ref<ScatterPoint | null>(null)
</script>

<template>
  <div>
    <p class="text-xs text-muted mb-1">{{ yLabel }}</p>
    <div ref="container" class="relative">
      <svg :width="W" :height="H" class="block max-w-full" role="img" :aria-label="`${yLabel} por ${xLabel}`">
        <g v-for="t in yScale.ticks" :key="`y${t}`">
          <line :x1="PAD.left" :x2="W - PAD.right" :y1="sy(t)" :y2="sy(t)" stroke="var(--viz-grid)" stroke-width="1" />
          <text :x="PAD.left - 8" :y="sy(t)" text-anchor="end" dominant-baseline="middle" class="fill-(--ui-text-muted) text-xs tabular">{{ formatValue(t, yFormat) }}</text>
        </g>
        <text
          v-for="t in xScale.ticks" :key="`x${t}`"
          :x="sx(t)" :y="H - PAD.bottom + 18" text-anchor="middle"
          class="fill-(--ui-text-muted) text-xs tabular"
        >{{ formatValue(t, xFormat) }}</text>
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="sy(0)" :y2="sy(0)" stroke="var(--viz-axis)" stroke-width="1" />

        <g v-for="p in points" :key="p.key">
          <circle :cx="sx(p.x)" :cy="sy(p.y)" r="5" fill="var(--viz-series-1)" stroke="var(--ui-bg)" stroke-width="2" />
          <text
            v-if="labelled.has(p.key)"
            :x="sx(p.x) + 9" :y="sy(p.y) - 7"
            class="fill-(--ui-text-toned) text-xs pointer-events-none"
          >{{ p.label }}</text>
          <!-- hit target larger than the mark -->
          <circle
            :cx="sx(p.x)" :cy="sy(p.y)" r="12" fill="transparent" class="cursor-default"
            @mouseenter="hovered = p" @mouseleave="hovered = null"
          />
        </g>
      </svg>
      <div
        v-if="hovered"
        class="absolute pointer-events-none rounded-md bg-default ring ring-default shadow-sm px-2 py-1 text-xs whitespace-nowrap"
        :style="{ left: `${sx(hovered.x)}px`, top: `${sy(hovered.y)}px`, transform: 'translate(-50%, calc(-100% - 10px))' }"
      >
        {{ hovered.tooltip ?? `${hovered.label}: ${formatValue(hovered.y, yFormat)}` }}
      </div>
    </div>
    <p class="text-xs text-muted text-right mt-1">{{ xLabel }}</p>
  </div>
</template>
