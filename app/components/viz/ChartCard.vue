<script setup lang="ts">
// Every chart has a table view: identity never rests on colour alone, and
// some readers simply want the numbers.
const props = defineProps<{
  title: string
  description?: string
  legend?: { label: string, color: string }[]
  columns?: DataColumn<any>[]
  rows?: any[]
  empty?: boolean
  emptyText?: string
  loading?: boolean
  /** A failed read: shown instead of "no data", which would be a different claim. */
  error?: string | null
}>()

const showTable = ref(false)
const hasTable = computed(() => Boolean(props.columns?.length && props.rows))
</script>

<template>
  <UCard class="shrink-0" :ui="{ body: 'p-4 sm:p-5' }">
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="font-semibold text-highlighted">{{ title }}</h2>
          <p v-if="description" class="text-sm text-muted mt-0.5">{{ description }}</p>
        </div>
        <UButton
          v-if="hasTable && !empty && !loading && !error"
          size="xs"
          color="neutral"
          variant="ghost"
          :icon="showTable ? 'i-lucide-chart-bar' : 'i-lucide-table'"
          :label="showTable ? 'Gráfico' : 'Tabela'"
          @click="showTable = !showTable"
        />
      </div>
      <ul v-if="legend?.length && !showTable && !empty && !loading && !error" class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-toned">
        <li v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-full" :style="{ background: item.color }" />
          {{ item.label }}
        </li>
      </ul>
    </template>

    <USkeleton v-if="loading" class="h-48" />
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-x"
      title="Não foi possível ler os dados"
      :description="error"
    />
    <UEmpty
      v-else-if="empty"
      icon="i-lucide-chart-no-axes-column"
      :description="emptyText ?? 'Sem dados para este período.'"
      variant="naked"
      size="sm"
    />
    <DataTable v-else-if="showTable && columns && rows" :columns="columns" :rows="rows" />
    <slot v-else />
  </UCard>
</template>
