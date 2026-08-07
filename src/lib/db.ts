import { supabase } from './supabaseClient'
import { DEFAULT_SM2_STATE, nextConfidence, sm2, daysOverdue } from './sm2'
import { generateDrill } from './api'
import type {
  CaptureMethod,
  DrillContent,
  Item,
  ItemDraft,
  Lesson,
  QueueItem,
  ReviewHistoryEntry,
} from './types'

const todayISO = () => new Date().toISOString().slice(0, 10)

export async function uploadLessonPhoto(userId: string, file: Blob, ext: string): Promise<string> {
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('lesson-photos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function createLessonWithItems(
  userId: string,
  lessonMeta: { capture_method: CaptureMethod; raw_photo_ref: string | null; notes: string | null },
  drafts: ItemDraft[]
): Promise<{ lesson: Lesson; items: Item[] }> {
  const included = drafts.filter((d) => d.included)
  if (included.length === 0) throw new Error('No items to save')

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .insert({
      user_id: userId,
      date: todayISO(),
      capture_method: lessonMeta.capture_method,
      raw_photo_ref: lessonMeta.raw_photo_ref,
      notes: lessonMeta.notes,
    })
    .select()
    .single()
  if (lessonErr) throw lessonErr

  const now = new Date().toISOString()
  const itemsPayload = included.map((d) => ({
    lesson_id: lesson.id,
    user_id: userId,
    item_type: d.item_type,
    content: d.content,
    reading: d.reading || null,
    meaning: d.meaning || null,
    example_sentence: d.example_sentence || null,
    source_correction: d.source_correction || null,
    confidence_at_log: d.confidence_at_log,
    confidence_current: d.confidence_at_log,
    shaky_since: d.confidence_at_log === 'shaky' ? now : null,
  }))

  const { data: items, error: itemsErr } = await supabase.from('items').insert(itemsPayload).select()
  if (itemsErr) throw itemsErr

  const reviewStatePayload = items.map((it: Item) => ({
    item_id: it.id,
    user_id: userId,
    ease_factor: DEFAULT_SM2_STATE.ease_factor,
    interval_days: DEFAULT_SM2_STATE.interval_days,
    repetitions: DEFAULT_SM2_STATE.repetitions,
    next_due_date: todayISO(),
  }))
  const { error: reviewErr } = await supabase.from('review_state').insert(reviewStatePayload)
  if (reviewErr) throw reviewErr

  return { lesson, items }
}

// Generates (or returns cached) drill content for an item, persisting the
// result and backfilling any reading/meaning/example gaps Claude supplies
// (mainly useful for kanji items split out of a vocab word).
export async function ensureDrill(item: Item): Promise<Item> {
  if (item.drill_content) return item
  const result = await generateDrill({
    item_type: item.item_type,
    content: item.content,
    reading: item.reading,
    meaning: item.meaning,
    example_sentence: item.example_sentence,
    source_correction: item.source_correction,
  })
  const { reading, meaning, example_sentence, ...drill } = result as any
  const patch: Partial<Item> = { drill_content: drill as DrillContent }
  if (!item.reading && reading) patch.reading = reading
  if (!item.meaning && meaning) patch.meaning = meaning
  if (!item.example_sentence && example_sentence) patch.example_sentence = example_sentence

  const { data, error } = await supabase.from('items').update(patch).eq('id', item.id).select().single()
  if (error) throw error
  return data as Item
}

export async function getDueQueue(userId: string, limit = 30): Promise<QueueItem[]> {
  const { data, error } = await supabase
    .from('review_state')
    .select('*, items!inner(*)')
    .eq('user_id', userId)
    .lte('next_due_date', todayISO())
    .order('next_due_date', { ascending: true })
  if (error) throw error

  const queue: QueueItem[] = (data ?? []).map((row: any) => ({ ...row.items, review_state: row }))

  queue.sort((a, b) => {
    const shakyA = a.confidence_current === 'shaky' ? 1 : 0
    const shakyB = b.confidence_current === 'shaky' ? 1 : 0
    if (shakyA !== shakyB) return shakyB - shakyA
    return daysOverdue(b.review_state.next_due_date) - daysOverdue(a.review_state.next_due_date)
  })

  return queue.slice(0, limit)
}

export async function recordReview(
  item: Item,
  drillType: ReviewHistoryEntry['drill_type'],
  quality: number,
  result: string,
  feedback: string | null
): Promise<void> {
  const { data: state, error: stateErr } = await supabase
    .from('review_state')
    .select('*')
    .eq('item_id', item.id)
    .single()
  if (stateErr) throw stateErr

  const next = sm2(state, quality)
  const { error: updateErr } = await supabase
    .from('review_state')
    .update({
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      next_due_date: next.next_due_date,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('item_id', item.id)
  if (updateErr) throw updateErr

  const { error: historyErr } = await supabase.from('review_history').insert({
    item_id: item.id,
    user_id: item.user_id,
    drill_type: drillType,
    quality,
    result,
    feedback,
  })
  if (historyErr) throw historyErr

  const newConfidence = nextConfidence(item.confidence_current, quality)
  const wasShaky = item.confidence_current === 'shaky'
  const isShaky = newConfidence === 'shaky'
  const shaky_since = isShaky ? (wasShaky ? item.shaky_since : new Date().toISOString()) : null

  const { error: itemErr } = await supabase
    .from('items')
    .update({ confidence_current: newConfidence, shaky_since })
    .eq('id', item.id)
  if (itemErr) throw itemErr
}

export async function getWeakPoints(userId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .eq('confidence_current', 'shaky')
    .order('shaky_since', { ascending: true })
  if (error) throw error
  return data as Item[]
}

export async function getLessons(userId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data as Lesson[]
}

export async function getLessonById(lessonId: string): Promise<Lesson> {
  const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
  if (error) throw error
  return data as Lesson
}

export async function getLessonPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('lesson-photos').createSignedUrl(path, 60 * 10)
  if (error) return null
  return data.signedUrl
}

export async function getLessonItems(lessonId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Item[]
}

export async function getItemHistory(itemId: string): Promise<ReviewHistoryEntry[]> {
  const { data, error } = await supabase
    .from('review_history')
    .select('*')
    .eq('item_id', itemId)
    .order('reviewed_at', { ascending: true })
  if (error) throw error
  return data as ReviewHistoryEntry[]
}

export async function getAllItemsForUser(userId: string): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('*').eq('user_id', userId)
  if (error) throw error
  return data as Item[]
}
