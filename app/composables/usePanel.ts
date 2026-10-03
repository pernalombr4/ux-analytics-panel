// Every number on the dashboard comes from one Supabase function,
// public.panel, called straight from the browser. It answers only with the
// panel passphrase; without it the Data API returns 403 and the app asks again.

export type PanelResource =
  | 'ping' | 'kpis' | 'screens' | 'engagement' | 'urls'
  | 'devices' | 'technology' | 'audience' | 'deep_metrics' | 'health'
  | 'quality' | 'requests'

export interface PanelParams {
  from?: string
  to?: string
  options?: Record<string, unknown>
}

const STORAGE_KEY = 'ux-analytics.passphrase'
// Key used before the English rename: read once so nobody is signed out.
const LEGACY_STORAGE_KEY = 'ux-analytics.chave'

function readStored(): string | null {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy !== null) {
      localStorage.setItem(STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** The passphrase for this browser tab, remembered in localStorage when asked to. */
export function usePanelPassphrase() {
  const passphrase = useState<string | null>('panel-passphrase', () => (import.meta.client ? readStored() : null))

  function set(value: string | null, remember = true) {
    passphrase.value = value
    try {
      if (value && remember) localStorage.setItem(STORAGE_KEY, value)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Private windows can refuse storage: the passphrase then lasts the tab.
    }
  }

  return { passphrase, set }
}

interface PanelConfig {
  supabaseUrl: string
  supabaseKey: string
}

/** One call to public.panel. Throws a NuxtError with the HTTP status. */
export async function fetchPanel<T>(config: PanelConfig, passphrase: string | null, resource: PanelResource, params: PanelParams = {}): Promise<T> {
  try {
    return await $fetch<T>(`${config.supabaseUrl}/rest/v1/rpc/panel`, {
      method: 'POST',
      headers: { apikey: config.supabaseKey },
      // panel only reads, so a POST is safe to repeat. Retries cover a dropped
      // connection and 5xx/429; a wrong passphrase (403) fails at once.
      retry: 2,
      retryDelay: 600,
      body: {
        p_passphrase: passphrase ?? '',
        p_resource: resource,
        p_from: params.from ?? null,
        p_to: params.to ?? null,
        p_options: params.options ?? {}
      }
    })
  } catch (error) {
    const failure = error as { response?: { status?: number }, data?: { message?: string }, message?: string }
    const status = failure.response?.status ?? 0
    const message = status === 403
      ? 'Senha do painel incorreta.'
      : status === 0
        ? 'Não foi possível falar com o Supabase. Confira a conexão e tente de novo.'
        : failure.data?.message ?? failure.message ?? 'O Supabase recusou a consulta.'
    throw createError({ statusCode: status || 503, statusMessage: message })
  }
}

/**
 * Reactive read of one resource. The key carries the params, so a new period
 * or a new screen is a new fetch. `enabled` false skips the call (data null),
 * for reads that wait on a choice. A 403 means the passphrase changed: it is
 * forgotten and the login screen comes back.
 */
export function usePanel<T>(
  resource: PanelResource,
  params: () => PanelParams = () => ({}),
  options: { enabled?: () => boolean } = {}
) {
  const config = useRuntimeConfig().public as unknown as PanelConfig
  const { passphrase, set } = usePanelPassphrase()
  const enabled = options.enabled ?? (() => true)

  return useAsyncData<T | null>(
    () => `panel:${resource}:${enabled() ? JSON.stringify(params()) : 'off'}`,
    async () => {
      if (!enabled()) return null
      try {
        return await fetchPanel<T>(config, passphrase.value, resource, params())
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode === 403) set(null)
        throw error
      }
    }
  )
}
