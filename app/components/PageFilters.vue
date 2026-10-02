<script setup lang="ts">
// The one row of filters above the content. Everything on the page obeys it.
defineProps<{ compareToggle?: boolean }>()
const period = usePeriod()
</script>

<template>
  <UDashboardToolbar>
    <template #left>
      <PeriodFilter />
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
