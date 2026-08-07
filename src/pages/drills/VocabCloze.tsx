import { useState } from 'react'
import type { ClozeDrill } from '../../lib/types'
import { SELF_GRADE_QUALITY } from '../../lib/sm2'

interface Props {
  drill: ClozeDrill
  onGraded: (quality: number, result: string, feedback: string | null) => void
}

export default function VocabCloze({ drill, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)

  function check() {
    setCorrect(answer.trim() === drill.answer.trim())
    setChecked(true)
  }

  const parts = drill.sentence_with_blank.split('___')

  return (
    <div className="card drill-card">
      <p className="card-sub">Fill in the blank</p>
      <p className="drill-sentence">
        {parts[0]}
        <span className="drill-blank">{checked ? drill.answer : '___'}</span>
        {parts.slice(1).join('___')}
      </p>
      {!checked && (
        <>
          <div className="field">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={drill.hint || 'Your answer'}
              onKeyDown={(e) => { if (e.key === 'Enter') check() }}
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={check} disabled={!answer.trim()}>Check</button>
        </>
      )}
      {checked && (
        <>
          <div className={`feedback-box ${correct ? 'feedback-pass' : 'feedback-fail'}`}>
            {correct ? 'Correct!' : `Not quite — the answer is "${drill.answer}".`}
          </div>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            onClick={() => onGraded(correct ? SELF_GRADE_QUALITY.good : SELF_GRADE_QUALITY.again, correct ? 'pass' : 'fail', null)}
          >
            Continue
          </button>
        </>
      )}
    </div>
  )
}
