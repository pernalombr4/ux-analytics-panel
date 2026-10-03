// Row shapes the chart components take (app/components/viz).

// One column of a DataTable (app/components/DataTable.vue, over the ENSPACE
// EnTable). `key` names the column and the cell slot; without `text` the cell
// shows row[key] as it is.
export interface DataColumn<R> {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  text?: (row: R) => string | number | null | undefined
}

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

// UnovisBars: one row per category, one value per series, same order as series.
export interface BarSeries {
  name: string
  color: string
}

export interface BarRow {
  key: string
  label: string
  values: (number | null)[]
  notes?: string[]
}
