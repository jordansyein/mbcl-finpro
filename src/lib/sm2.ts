import type { Confidence } from './types'

// Deterministic SM-2 spaced repetition. Scheduling is never decided by an
// LLM call — quality (0-5) is the only input that comes from grading
// (exact-match, self-report, or Claude's pass/fail judgment mapped to a
// fixed integer), and everything below is plain arithmetic.

export interface SM2State {
  ease_factor: number
  interval_days: number
  repetitions: number
}

export interface SM2Result extends SM2State {
  next_due_date: string // YYYY-MM-DD
}

export const DEFAULT_SM2_STATE: SM2State = {
  ease_factor: 2.5,
  interval_days: 0,
  repetitions: 0,
}

export function sm2(prev: SM2State, quality: number): SM2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  let { ease_factor, repetitions } = prev
  let interval_days: number

  if (q < 3) {
    repetitions = 0
    interval_days = 1
  } else {
    repetitions = prev.repetitions + 1
    if (repetitions === 1) interval_days = 1
    else if (repetitions === 2) interval_days = 6
    else interval_days = Math.round(prev.interval_days * ease_factor)
  }

  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ease_factor < 1.3) ease_factor = 1.3

  const next = new Date()
  next.setDate(next.getDate() + interval_days)
  const next_due_date = next.toISOString().slice(0, 10)

  return { ease_factor, interval_days, repetitions, next_due_date }
}

// Deterministic confidence transition, separate from scheduling. A pass
// nudges confidence up one rung; any fail snaps it back to 'shaky' and
// (re)opens it as a weak point.
export function nextConfidence(current: Confidence, quality: number): Confidence {
  if (quality < 3) return 'shaky'
  if (current === 'shaky') return 'okay'
  if (current === 'okay') return 'solid'
  return 'solid'
}

// Fixed mapping from self-report / exact-match grading buttons to SM-2
// quality. Kept as a table, not a computation, so it's obviously deterministic.
export const SELF_GRADE_QUALITY = {
  again: 1,
  good: 4,
  easy: 5,
} as const
export type SelfGrade = keyof typeof SELF_GRADE_QUALITY

// Fixed mapping from Claude's pass/fail judgment (used for grammar and
// error-correction drills, where more than one phrasing can be valid) to
// SM-2 quality. Claude never picks the quality number or interval itself.
export const CLAUDE_GRADE_QUALITY = {
  pass: 4,
  fail: 2,
} as const

export function daysOverdue(nextDueDate: string): number {
  const due = new Date(nextDueDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - due.getTime()) / 86_400_000)
}
