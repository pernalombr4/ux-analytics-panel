<script setup lang="ts">
// The one row of filters above the content. Everything on the page obeys it.
defineProps<{ compareToggle?: boolean }>()
const period = usePeriod()
</script>

<template>
  <!-- Wraps on narrow screens instead of scrolling the last filter out of view. -->
  <UDashboardToolbar :ui="{ left: 'flex-wrap gap-x-3 gap-y-2 py-2 min-w-0' }">
    <template #left>
      <!-- -ms-1 aligns with the sidebar collapse button, as in the template. -->
      <PeriodFilter class="-ms-1" />
      <USwitch
        v-if="compareToggle"
        :model-value="period.compare.value"
        label="Comparar com o período anterior"
        @update:model-value="period.setCompare($event)"
      />
      <slot />
    </template>
  </UDashboardToolbar>
</template>
