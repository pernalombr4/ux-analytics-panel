<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Every chart has a table view: identity never rests on colour alone, and
// some readers simply want the numbers.
const props = defineProps<{
  title: string
  description?: string
  legend?: { label: string, color: string }[]
  columns?: TableColumn<any>[]
  rows?: any[]
  empty?: boolean
  emptyText?: string
}>()

const showTable = ref(false)
const hasTable = computed(() => Boolean(props.columns?.length && props.rows))
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="font-semibold text-highlighted">{{ title }}</h2>
          <p v-if="description" class="text-sm text-muted mt-0.5">{{ description }}</p>
        </div>
        <UButton
          v-if="hasTable && !empty"
          size="xs"
          color="neutral"
          variant="ghost"
          :icon="showTable ? 'i-lucide-chart-bar' : 'i-lucide-table'"
          :label="showTable ? 'Gráfico' : 'Tabela'"
          @click="showTable = !showTable"
        />
      </div>
      <ul v-if="legend?.length && !showTable && !empty" class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-toned">
        <li v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-full" :style="{ background: item.color }" />
          {{ item.label }}
        </li>
      </ul>
    </template>

    <UEmpty
      v-if="empty"
      icon="i-lucide-chart-no-axes-column"
      :description="emptyText ?? 'Sem dados para este período.'"
      variant="naked"
      size="sm"
    />
    <UTable v-else-if="showTable" :data="rows" :columns="columns" class="tabular" />
    <slot v-else />
  </UCard>
</template>
