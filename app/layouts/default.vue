<script setup lang="ts">
// The shell of the Nuxt UI dashboard template: sidebar with the app menu on
// top, page groups, the access menu at the bottom, and a search (Cmd+K) that
// also runs the period and appearance commands.
const { links, open, go } = useNavigation()
const period = usePeriod()
const colorMode = useColorMode()
const { set: setChave } = usePainelChave()
usePageShortcuts()

const groups = computed(() => [{
  id: 'paginas',
  label: 'Ir para',
  items: Object.values(PAGES).map(page => ({
    label: page.label,
    icon: page.icon,
    kbds: ['g', page.key],
    onSelect: () => go(page)
  }))
}, {
  id: 'periodo',
  label: 'Período',
  items: [
    ...PRESETS.map(preset => ({
      label: preset.label,
      icon: 'i-lucide-calendar',
      suffix: period.preset.value === preset.key ? 'atual' : undefined,
      onSelect: () => period.setPreset(preset.key)
    })),
    {
      label: period.compare.value ? 'Parar de comparar com o período anterior' : 'Comparar com o período anterior',
      icon: 'i-lucide-git-compare',
      onSelect: () => period.setCompare(!period.compare.value)
    }
  ]
}, {
  id: 'aparencia',
  label: 'Aparência',
  items: [
    { label: 'Claro', icon: 'i-lucide-sun', onSelect: () => { colorMode.preference = 'light' } },
    { label: 'Escuro', icon: 'i-lucide-moon', onSelect: () => { colorMode.preference = 'dark' } },
    { label: 'Do sistema', icon: 'i-lucide-monitor', onSelect: () => { colorMode.preference = 'system' } }
  ]
}, {
  id: 'acesso',
  label: 'Acesso',
  items: [{ label: 'Sair e esquecer a senha neste navegador', icon: 'i-lucide-log-out', onSelect: () => setChave(null) }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <AppMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" label="Buscar..." class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <AccessMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" placeholder="Buscar página ou comando..." :color-mode="false" />

    <slot />
  </UDashboardGroup>
</template>
