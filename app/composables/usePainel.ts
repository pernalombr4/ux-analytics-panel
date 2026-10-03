// Every number on the dashboard comes from one Supabase function,
// public.painel, called straight from the browser. It answers only with the
// panel passphrase; without it the Data API returns 403 and the app asks again.

export type PainelResource =
  | 'ping' | 'kpis' | 'telas' | 'engajamento' | 'urls'
  | 'dispositivos' | 'tecnologia' | 'audiencia' | 'profundas' | 'saude'
  | 'qualidade' | 'chamados'

export interface PainelParams {
  from?: string
  to?: string
  options?: Record<string, unknown>
}

const STORAGE_KEY = 'ux-analytics.chave'

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** The passphrase for this browser tab, remembered in localStorage when asked to. */
export function usePainelChave() {
  const chave = useState<string | null>('painel-chave', () => (import.meta.client ? readStored() : null))

  function set(value: string | null, remember = true) {
    chave.value = value
    try {
      if (value && remember) localStorage.setItem(STORAGE_KEY, value)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Private windows can refuse storage: the passphrase then lasts the tab.
    }
  }

  return { chave, set }
}

interface PainelConfig {
  supabaseUrl: string
  supabaseKey: string
}

/** One call to public.painel. Throws a NuxtError with the HTTP status. */
export async function fetchPainel<T>(config: PainelConfig, chave: string | null, recurso: PainelResource, params: PainelParams = {}): Promise<T> {
  try {
    return await $fetch<T>(`${config.supabaseUrl}/rest/v1/rpc/painel`, {
      method: 'POST',
      headers: { apikey: config.supabaseKey },
      // painel only reads, so a POST is safe to repeat. Retries cover a dropped
      // connection and 5xx/429; a wrong passphrase (403) fails at once.
      retry: 2,
      retryDelay: 600,
      body: {
        p_chave: chave ?? '',
        p_recurso: recurso,
        p_de: params.from ?? null,
        p_ate: params.to ?? null,
        p_opcoes: params.options ?? {}
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
export function usePainel<T>(
  recurso: PainelResource,
  params: () => PainelParams = () => ({}),
  options: { enabled?: () => boolean } = {}
) {
  const config = useRuntimeConfig().public as unknown as PainelConfig
  const { chave, set } = usePainelChave()
  const enabled = options.enabled ?? (() => true)

  return useAsyncData<T | null>(
    () => `painel:${recurso}:${enabled() ? JSON.stringify(params()) : 'off'}`,
    async () => {
      if (!enabled()) return null
      try {
        return await fetchPainel<T>(config, chave.value, recurso, params())
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode === 403) set(null)
        throw error
      }
    }
  )
}
