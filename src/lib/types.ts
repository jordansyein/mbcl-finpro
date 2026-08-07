export type ItemType = 'vocab' | 'grammar' | 'corrected_sentence' | 'kanji'
export type Confidence = 'shaky' | 'okay' | 'solid'
export type CaptureMethod = 'photo' | 'manual'

export interface Lesson {
  id: string
  user_id: string
  date: string
  capture_method: CaptureMethod
  raw_photo_ref: string | null
  notes: string | null
  created_at: string
}

export interface ClozeDrill {
  type: 'cloze'
  sentence_with_blank: string
  answer: string
  hint?: string
}

export interface GuidedConstructionStep {
  prompt: string
  hint?: string
}

export interface GuidedConstructionDrill {
  type: 'guided_construction'
  pattern: string
  meaning: string
  steps: GuidedConstructionStep[]
  target_sentence: string
}

export interface ErrorCorrectionDrill {
  type: 'error_correction'
  original_wrong: string
  correct_answer: string
  explanation?: string
}

export interface FlashcardDrill {
  type: 'flashcard'
  character: string
  onyomi?: string
  kunyomi?: string
  meaning: string
  example_word?: string
  example_reading?: string
}

export type DrillContent = ClozeDrill | GuidedConstructionDrill | ErrorCorrectionDrill | FlashcardDrill

export interface Item {
  id: string
  lesson_id: string
  user_id: string
  item_type: ItemType
  content: string
  reading: string | null
  meaning: string | null
  example_sentence: string | null
  source_correction: string | null
  confidence_at_log: Confidence
  confidence_current: Confidence
  shaky_since: string | null
  drill_content: DrillContent | null
  created_at: string
}

export interface ReviewState {
  item_id: string
  user_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_due_date: string
  last_reviewed_at: string | null
}

export interface ReviewHistoryEntry {
  id: string
  item_id: string
  user_id: string
  reviewed_at: string
  drill_type: DrillContent['type']
  quality: number
  result: string
  feedback: string | null
}

// Draft shape used between extraction/MCQ fallback and the confirm screen,
// before anything is persisted.
export interface ItemDraft {
  tempId: string
  item_type: ItemType
  content: string
  reading: string
  meaning: string
  example_sentence: string
  source_correction: string
  confidence_at_log: Confidence
  included: boolean
}

export interface ExtractedItemRaw {
  item_type: ItemType
  content: string
  reading?: string
  meaning?: string
  example_sentence?: string
  source_correction?: string
}

export interface QueueItem extends Item {
  review_state: ReviewState
}
