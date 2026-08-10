import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getLessons, getAllItemsForUser, getWeakPoints } from '../lib/db'
import { checkHasPassword, setPassword } from '../lib/account'
import OnboardingCarousel from '../components/OnboardingCarousel'

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ lessons: number; items: number; weak: number } | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)

  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getLessons(user.id), getAllItemsForUser(user.id), getWeakPoints(user.id)]).then(
      ([lessons, items, weak]) => setStats({ lessons: lessons.length, items: items.length, weak: weak.length })
    )
  }, [user])

  useEffect(() => {
    if (!user) return
    checkHasPassword().then(setHasPassword)
  }, [user])

  const passwordLabel = hasPassword === false ? 'Add password' : hasPassword === true ? 'Change password' : 'Set password'

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await setPassword(newPassword)
      setHasPassword(true)
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password saved.')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to save password')
    } finally {
      setSavingPassword(false)
    }
  }

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

      <div className="card">
        <p className="card-title">{hasPassword === false ? 'Add a password' : 'Password'}</p>
        <p className="card-sub">
          {hasPassword === false
            ? "You signed in with a magic link. Add a password so you can log in without waiting on an email next time."
            : 'Update the password used to log in.'}
        </p>
        <form onSubmit={submitPassword} style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {passwordError && <p className="error-text">{passwordError}</p>}
          {passwordMessage && <p className="card-sub">{passwordMessage}</p>}
          <button className="btn btn-primary btn-block" disabled={savingPassword} type="submit">
            {savingPassword ? <span className="spinner" /> : passwordLabel}
          </button>
        </form>
      </div>

      <button className="btn btn-block" onClick={() => setShowTutorial(true)} style={{ marginTop: 12 }}>
        View tutorial
      </button>

      <button className="btn btn-danger btn-block" onClick={() => supabase.auth.signOut()} style={{ marginTop: 12 }}>
        Log out
      </button>

      {showTutorial && <OnboardingCarousel onClose={() => setShowTutorial(false)} />}
    </div>
  )
}
