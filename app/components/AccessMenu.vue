<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

// Bottom of the sidebar, in the place and shape of the template's UserMenu.
// There are no users here, only the panel passphrase, so the menu holds what
// the template's does that still applies: theme, appearance, leaving.
defineProps<{ collapsed?: boolean }>()

const colorMode = useColorMode()
const appConfig = useAppConfig()
const { set: setChave } = usePainelChave()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

// The chosen theme stays in this browser (a convenience; nothing breaks
// without storage).
const THEME_KEY = 'ux-analytics.tema'
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY) || 'null')
    if (saved?.primary) appConfig.ui.colors.primary = saved.primary
    if (saved?.neutral) appConfig.ui.colors.neutral = saved.neutral
  } catch { /* no storage, default theme */ }
})
function saveTheme() {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify({ primary: appConfig.ui.colors.primary, neutral: appConfig.ui.colors.neutral }))
  } catch { /* no storage */ }
}

const items = computed<DropdownMenuItem[][]>(() => [[{
  type: 'label',
  label: 'Acesso por senha do painel',
  avatar: { icon: 'i-lucide-key-round' }
}], [{
  label: 'Tema',
  icon: 'i-lucide-palette',
  children: [{
    label: 'Cor principal',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: { align: 'center', collisionPadding: 16 },
    children: colors.map(color => ({
      label: color,
      chip: color,
      slot: 'chip',
      checked: appConfig.ui.colors.primary === color,
      type: 'checkbox',
      onSelect: (e: Event) => {
        e.preventDefault()
        appConfig.ui.colors.primary = color
        saveTheme()
      }
    }))
  }, {
    label: 'Neutra',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: { align: 'end', collisionPadding: 16 },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: appConfig.ui.colors.neutral === color,
      onSelect: (e: Event) => {
        e.preventDefault()
        appConfig.ui.colors.neutral = color
        saveTheme()
      }
    }))
  }]
}, {
  label: 'Aparência',
  icon: 'i-lucide-sun-moon',
  children: [
    { label: 'Claro', icon: 'i-lucide-sun', value: 'light' },
    { label: 'Escuro', icon: 'i-lucide-moon', value: 'dark' },
    { label: 'Do sistema', icon: 'i-lucide-monitor', value: 'system' }
  ].map(option => ({
    label: option.label,
    icon: option.icon,
    type: 'checkbox' as const,
    checked: colorMode.preference === option.value,
    onSelect: (e: Event) => {
      e.preventDefault()
      colorMode.preference = option.value
    }
  }))
}], [{
  label: 'Sair e esquecer a senha neste navegador',
  icon: 'i-lucide-log-out',
  onSelect: () => setChave(null)
}]])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-64' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :avatar="{ icon: 'i-lucide-key-round' }"
      :label="collapsed ? undefined : 'Acesso'"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
