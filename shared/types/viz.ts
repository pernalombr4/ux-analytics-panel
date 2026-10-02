// Row shapes the chart components take (app/components/viz).

export interface RankingRow {
  key: string
  label: string
  value: number | null
  detail?: string
  tooltip?: string
}

export interface DivergingRow {
  key: string
  label: string
  diff: number | null
  better: boolean | null
  detail?: string
  tooltip?: string
}

export interface DumbbellRow {
  key: string
  label: string
  a: number | null
  b: number | null
  detail?: string
}

export interface GroupedRow {
  key: string
  label: string
  values: { series: string, value: number | null, tooltip?: string }[]
}

export interface HeatCell {
  row: string
  col: string
  value: number | null
  tooltip?: string
}

export interface ScatterPoint {
  key: string
  label: string
  x: number
  y: number
  tooltip?: string
}
