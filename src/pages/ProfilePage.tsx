import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getLessons, getAllItemsForUser, getWeakPoints } from '../lib/db'

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ lessons: number; items: number; weak: number } | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getLessons(user.id), getAllItemsForUser(user.id), getWeakPoints(user.id)]).then(
      ([lessons, items, weak]) => setStats({ lessons: lessons.length, items: items.length, weak: weak.length })
    )
  }, [user])

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="card">
        <p className="card-title">{user?.email}</p>
        <p className="card-sub">Signed in via Supabase</p>
      </div>

      {stats && (
        <div className="card">
          <div className="item-row"><span>Lessons captured</span><strong>{stats.lessons}</strong></div>
          <div className="item-row"><span>Items tracked</span><strong>{stats.items}</strong></div>
          <div className="item-row"><span>Open weak points</span><strong>{stats.weak}</strong></div>
        </div>
      )}

      <button className="btn btn-danger btn-block" onClick={() => supabase.auth.signOut()} style={{ marginTop: 12 }}>
        Log out
      </button>
    </div>
  )
}
