import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

type Mode = 'password' | 'magic-link' | 'signup'

export default function LoginPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (session) return <Navigate to="/capture" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Account created. Check your email if confirmation is required, then log in.')
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
        if (error) throw error
        setMessage('Magic link sent — check your inbox.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ paddingTop: '10vh' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>先 SenpAI</h1>
        <p>The continuity layer between your lessons and self-study.</p>
      </div>

      <div className="card">
        <div className="confidence-picker" style={{ marginBottom: 16 }}>
          <button type="button" className={mode === 'password' ? 'active' : ''} data-c={mode === 'password' ? 'solid' : undefined} onClick={() => setMode('password')}>Password</button>
          <button type="button" className={mode === 'magic-link' ? 'active' : ''} data-c={mode === 'magic-link' ? 'solid' : undefined} onClick={() => setMode('magic-link')}>Magic link</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} data-c={mode === 'signup' ? 'solid' : undefined} onClick={() => setMode('signup')}>Sign up</button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          {mode !== 'magic-link' && (
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          {message && <p className="card-sub">{message}</p>}
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">
            {busy ? <span className="spinner" /> : mode === 'signup' ? 'Create account' : mode === 'magic-link' ? 'Send magic link' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
