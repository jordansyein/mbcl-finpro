import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLessonById, getLessonItems, getItemHistory, getLessonPhotoUrl } from '../lib/db'
import type { Item, ItemType, Lesson, ReviewHistoryEntry } from '../lib/types'

const TYPE_LABEL: Record<ItemType, string> = {
  vocab: 'Vocab',
  grammar: 'Grammar',
  corrected_sentence: 'Correction',
  kanji: 'Kanji',
}
const CONFIDENCE_PILL: Record<Item['confidence_current'], string> = {
  shaky: 'pill-shaky',
  okay: 'pill-okay',
  solid: 'pill-solid',
}

function ItemTrend({ item }: { item: Item }) {
  const [history, setHistory] = useState<ReviewHistoryEntry[] | null>(null)

  useEffect(() => {
    getItemHistory(item.id).then(setHistory)
  }, [item.id])

  const passCount = history?.filter((h) => h.quality >= 3).length ?? 0
  const total = history?.length ?? 0
  const accuracy = total > 0 ? Math.round((passCount / total) * 100) : null

  return (
    <div className="card" key={item.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <span className="pill pill-type">{TYPE_LABEL[item.item_type]}</span>
          <span className={`pill ${CONFIDENCE_PILL[item.confidence_current]}`} style={{ marginLeft: 6 }}>{item.confidence_current}</span>
          <p className="card-title" style={{ marginTop: 8 }}>{item.content}</p>
          {item.reading && <p className="card-sub">{item.reading}</p>}
          {item.meaning && <p className="card-sub">{item.meaning}</p>}
        </div>
        {accuracy !== null && <span className="card-sub" style={{ whiteSpace: 'nowrap' }}>{accuracy}% ({total})</span>}
      </div>
      {history && history.length > 0 && (
        <div className="trend-dots" style={{ marginTop: 10 }}>
          {history.map((h) => (
            <span key={h.id} className={`trend-dot ${h.quality >= 3 ? 'trend-dot--pass' : 'trend-dot--fail'}`} title={`${new Date(h.reviewed_at).toLocaleDateString()} — ${h.result}`} />
          ))}
        </div>
      )}
      {(!history || history.length === 0) && <p className="card-sub" style={{ marginTop: 8 }}>Not reviewed yet.</p>}
    </div>
  )
}

export default function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) return
    getLessonById(lessonId).then((l) => {
      setLesson(l)
      if (l.raw_photo_ref) getLessonPhotoUrl(l.raw_photo_ref).then(setPhotoUrl)
    })
    getLessonItems(lessonId).then(setItems)
  }, [lessonId])

  if (!lesson) return <div className="empty-state"><span className="spinner" /></div>

  return (
    <div>
      <Link to="/history" className="card-sub">← All lessons</Link>
      <div className="page-header" style={{ marginTop: 10 }}>
        <h1>{new Date(lesson.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
        {lesson.notes && <p>{lesson.notes}</p>}
      </div>

      {photoUrl && <img src={photoUrl} alt="Lesson note" className="photo-preview" style={{ marginBottom: 16 }} />}

      {items.map((item) => <ItemTrend item={item} key={item.id} />)}
    </div>
  )
}
