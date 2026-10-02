// Row shapes of the dashboard schema (sql/09), as the API returns them.

export interface PeriodKpis {
  days_in_period: number
  days_collected: number
  sessions: number | null
  bot_sessions: number | null
  avg_daily_users: number | null
  pages_per_session: number | null
  time_total_avg_seconds: number | null
  time_active_avg_seconds: number | null
  scroll_depth_avg_pct: number | null
  dead_click_sessions_pct: number | null
  rage_click_sessions_pct: number | null
  quickback_sessions_pct: number | null
  excessive_scroll_sessions_pct: number | null
  script_error_sessions_pct: number | null
  error_click_sessions_pct: number | null
  dead_click_events: number | null
  rage_click_events: number | null
  quickback_events: number | null
  excessive_scroll_events: number | null
  script_error_events: number | null
  error_click_events: number | null
}

export interface KpisResponse {
  period: { from: string, to: string }
  current: PeriodKpis
  previousPeriod: { from: string, to: string }
  previous: PeriodKpis | null
}

export interface ScreenFriction {
  metric_group: string
  screen: string
  device: string | null
  sessions: number | null
  events: number | null
  sessions_with_pct: number | null
  paths: number
  days_present: number
  days_in_period: number
}

// Traffic, time and scroll per screen, from the same screen slices.
// sessions adds up the sessions of every URL of the screen, so a session that
// opened two tasks counts twice. users_upper_bound is a plain sum of daily
// distinct users: an upper bound, never a user count.
export interface ScreenEngagement {
  screen: string
  device: string | null
  sessions: number | null
  bot_sessions: number | null
  users_upper_bound: number | null
  pages_per_session: number | null
  active_time_avg_seconds: number | null
  total_time_avg_seconds: number | null
  scroll_depth_avg_pct: number | null
  paths: number
  days_present: number
  days_in_period: number
}

export interface UrlFriction {
  metric_group: string
  url: string
  screen: string
  device: string | null
  sessions: number | null
  events: number | null
  sessions_with_pct: number | null
  days_present: number
  days_in_period: number
}

export interface DeviceFriction {
  metric_group: string
  device: string
  sessions: number | null
  events: number | null
  sessions_with_pct: number | null
  days_present: number
}

export interface TechFriction {
  metric_group: string
  browser: string
  os: string
  sessions: number | null
  events: number | null
  sessions_with_pct: number | null
  days_present: number
}

export interface AudienceRow {
  metric_group: string
  label: string
  sessions: number
  share_pct: number | null
  days_present: number
}

export interface DeepMetric {
  period_start: string
  period_end: string
  window_days: number
  is_calendar_month: boolean
  lens_type: string
  lens_name: string
  clarity_label: string
  metric_name: string
  unit: string
  dimension_value: string
  step_order: number | null
  metric_value: number | null
  value_base: number | null
  unit_base: string
  overall_value_base: number | null
  diff_base: number | null
  slice_aggregation: string | null
  higher_is_better: boolean | null
}

export interface DeepReading {
  period_start: string
  period_end: string
  window_days: number
  is_calendar_month: boolean
  rows: number
}

export interface DeepResponse {
  readings: DeepReading[]
  reading: DeepReading | null
  rows: DeepMetric[]
}

export interface CoverageRow {
  metric_date: string
  breakdown_type: string
  landed: boolean
  curated: boolean
}

export interface QualityRow {
  check_name: string
  severity: 'erro' | 'revisar'
  ref: string
  detail: string
  rows: number
}

export interface CollectionCall {
  source_id: number
  metric_date: string
  breakdown_type: string
  http_status: number
  has_payload: boolean
  fetched_local: string
  hours_off_civil_day: number
  transformed_at: string | null
  is_canonical: boolean
}

export interface HealthResponse {
  coverage: CoverageRow[]
  quality: QualityRow[]
  offHours: CollectionCall[]
  queued: number
}
