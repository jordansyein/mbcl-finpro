import { supabase } from './supabaseClient'

// Whether a password is set can't be read from the client-side user/session
// object (Supabase never exposes encrypted_password), so this calls a
// SECURITY DEFINER Postgres function that checks the caller's own row.
// Returns null if the check itself fails (e.g. migration not yet applied)
// so the UI can fall back to a neutral label instead of guessing.
export async function checkHasPassword(): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('user_has_password')
  if (error) return null
  return !!data
}

export async function setPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
