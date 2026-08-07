import { useState } from 'react'
import type { GuidedConstructionDrill } from '../../lib/types'
import { gradeProduction } from '../../lib/api'
import { CLAUDE_GRADE_QUALITY } from '../../lib/sm2'

interface Props {
  drill: GuidedConstructionDrill
  onGraded: (quality: number, result: string, feedback: string | null) => void
}

export default function GrammarConstruction({ drill, onGraded }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<{ pass: boolean; feedback: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setGrading(true)
    setError(null)
    try {
      const res = await gradeProduction({
        item_type: 'grammar',
        prompt: `Construct a sentence using the grammar pattern "${drill.pattern}" (${drill.meaning}).`,
        expected: drill.target_sentence,
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
      <p className="card-sub" style={{ textAlign: 'center' }}>Guided sentence construction</p>
      <p className="card-title" style={{ textAlign: 'center' }}>{drill.pattern}</p>
      <p className="card-sub" style={{ textAlign: 'center', marginBottom: 16 }}>{drill.meaning}</p>

      <div className="drill-steps">
        {drill.steps.slice(0, stepIndex + 1).map((s, i) => (
          <div className="drill-step" key={i}>
            <strong>Step {i + 1}:</strong> {s.prompt}
            {s.hint && <div className="card-sub">{s.hint}</div>}
          </div>
        ))}
      </div>
      {stepIndex < drill.steps.length - 1 && !result && (
        <button className="btn btn-ghost btn-sm" onClick={() => setStepIndex((i) => i + 1)} style={{ marginTop: 8 }}>
          Next step
        </button>
      )}

      {!result && (
        <>
          <div className="field" style={{ marginTop: 16 }}>
            <label>Your sentence</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="日本語で書いてください" />
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
          <p className="card-sub" style={{ marginTop: 10 }}>Reference: {drill.target_sentence}</p>
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={continueNext}>Continue</button>
        </>
      )}
    </div>
  )
}
