import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLessons, getAllItemsForUser } from '../lib/db'
import type { Item, Lesson } from '../lib/types'

export default function HistoryPage() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[] | null>(null)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!user) return
    getLessons(user.id).then(setLessons)
    getAllItemsForUser(user.id).then(setItems)
  }, [user])

  const countFor = (lessonId: string) => items.filter((i) => i.lesson_id === lessonId).length

  return (
    <div>
      <div className="page-header">
        <h1>Lesson history</h1>
        <p>Every capture, in order.</p>
      </div>

      {lessons === null && <div className="empty-state"><span className="spinner" /></div>}
      {lessons?.length === 0 && <div className="empty-state">No lessons captured yet.</div>}

      {lessons?.map((l) => (
        <Link to={`/history/${l.id}`} key={l.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="card-title">{new Date(l.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className="card-sub">{l.capture_method === 'photo' ? '📷 Photo capture' : '📝 Manual log'} · {countFor(l.id)} item{countFor(l.id) === 1 ? '' : 's'}</p>
              </div>
              <span aria-hidden>›</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
