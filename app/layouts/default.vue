<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { set: setChave } = usePainelChave()
const sair = () => setChave(null)

// Keep the period when moving between pages.
const withPeriod = (path: string) => ({ path, query: { from: route.query.from, to: route.query.to, compare: route.query.compare } })

const links = computed<NavigationMenuItem[]>(() => [
  { label: 'Panorama', icon: 'i-lucide-layout-dashboard', to: withPeriod('/') },
  { label: 'Atrito por tela', icon: 'i-lucide-mouse-pointer-click', to: withPeriod('/telas') },
  { label: 'Desktop × Mobile', icon: 'i-lucide-smartphone', to: withPeriod('/dispositivos') },
  { label: 'Audiência', icon: 'i-lucide-users', to: withPeriod('/audiencia') },
  { label: 'Segmentos e funis', icon: 'i-lucide-filter', to: '/profundas' },
  { label: 'Saúde dos dados', icon: 'i-lucide-heart-pulse', to: '/saude' }
])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      id="main"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1 min-w-0">
          <UIcon name="i-lucide-activity" class="size-5 shrink-0 text-primary" />
          <span v-if="!collapsed" class="font-semibold truncate">UX Analytics</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" tooltip />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center justify-between w-full gap-2">
          <span v-if="!collapsed" class="text-xs text-muted">Dados: Microsoft Clarity</span>
          <div class="flex items-center gap-1">
            <UColorModeButton />
            <UTooltip text="Sair e esquecer a senha neste navegador">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-log-out"
                aria-label="Sair"
                @click="sair"
              />
            </UTooltip>
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
