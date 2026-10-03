<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

// Top of the sidebar, in the place and shape of the template's TeamsMenu:
// the panel name, and the two sources it reads from.
defineProps<{ collapsed?: boolean }>()

const items: DropdownMenuItem[][] = [[{
  type: 'label',
  label: 'Fontes do painel'
}], [{
  label: 'Workspace produtos no ENSPACE',
  icon: 'i-lucide-external-link',
  to: 'https://be.enspace.io/workspaces/produtos',
  target: '_blank'
}, {
  label: 'Microsoft Clarity',
  icon: 'i-lucide-external-link',
  to: 'https://clarity.microsoft.com/',
  target: '_blank'
}]]
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-56' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :avatar="{ icon: 'i-lucide-activity', ui: { root: 'bg-primary/10', icon: 'text-primary' } }"
      :label="collapsed ? undefined : 'UX Analytics'"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
