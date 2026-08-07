import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getWeakPoints, getLessons } from '../lib/db'
import type { Item, ItemType, Lesson } from '../lib/types'

const TYPE_LABEL: Record<ItemType, string> = {
  vocab: 'Vocab',
  grammar: 'Grammar',
  corrected_sentence: 'Correction',
  kanji: 'Kanji',
}

export default function BriefingPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[] | null>(null)
  const [lessons, setLessons] = useState<Lesson[] | null>(null)

  useEffect(() => {
    if (!user) return
    getWeakPoints(user.id).then(setItems)
    getLessons(user.id).then(setLessons)
  }, [user])

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const lastLesson = lessons?.[0]

  const grouped = (items ?? []).reduce<Record<ItemType, Item[]>>((acc, it) => {
    ;(acc[it.item_type] ??= []).push(it)
    return acc
  }, {} as Record<ItemType, Item[]>)

  return (
    <div>
      <div className="page-header no-print">
        <h1>Pre-lesson briefing</h1>
        <p>A clean summary to show your tutor — hand them your phone.</p>
      </div>

      <div className="briefing-sheet">
        <h1>SenpAI — Lesson Briefing</h1>
        <p className="card-sub">{today}</p>
        {lastLesson && <p className="card-sub">Last captured lesson: {new Date(lastLesson.date).toLocaleDateString()}</p>}

        <h2 style={{ marginTop: 20 }}>Current weak points ({items?.length ?? 0})</h2>
        {items?.length === 0 && <p className="card-sub">Nothing outstanding — everything is at least "okay".</p>}

        {(Object.keys(grouped) as ItemType[]).map((type) => (
          <div key={type} style={{ marginTop: 14 }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>{TYPE_LABEL[type]}</p>
            {grouped[type].map((it) => (
              <div className="briefing-item" key={it.id}>
                <span>{it.content}{it.reading ? ` (${it.reading})` : ''}</span>
                <span className="card-sub">{it.meaning}</span>
              </div>
            ))}
          </div>
        ))}

        {items === null && <p className="card-sub">Loading…</p>}
      </div>

      <button className="btn btn-block no-print" style={{ marginTop: 16 }} onClick={() => window.print()}>
        Print / save as PDF
      </button>
    </div>
  )
}
