/**
 * Supabase browser client — singleton para usar em Client Components.
 * Usado exclusivamente para Realtime (postgres_changes) e Presence.
 * Dados protegidos são acessados via /api/proxy com cookie de auth.
 *
 * A inicialização é lazy: o cliente só é criado na primeira chamada a
 * getSupabase(), evitando que a validação de env vars quebre páginas
 * que importam este módulo mas não chegam a usar o Realtime.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Returns the Supabase browser client, or null when env vars are not
 * configured. Callers must handle null gracefully (Realtime simply
 * won't work, but the page should still render).
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[supabase-client] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set — Realtime disabled.',
    )
    return null
  }

  _client = createClient(supabaseUrl, supabaseAnonKey)
  return _client
}
