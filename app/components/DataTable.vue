<script setup lang="ts" generic="R extends object">
import type { EnTableColumn } from '@be-enlighten/enspace-sdk-ui/base'

// Every table of the panel is the ENSPACE EnTable (fixed layout, cells wrap).
// The column definition carries the cell text, so a page declares each table
// in one place.
const props = defineProps<{
  columns: DataColumn<R>[]
  rows: R[]
}>()

const tableColumns = computed<EnTableColumn[]>(() =>
  props.columns.map(({ key, label, align }) => ({ key, label, align })))

// Only the columns that format their value need a slot; the rest show row[key].
const formatted = computed(() => props.columns.filter(column => column.text))
</script>

<template>
  <EnTable :columns="tableColumns" :rows="rows as Record<string, unknown>[]" class="tabular">
    <template v-for="column in formatted" :key="column.key" #[`cell-${column.key}`]="{ row }">
      {{ column.text?.(row as R) }}
    </template>
  </EnTable>
</template>
