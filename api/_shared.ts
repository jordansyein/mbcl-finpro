import type { IncomingMessage, ServerResponse } from 'http'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new HttpError(500, 'ANTHROPIC_API_KEY is not configured on the server')
  return new Anthropic({ apiKey })
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Works whether the body has already been parsed by the host (Vercel) or
// arrives as a raw stream (our local Vite dev middleware).
export async function readJsonBody<T = any>(req: IncomingMessage & { body?: unknown }): Promise<T> {
  if (req.body && typeof req.body === 'object') return req.body as T
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {} as T
  return JSON.parse(raw) as T
}

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// Every /api route spends the deployment owner's Anthropic credits, so it
// must only run for the app's own authenticated user, verified against
// Supabase using the bearer token the client attaches.
export async function requireUser(req: IncomingMessage): Promise<string> {
  const auth = req.headers['authorization']
  const token = Array.isArray(auth) ? auth[0] : auth
  const bearer = token?.startsWith('Bearer ') ? token.slice(7) : undefined
  if (!bearer) throw new HttpError(401, 'Missing Authorization bearer token')

  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new HttpError(500, 'Supabase server env vars are not configured')

  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase.auth.getUser(bearer)
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session')
  return data.user.id
}

// Claude is instructed to respond with JSON only, but strips fences /
// leading prose defensively in case it doesn't comply exactly.
export function extractJsonBlock(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const startArr = candidate.indexOf('[')
  const useArr = startArr !== -1 && (start === -1 || startArr < start)
  const closeChar = useArr ? ']' : '}'
  const from = useArr ? startArr : start
  if (from === -1) throw new Error('No JSON found in model response')
  const to = candidate.lastIndexOf(closeChar)
  if (to === -1 || to < from) throw new Error('No JSON found in model response')
  return JSON.parse(candidate.slice(from, to + 1))
}

export async function withHandler(
  req: IncomingMessage,
  res: ServerResponse,
  fn: () => Promise<unknown>
) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed')
    const result = await fn()
    sendJson(res, 200, result)
  } catch (err) {
    if (err instanceof HttpError) {
      sendJson(res, err.status, { error: err.message })
    } else {
      // eslint-disable-next-line no-console
      console.error(err)
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Internal error' })
    }
  }
}
