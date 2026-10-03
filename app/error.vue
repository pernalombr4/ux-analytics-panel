<script setup lang="ts">
import type { NuxtError } from '#app'
import { pt_br } from '@nuxt/ui/locale'

// As in the template: Nuxt UI's error page.
defineProps<{ error: NuxtError }>()

useSeoMeta({ title: 'Página não encontrada' })
</script>

<template>
  <UApp :locale="pt_br">
    <UError :error="error" :clear="{ label: 'Voltar ao painel' }" />
  </UApp>
</template>
