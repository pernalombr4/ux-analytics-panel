// Display names. Keys are what Clarity and the database use.

export const FRICTION_GROUPS = [
  { key: 'DeadClickCount', label: 'Cliques mortos', column: 'dead_click' },
  { key: 'RageClickCount', label: 'Cliques de raiva', column: 'rage_click' },
  { key: 'QuickbackClick', label: 'Retornos rápidos', column: 'quickback' },
  { key: 'ExcessiveScroll', label: 'Rolagem excessiva', column: 'excessive_scroll' },
  { key: 'ScriptErrorCount', label: 'Erros de script', column: 'script_error' },
  { key: 'ErrorClickCount', label: 'Cliques com erro', column: 'error_click' }
] as const

export type FrictionKey = typeof FRICTION_GROUPS[number]['key']

export function frictionLabel(key: string): string {
  return FRICTION_GROUPS.find(group => group.key === key)?.label ?? key
}

/** Clarity says "PC". People say desktop. */
export function deviceLabel(device: string | null | undefined): string {
  switch ((device ?? '').toLowerCase()) {
    case 'pc': return 'Desktop'
    case 'mobile': return 'Mobile'
    case 'tablet': return 'Tablet'
    default: return 'Outro'
  }
}

export const AUDIENCE_LABELS: Record<string, string> = {
  Device: 'Dispositivo',
  Country: 'País',
  Browser: 'Navegador',
  OS: 'Sistema operacional',
  ReferrerUrl: 'Origem do acesso',
  PageTitle: 'Título da página',
  PopularPages: 'Páginas mais vistas'
}

export const METRIC_LABELS: Record<string, string> = {
  sessions: 'Sessões',
  users: 'Usuários',
  pages_per_session: 'Páginas por sessão',
  active_time_avg: 'Tempo ativo médio',
  total_time_avg: 'Tempo total médio',
  scroll_depth_avg: 'Profundidade de rolagem',
  dead_click_pct: 'Cliques mortos',
  rage_click_pct: 'Cliques de raiva',
  quick_back_pct: 'Retornos rápidos',
  excessive_scroll_pct: 'Rolagem excessiva',
  conversion_rate: 'Conversão',
  converted_sessions: 'Sessões convertidas',
  time_to_convert_median: 'Tempo até converter (mediana)',
  step_reached_pct: 'Chegaram ao passo',
  performance_score: 'Nota de desempenho',
  lcp: 'LCP',
  inp: 'INP',
  cls: 'CLS',
  share_good: 'Visualizações boas',
  share_needs_improvement: 'Precisam melhorar',
  share_poor: 'Ruins',
  page_views: 'Visualizações de página',
  sessions_with_error_pct: 'Sessões com erro de JS',
  total_errors: 'Erros de JS',
  error_share: 'Participação no total de erros',
  bot_session_pct: 'Sessões de bot',
  bot_sessions: 'Sessões de bot'
}

export function metricLabel(name: string): string {
  return METRIC_LABELS[name] ?? name
}
