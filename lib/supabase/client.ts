// lib/supabase/client.ts
'use client'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Defina o tipo do cliente para reutilização
type SupabaseClient = ReturnType<typeof createSupabaseClient>

// Crie uma variável "cache" no escopo do módulo
let supabaseInstance: SupabaseClient | null = null

export const createClient = () => {
  // Se a instância já existir no cache, retorne-a
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Se não, crie uma nova instância, armazene-a no cache e retorne-a
  // O process.env irá ler automaticamente do seu .env.local
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
}