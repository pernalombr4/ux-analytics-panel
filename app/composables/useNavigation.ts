import type { NavigationMenuItem } from '@nuxt/ui'

// Every page of the panel, in one place: the sidebar, the search (Cmd+K) and
// the keyboard shortcuts read from here, as in the Nuxt UI dashboard template.
export interface PanelPage {
  label: string
  icon: string
  path: string
  /** "g" then this key opens the page. */
  key: string
  /** Pages that aggregate the chosen period keep it when you move between them. */
  periodic: boolean
}

export const PAGES = {
  panorama: { label: 'Panorama', icon: 'i-lucide-layout-dashboard', path: '/', key: 'p', periodic: true },
  telas: { label: 'Atrito por tela', icon: 'i-lucide-mouse-pointer-click', path: '/telas', key: 't', periodic: true },
  dispositivos: { label: 'Desktop × Mobile', icon: 'i-lucide-smartphone', path: '/dispositivos', key: 'd', periodic: true },
  audiencia: { label: 'Audiência', icon: 'i-lucide-users', path: '/audiencia', key: 'a', periodic: true },
  profundas: { label: 'Segmentos e funis', icon: 'i-lucide-filter', path: '/profundas', key: 'f', periodic: false },
  qualidade: { label: 'Riscos por área', icon: 'i-lucide-shield-check', path: '/qualidade', key: 'q', periodic: true },
  chamados: { label: 'Chamados', icon: 'i-lucide-headset', path: '/chamados', key: 'c', periodic: true },
  saude: { label: 'Saúde dos dados', icon: 'i-lucide-heart-pulse', path: '/saude', key: 's', periodic: false }
} satisfies Record<string, PanelPage>

export function useNavigation() {
  const route = useRoute()
  const router = useRouter()
  const open = useState('sidebar-open', () => false)

  const target = (page: PanelPage) => page.periodic
    ? { path: page.path, query: { from: route.query.from, to: route.query.to, compare: route.query.compare } }
    : page.path
  const go = (page: PanelPage) => router.push(target(page))

  const item = (page: PanelPage, extra: Partial<NavigationMenuItem> = {}): NavigationMenuItem => ({
    label: page.label,
    icon: page.icon,
    to: target(page),
    onSelect: () => { open.value = false },
    ...extra
  })

  // Two groups, as in the template: the pages on top, support at the bottom.
  const links = computed<NavigationMenuItem[][]>(() => [[
    item(PAGES.panorama),
    {
      label: 'Uso do produto',
      icon: 'i-lucide-activity',
      type: 'trigger',
      defaultOpen: true,
      children: [item(PAGES.telas), item(PAGES.dispositivos), item(PAGES.audiencia), item(PAGES.profundas)]
    },
    {
      label: 'Qualidade',
      icon: 'i-lucide-shield-check',
      type: 'trigger',
      defaultOpen: true,
      children: [item(PAGES.qualidade), item(PAGES.chamados)]
    }
  ], [
    item(PAGES.saude),
    {
      label: 'Sobre o painel',
      icon: 'i-lucide-info',
      to: 'https://github.com/pernalombr4/ux-analytics-panel#readme',
      target: '_blank'
    }
  ]])

  return { links, open, go, target }
}

/** g + key opens a page, as the template's g-h, g-i... */
export function usePageShortcuts() {
  const { go } = useNavigation()
  defineShortcuts(Object.fromEntries(Object.values(PAGES).map(page => [`g-${page.key}`, () => go(page)])))
}
