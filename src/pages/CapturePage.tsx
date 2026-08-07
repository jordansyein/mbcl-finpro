import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractFromPhoto } from '../lib/api'
import { useCaptureDraft } from '../context/CaptureDraftContext'
import { N2_GRAMMAR, N2_VOCAB_THEMES, type QuickCategory } from '../data/n2Categories'
import type { ItemDraft } from '../lib/types'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

let tempIdCounter = 0
const nextTempId = () => `draft-${Date.now()}-${tempIdCounter++}`

export default function CapturePage() {
  const navigate = useNavigate()
  const { setDraft } = useCaptureDraft()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showFallback, setShowFallback] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  async function extract() {
    if (!photoFile) return
    setBusy(true)
    setError(null)
    try {
      const base64 = await fileToBase64(photoFile)
      const raw = await extractFromPhoto(base64, photoFile.type || 'image/jpeg')
      if (raw.length === 0) {
        setError('No study-worthy items were found in that photo. Try a clearer shot, or use the quick-tap fallback below.')
        setBusy(false)
        return
      }
      const drafts: ItemDraft[] = raw.map((r) => ({
        tempId: nextTempId(),
        item_type: r.item_type,
        content: r.content,
        reading: r.reading ?? '',
        meaning: r.meaning ?? '',
        example_sentence: r.example_sentence ?? '',
        source_correction: r.source_correction ?? '',
        confidence_at_log: 'okay',
        included: true,
      }))
      setDraft({ captureMethod: 'photo', photoBlob: photoFile, photoPreviewUrl: previewUrl, notes: '', drafts })
      navigate('/confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setBusy(false)
    }
  }

  function toggleCategory(cat: QuickCategory) {
    const key = `${cat.item_type}:${cat.label}`
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function continueWithFallback() {
    const all = [...N2_GRAMMAR, ...N2_VOCAB_THEMES]
    const chosen = all.filter((c) => selected.has(`${c.item_type}:${c.label}`))
    if (chosen.length === 0) return
    const drafts: ItemDraft[] = chosen.map((c) => ({
      tempId: nextTempId(),
      item_type: c.item_type,
      content: c.label,
      reading: '',
      meaning: '',
      example_sentence: '',
      source_correction: '',
      confidence_at_log: 'okay',
      included: true,
    }))
    setDraft({ captureMethod: 'manual', photoBlob: null, photoPreviewUrl: null, notes: '', drafts })
    navigate('/confirm')
  }

  return (
    <div>
      <div className="page-header">
        <h1>Capture today's lesson</h1>
        <p>Photograph your notes, or log what came up if there's nothing to photograph.</p>
      </div>

      {!previewUrl && (
        <div className="capture-hero">
          <button className="capture-photo-btn" onClick={() => fileInputRef.current?.click()} aria-label="Take photo">📷</button>
          <p className="card-sub">Tap to photograph your lesson notes</p>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFileChange} />
        </div>
      )}

      {previewUrl && (
        <div className="card">
          <img src={previewUrl} alt="Lesson note preview" className="photo-preview" />
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={() => { setPhotoFile(null); setPreviewUrl(null); setError(null) }} disabled={busy}>Retake</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={extract} disabled={busy}>
              {busy ? <span className="spinner" /> : 'Extract lesson items'}
            </button>
          </div>
        </div>
      )}

      <div style={{ margin: '24px 0', textAlign: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowFallback((s) => !s)}>
          {showFallback ? 'Hide quick-tap fallback' : "Nothing to photograph? Log points instead →"}
        </button>
      </div>

      {showFallback && (
        <div className="card">
          <p className="card-title">Grammar points</p>
          <div className="category-grid" style={{ marginBottom: 18 }}>
            {N2_GRAMMAR.map((c) => (
              <button key={c.label} className={'category-chip' + (selected.has(`${c.item_type}:${c.label}`) ? ' selected' : '')} onClick={() => toggleCategory(c)}>
                {c.label}
              </button>
            ))}
          </div>
          <p className="card-title">Vocab themes</p>
          <div className="category-grid">
            {N2_VOCAB_THEMES.map((c) => (
              <button key={c.label} className={'category-chip' + (selected.has(`${c.item_type}:${c.label}`) ? ' selected' : '')} onClick={() => toggleCategory(c)}>
                {c.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={selected.size === 0} onClick={continueWithFallback}>
            Continue with {selected.size} selected
          </button>
        </div>
      )}
    </div>
  )
}
