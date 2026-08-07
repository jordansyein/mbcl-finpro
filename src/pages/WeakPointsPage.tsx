import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getWeakPoints } from '../lib/db'
import type { Item, ItemType } from '../lib/types'

const TYPE_LABEL: Record<ItemType, string> = {
  vocab: 'Vocab',
  grammar: 'Grammar',
  corrected_sentence: 'Correction',
  kanji: 'Kanji',
}

function daysOpen(shakySince: string | null): number {
  if (!shakySince) return 0
  const opened = new Date(shakySince).getTime()
  return Math.max(0, Math.floor((Date.now() - opened) / 86_400_000))
}

export default function WeakPointsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getWeakPoints(user.id).then(setItems).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [user])

  return (
    <div>
      <div className="page-header">
        <h1>Weak points</h1>
        <p>Unresolved shaky items, oldest first. These get priority in your practice queue.</p>
      </div>

      {error && <p className="error-text">{error}</p>}
      {items === null && <div className="empty-state"><span className="spinner" /></div>}

      {items?.length === 0 && <div className="empty-state">Nothing shaky right now — you're caught up.</div>}

      {items?.map((it) => (
        <div className="card" key={it.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <span className="pill pill-type">{TYPE_LABEL[it.item_type]}</span>
              <p className="card-title" style={{ marginTop: 8 }}>{it.content}</p>
              {it.reading && <p className="card-sub">{it.reading}</p>}
              {it.meaning && <p className="card-sub">{it.meaning}</p>}
            </div>
            <span className="pill pill-shaky" style={{ whiteSpace: 'nowrap' }}>
              open {daysOpen(it.shaky_since)}d
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
