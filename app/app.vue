<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale'

// No passphrase, no app: the login screen stands in until one is accepted.
const { chave } = usePainelChave()

// As in the template: the browser bar follows the colour mode.
const colorMode = useColorMode()
useHead({
  meta: [{ key: 'theme-color', name: 'theme-color', content: computed(() => (colorMode.value === 'dark' ? '#18181b' : 'white')) }]
})
</script>

<template>
  <UApp :locale="pt_br">
    <NuxtLoadingIndicator />

    <NuxtLayout v-if="chave">
      <NuxtPage />
    </NuxtLayout>
    <PainelLogin v-else />
  </UApp>
</template>
