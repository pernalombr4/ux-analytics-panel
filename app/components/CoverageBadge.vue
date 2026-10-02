<script setup lang="ts">
// Status colour, always with icon and words (dataviz: status is never colour alone).
const props = defineProps<{ collected: number, total: number }>()

const state = computed(() => {
  if (props.collected === 0) return { icon: 'i-lucide-circle-x', color: 'var(--viz-critical)', text: 'Nenhum dia coletado no período' }
  if (props.collected < props.total) {
    return { icon: 'i-lucide-triangle-alert', color: 'var(--viz-serious)', text: `${props.collected} de ${props.total} dias coletados` }
  }
  return { icon: 'i-lucide-circle-check', color: 'var(--viz-good)', text: `Período completo: ${props.total} dias` }
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-sm text-toned">
    <UIcon :name="state.icon" class="size-4" :style="{ color: state.color }" />
    {{ state.text }}
  </span>
</template>
