import { createClient } from '@supabase/supabase-js'

// Pegamos as chaves do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Criamos o cliente apenas se as chaves existirem
export const supabase = createClient(supabaseUrl, supabaseAnonKey)