import { useState } from 'react'
import type { ErrorCorrectionDrill } from '../../lib/types'
import { gradeProduction } from '../../lib/api'
import { CLAUDE_GRADE_QUALITY } from '../../lib/sm2'

interface Props {
  drill: ErrorCorrectionDrill
  onGraded: (quality: number, result: string, feedback: string | null) => void
}

export default function CorrectedSentenceDrill({ drill, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<{ pass: boolean; feedback: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setGrading(true)
    setError(null)
    try {
      const res = await gradeProduction({
        item_type: 'corrected_sentence',
        prompt: drill.original_wrong,
        expected: drill.correct_answer,
        userAnswer: answer,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grading failed')
    } finally {
      setGrading(false)
    }
  }

  function continueNext() {
    if (!result) return
    onGraded(result.pass ? CLAUDE_GRADE_QUALITY.pass : CLAUDE_GRADE_QUALITY.fail, result.pass ? 'pass' : 'fail', result.feedback)
  }

  return (
    <div className="card drill-card" style={{ textAlign: 'left' }}>
      <p className="card-sub" style={{ textAlign: 'center' }}>Error correction</p>
      <p className="drill-sentence" style={{ fontSize: '1.05rem', textAlign: 'center' }}>{drill.original_wrong}</p>

      {!result && (
        <>
          <div className="field">
            <label>Corrected sentence</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={!answer.trim() || grading} onClick={submit}>
            {grading ? <span className="spinner" /> : 'Submit for grading'}
          </button>
        </>
      )}

      {result && (
        <>
          <div className={`feedback-box ${result.pass ? 'feedback-pass' : 'feedback-fail'}`}>
            <strong>{result.pass ? 'Pass' : 'Needs work'}</strong>
            <p style={{ margin: '6px 0 0' }}>{result.feedback}</p>
          </div>
          <p className="card-sub" style={{ marginTop: 10 }}>Tutor's correction: {drill.correct_answer}</p>
          {drill.explanation && <p className="card-sub">{drill.explanation}</p>}
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={continueNext}>Continue</button>
        </>
      )}
    </div>
  )
}
