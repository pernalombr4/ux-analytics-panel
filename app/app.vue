<script setup lang="ts">
// No passphrase, no app: the login screen stands in until one is accepted.
const { passphrase } = usePanelPassphrase()

// As in the template: the browser bar follows the colour mode.
const colorMode = useColorMode()
useHead({
  meta: [{ key: 'theme-color', name: 'theme-color', content: computed(() => (colorMode.value === 'dark' ? '#18181b' : 'white')) }]
})
</script>

<template>
  <!-- EnApp (ENSPACE SDK) wraps Nuxt UI's UApp and sets the locale of both. -->
  <EnApp locale="pt-BR">
    <NuxtLoadingIndicator />

    <NuxtLayout v-if="passphrase">
      <NuxtPage />
    </NuxtLayout>
    <PanelLogin v-else />
  </EnApp>
</template>
