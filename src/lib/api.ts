import { supabase } from './supabaseClient'
import type { DrillContent, ExtractedItemRaw, Item } from './types'

async function authedFetch(path: string, body: unknown): Promise<any> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error || `Request to ${path} failed (${res.status})`)
  }
  return json
}

export async function extractFromPhoto(imageBase64: string, mediaType: string): Promise<ExtractedItemRaw[]> {
  const json = await authedFetch('/api/extract', { imageBase64, mediaType })
  return json.items ?? []
}

export async function generateDrill(item: Pick<Item, 'item_type' | 'content' | 'reading' | 'meaning' | 'example_sentence' | 'source_correction'>): Promise<DrillContent & { reading?: string; meaning?: string; example_sentence?: string }> {
  const json = await authedFetch('/api/generate-drill', { item })
  return json.drill
}

export interface GradeResult {
  pass: boolean
  feedback: string
}

export async function gradeProduction(params: {
  item_type: 'grammar' | 'corrected_sentence'
  prompt: string
  expected?: string
  userAnswer: string
}): Promise<GradeResult> {
  const json = await authedFetch('/api/grade', params)
  return { pass: !!json.pass, feedback: json.feedback ?? '' }
}
