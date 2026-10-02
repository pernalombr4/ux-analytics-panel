<script setup lang="ts">
import { CalendarDate, parseDate } from '@internationalized/date'

const period = usePeriod()
const open = ref(false)

// The calendar works on CalendarDate. Data exists up to yesterday.
const draft = shallowRef<{ start: CalendarDate | undefined, end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})
watch(open, (isOpen) => {
  if (isOpen) draft.value = { start: parseDate(period.from.value), end: parseDate(period.to.value) }
})
const maxValue = computed(() => parseDate(todayInSaoPaulo()).subtract({ days: 1 }))

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
  <UPopover v-model:open="open">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-calendar"
      trailing-icon="i-lucide-chevron-down"
      :label="period.label.value"
    />

    <template #content>
      <div class="flex flex-col sm:flex-row">
        <ul class="p-1 sm:w-48 sm:border-e border-default">
          <li v-for="item in PRESETS" :key="item.key">
            <UButton
              block
              color="neutral"
              variant="ghost"
              class="justify-between"
              :label="item.label"
              :trailing-icon="period.preset.value === item.key ? 'i-lucide-check' : undefined"
              @click="choose(item.key)"
            />
          </li>
        </ul>
        <div class="p-2 flex flex-col gap-2">
          <UCalendar v-model="draft" range :number-of-months="1" :max-value="maxValue" />
          <UButton label="Usar este intervalo" block :disabled="!draft.start || !draft.end" @click="applyCustom" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
