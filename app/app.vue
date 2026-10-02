<script setup lang="ts">
// No passphrase, no app: the login screen stands in until one is accepted.
const { chave } = usePainelChave()
</script>

<template>
  <UApp>
    <NuxtLayout v-if="chave">
      <NuxtPage />
    </NuxtLayout>
    <PainelLogin v-else />
  </UApp>
</template>
