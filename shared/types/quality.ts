// Shapes of the quality resources of public.panel (sql/14 of ux-analytics):
// Chamados and Demandas of the ENSPACE produtos workspace.

export interface QualityKpis {
  demands: number
  defects: number
  defects_open: number
  defects_top: number
  defects_top_open: number
  top_priority: string | null
  from_requests: number
  rework: number
  defects_no_area: number
  area_inherited: number
  demands_no_status: number
  requests: number
  requests_open: number
  request_bugs: number
  requests_validated: number
  recurrences: number
  sla_breached: number
  requests_with_demand: number
  csat: number | null
  csat_n: number
  release_version: string | null
  release_deployed_on: string | null
  after_release: number
  inferred: number
  loaded_at: string | null
}

export interface QualityArea {
  area_key: string | null
  area: string
  product: string | null
  defects: number
  defects_open: number
  open_unknown: number
  score: number
  by_priority: Record<string, number>
  no_priority: number
  from_requests: number
  after_release: number
  rework: number
  other_demands: number
  area_inherited: number
  requests: number
  requests_open: number
  request_bugs: number
  recurrences: number
  sla_breached: number
  csat: number | null
  csat_n: number
}

export interface QualitySubarea {
  area_key: string
  subarea_key: string | null
  subarea: string
  requests: number
  defects: number
}

export interface QualityUsage {
  area_key: string | null
  metric_group: string
  screens: number
  visits: number | null
  affected: number | null
}

export interface QualityLabels {
  areas: { key: string, label: string, product: string }[]
  priorities: { key: string, label: string, weight: number }[]
  requestTypes: { key: string, label: string }[]
  clients: { key: string, label: string, tier: string | null }[]
  options: { category: string, field: string, key: string, label: string }[]
}

export interface QualityResponse {
  period: { from: string, to: string }
  previousPeriod: { from: string, to: string }
  kpis: QualityKpis
  previous: QualityKpis
  areas: QualityArea[]
  previousAreas: QualityArea[]
  subareas: QualitySubarea[]
  usage: QualityUsage[]
  labels: QualityLabels
  totals: { demands: number, requests: number }
}

export interface RequestCubeRow {
  type_key: string | null
  area_key: string | null
  client_id: string | null
  origin: string | null
  outcome: string | null
  requests: number
  open: number
  validated: number
  with_demand: number
  recurrences: number
  sla_breached: number
  csat_sum: number | null
  csat_n: number
}

export interface RequestsResponse {
  period: { from: string, to: string }
  previousPeriod: { from: string, to: string }
  kpis: QualityKpis
  previous: QualityKpis
  cube: RequestCubeRow[]
  labels: QualityLabels
  totals: { demands: number, requests: number }
}
