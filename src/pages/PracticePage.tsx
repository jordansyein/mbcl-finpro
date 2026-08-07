import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDueQueue, ensureDrill, recordReview } from '../lib/db'
import type { Item, QueueItem } from '../lib/types'
import VocabCloze from './drills/VocabCloze'
import KanjiFlashcard from './drills/KanjiFlashcard'
import GrammarConstruction from './drills/GrammarConstruction'
import CorrectedSentenceDrill from './drills/CorrectedSentence'

export default function PracticePage() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [current, setCurrent] = useState<Item | null>(null)
  const [loadingDrill, setLoadingDrill] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneCount, setDoneCount] = useState(0)

  useEffect(() => {
    if (!user) return
    getDueQueue(user.id)
      .then(setQueue)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load practice queue'))
  }, [user])

  useEffect(() => {
    const item = queue?.[index]
    if (!item) {
      setCurrent(null)
      return
    }
    let cancelled = false
    setLoadingDrill(true)
    setError(null)
    ensureDrill(item)
      .then((updated) => { if (!cancelled) setCurrent(updated) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to generate drill') })
      .finally(() => { if (!cancelled) setLoadingDrill(false) })
    return () => { cancelled = true }
  }, [queue, index])

  async function handleGraded(quality: number, result: string, feedback: string | null) {
    if (!current || !current.drill_content) return
    try {
      await recordReview(current, current.drill_content.type, quality, result, feedback)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review')
      return
    }
    setDoneCount((c) => c + 1)
    setIndex((i) => i + 1)
  }

  if (queue === null) {
    return <div className="empty-state"><span className="spinner" /></div>
  }

  const total = queue.length
  if (total === 0) {
    return (
      <div>
        <div className="page-header"><h1>Practice</h1></div>
        <div className="empty-state">
          <p>Nothing due today. Nice work.</p>
          <Link className="btn btn-primary" to="/capture" style={{ marginTop: 12 }}>Capture a lesson</Link>
        </div>
      </div>
    )
  }

  if (index >= total) {
    return (
      <div>
        <div className="page-header"><h1>Practice</h1></div>
        <div className="empty-state">
          <p>Queue cleared — {doneCount} item{doneCount === 1 ? '' : 's'} reviewed.</p>
          <Link className="btn btn-primary" to="/weak-points" style={{ marginTop: 12 }}>See weak points</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(index / total) * 100}%` }} />
      </div>
      <p className="card-sub" style={{ textAlign: 'center', marginBottom: 12 }}>{index + 1} / {total}</p>

      {error && <p className="error-text">{error}</p>}

      {loadingDrill && (
        <div className="empty-state"><span className="spinner" /></div>
      )}

      {!loadingDrill && current?.drill_content && (
        <DrillSwitch item={current} onGraded={handleGraded} />
      )}
    </div>
  )
}

function DrillSwitch({ item, onGraded }: { item: Item; onGraded: (q: number, r: string, f: string | null) => void }) {
  const drill = item.drill_content!
  switch (drill.type) {
    case 'cloze':
      return <VocabCloze drill={drill} onGraded={onGraded} />
    case 'flashcard':
      return <KanjiFlashcard drill={drill} onGraded={onGraded} />
    case 'guided_construction':
      return <GrammarConstruction drill={drill} onGraded={onGraded} />
    case 'error_correction':
      return <CorrectedSentenceDrill drill={drill} onGraded={onGraded} />
    default:
      return null
  }
}
