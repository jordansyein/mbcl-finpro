import { useState } from 'react'
import type { FlashcardDrill } from '../../lib/types'
import { SELF_GRADE_QUALITY, type SelfGrade } from '../../lib/sm2'

interface Props {
  drill: FlashcardDrill
  onGraded: (quality: number, result: string, feedback: string | null) => void
}

const GRADE_LABEL: Record<SelfGrade, string> = { again: 'Forgot', good: 'Knew it', easy: 'Knew it well' }

export default function KanjiFlashcard({ drill, onGraded }: Props) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="card drill-card">
      <p className="card-sub">Recognition flashcard</p>
      <div className="drill-kanji">{drill.character}</div>

      {!revealed && (
        <button className="btn btn-primary btn-block" onClick={() => setRevealed(true)}>Reveal</button>
      )}

      {revealed && (
        <>
          <p><strong>Onyomi:</strong> {drill.onyomi || '—'}</p>
          <p><strong>Kunyomi:</strong> {drill.kunyomi || '—'}</p>
          <p><strong>Meaning:</strong> {drill.meaning}</p>
          {drill.example_word && (
            <p className="card-sub">{drill.example_word}{drill.example_reading ? ` (${drill.example_reading})` : ''}</p>
          )}
          <div className="grade-buttons">
            {(Object.keys(SELF_GRADE_QUALITY) as SelfGrade[]).map((g) => (
              <button key={g} className="btn" onClick={() => onGraded(SELF_GRADE_QUALITY[g], g, null)}>
                {GRADE_LABEL[g]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
