import type { NavigationMenuItem } from '@nuxt/ui'

// Every page of the panel, in one place: the sidebar, the search (Cmd+K) and
// the keyboard shortcuts read from here, as in the Nuxt UI dashboard template.
export interface PanelPage {
  label: string
  /** Name inside its sidebar group, where the group already gives the context. */
  short?: string
  icon: string
  path: string
  /** "g" then this key opens the page. */
  key: string
  /** Pages that aggregate the chosen period keep it when you move between them. */
  periodic: boolean
}

export const PAGES = {
  panorama: { label: 'Panorama', icon: 'i-lucide-layout-dashboard', path: '/', key: 'p', periodic: true },
  uso: { label: 'Visão geral do uso', short: 'Visão geral', icon: 'i-lucide-gauge', path: '/uso', key: 'u', periodic: true },
  audiencia: { label: 'Audiência', icon: 'i-lucide-users', path: '/audiencia', key: 'a', periodic: true },
  profundas: { label: 'Segmentos, funis e eventos', short: 'Segmentos e funis', icon: 'i-lucide-filter', path: '/profundas', key: 'f', periodic: false },
  telas: { label: 'Atrito por tela', short: 'Por tela', icon: 'i-lucide-app-window', path: '/telas', key: 't', periodic: true },
  dispositivos: { label: 'Desktop × Mobile', icon: 'i-lucide-smartphone', path: '/dispositivos', key: 'd', periodic: true },
  qualidade: { label: 'Riscos por área', icon: 'i-lucide-shield-alert', path: '/qualidade', key: 'q', periodic: true },
  chamados: { label: 'Chamados', icon: 'i-lucide-headset', path: '/chamados', key: 'c', periodic: true },
  saude: { label: 'Saúde dos dados', icon: 'i-lucide-heart-pulse', path: '/saude', key: 's', periodic: false }
} satisfies Record<string, PanelPage>

export interface PanelSection {
  /** Section title in the sidebar; none for Panorama, which joins the sources. */
  label?: string
  /** Name of the section in the search. */
  search: string
  groups: { label: string, icon: string, pages: PanelPage[] }[]
  /** Pages shown straight, outside a group. */
  pages?: PanelPage[]
}

// The sidebar by source: Panorama joins both, then Clarity (how the product
// is used) and ENSPACE (what the produtos workspace records), each with its
// groups. The panel's own pages sit at the bottom.
export const SECTIONS: PanelSection[] = [
  { search: 'Panorama', pages: [PAGES.panorama], groups: [] },
  {
    label: 'Clarity · uso do produto',
    search: 'Clarity',
    groups: [
      { label: 'Uso', icon: 'i-lucide-activity', pages: [PAGES.uso, PAGES.audiencia, PAGES.profundas] },
      { label: 'Atrito', icon: 'i-lucide-mouse-pointer-click', pages: [PAGES.telas, PAGES.dispositivos] }
    ]
  },
  {
    label: 'ENSPACE · qualidade do produto',
    search: 'ENSPACE',
    groups: [
      { label: 'Qualidade', icon: 'i-lucide-shield-check', pages: [PAGES.qualidade, PAGES.chamados] }
    ]
  }
]
// Over several lines on purpose: written on one line, Nuxt's scan of the
// exports (mlly) loses the function right after it, useNavigation.
export const FOOTER_SECTION: PanelSection = {
  search: 'Painel',
  pages: [PAGES.saude],
  groups: []
}

export function useNavigation() {
  const route = useRoute()
  const router = useRouter()
  const open = useState('sidebar-open', () => false)

  const target = (page: PanelPage) => page.periodic
    ? { path: page.path, query: { from: route.query.from, to: route.query.to, compare: route.query.compare } }
    : page.path
  const go = (page: PanelPage) => router.push(target(page))

  const item = (page: PanelPage, inGroup = false): NavigationMenuItem => ({
    label: inGroup ? page.short ?? page.label : page.label,
    icon: page.icon,
    to: target(page),
    onSelect: () => { open.value = false }
  })

  const section = (s: PanelSection): NavigationMenuItem[] => [
    ...(s.label ? [{ label: s.label, type: 'label' as const }] : []),
    ...(s.pages ?? []).map(page => item(page)),
    ...s.groups.map(group => ({
      label: group.label,
      icon: group.icon,
      type: 'trigger' as const,
      defaultOpen: true,
      children: group.pages.map(page => item(page, true))
    }))
  ]

  // Top menu: one group per section. Bottom menu: the panel itself.
  const links = computed<NavigationMenuItem[][]>(() => SECTIONS.map(section))
  const footerLinks = computed<NavigationMenuItem[]>(() => [
    ...section(FOOTER_SECTION),
    {
      label: 'Sobre o painel',
      icon: 'i-lucide-info',
      to: 'https://github.com/pernalombr4/ux-analytics-panel#readme',
      target: '_blank'
    }
  ])

  return { links, footerLinks, open, go, target }
}

/** Every page of a section, groups included, in sidebar order. */
export function sectionPages(s: PanelSection): PanelPage[] {
  return [...(s.pages ?? []), ...s.groups.flatMap(g => g.pages)]
}

/** g + key opens a page, as the template's g-h, g-i... */
export function usePageShortcuts() {
  const { go } = useNavigation()
  defineShortcuts(Object.fromEntries(Object.values(PAGES).map(page => [`g-${page.key}`, () => go(page)])))
}
