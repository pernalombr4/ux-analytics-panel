<script setup lang="ts">
import { CalendarDate, parseDate } from '@internationalized/date'

// The period picker of the Nuxt UI dashboard template (HomeDateRangePicker):
// ranges on the left, a two-month calendar on the right. A custom range is
// applied with a button, so half a range never reaches the charts.
const period = usePeriod()
const open = ref(false)

const draft = shallowRef<{ start: CalendarDate | undefined, end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})
watch(open, (isOpen) => {
  if (isOpen) draft.value = { start: parseDate(period.from.value), end: parseDate(period.to.value) }
})
// Data exists up to yesterday (Sao Paulo).
const maxValue = computed(() => parseDate(todayInSaoPaulo()).subtract({ days: 1 }))

const wide = ref(false)
onMounted(() => { wide.value = window.matchMedia('(min-width: 640px)').matches })

function applyCustom() {
  const { start, end } = draft.value
  if (!start || !end) return
  period.setRange(start.toString(), end.toString())
  open.value = false
}

function choose(key: (typeof PRESETS)[number]['key']) {
  period.setPreset(key)
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar"
      class="data-[state=open]:bg-elevated group"
    >
      <span class="truncate">{{ period.label.value }}</span>

      <template #trailing>
        <UIcon name="i-lucide-chevron-down" class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
      </template>
    </UButton>

    <template #content>
      <div class="flex flex-col sm:flex-row items-stretch sm:divide-x divide-default">
        <div class="flex sm:flex-col justify-center flex-wrap border-b sm:border-b-0 border-default">
          <UButton
            v-for="item in PRESETS"
            :key="item.key"
            :label="item.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[period.preset.value === item.key ? 'bg-elevated' : 'hover:bg-elevated/50']"
            truncate
            @click="choose(item.key)"
          />
        </div>

        <div class="flex flex-col">
          <!-- Each month table is w-full by default: side by side, the second one
               spills out of the popover. Their own width keeps both inside. -->
          <UCalendar
            v-model="draft"
            class="p-2"
            :ui="{ grid: 'w-auto' }"
            range
            :number-of-months="wide ? 2 : 1"
            :max-value="maxValue"
          />
          <div class="flex justify-end p-2 border-t border-default">
            <UButton label="Usar este intervalo" :disabled="!draft.start || !draft.end" @click="applyCustom" />
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
