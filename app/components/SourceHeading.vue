<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// Title of a block of the Panorama: what it shows, which source it comes
// from, and the page of the sidebar that goes further.
defineProps<{
  title: string
  source: string
  to?: RouteLocationRaw
  linkLabel?: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-2 first:pt-0">
    <h2 class="flex items-center gap-2 font-semibold text-highlighted">
      {{ title }}
      <UBadge :label="source" color="neutral" variant="subtle" size="sm" />
    </h2>
    <UButton
      v-if="to"
      :to="to"
      :label="linkLabel"
      trailing-icon="i-lucide-arrow-right"
      color="neutral"
      variant="link"
      size="sm"
      class="px-0"
    />
  </div>
</template>
