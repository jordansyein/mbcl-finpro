import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractFromPhoto } from '../lib/api'
import { useCaptureDraft } from '../context/CaptureDraftContext'
import { JLPT_LEVELS, GRAMMAR_BY_LEVEL, VOCAB_THEMES_BY_LEVEL, type JlptLevel, type QuickCategory } from '../data/jlptCategories'
import type { ItemDraft } from '../lib/types'

// Vercel serverless functions hard-cap the request body at 4.5MB, which a
// full-resolution phone photo blows past once base64-encoded. Downscale and
// re-compress client-side first — Claude's vision quality doesn't benefit
// from more than ~1600px on the long edge anyway.
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

function resizeImageToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas rendering is not supported in this browser'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      resolve({ base64: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load the photo for processing'))
    }
    img.src = objectUrl
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
  const [level, setLevel] = useState<JlptLevel | null>(null)
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
      const { base64, mediaType } = await resizeImageToBase64(photoFile)
      const raw = await extractFromPhoto(base64, mediaType)
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

  function chooseLevel(l: JlptLevel) {
    setLevel(l)
    setSelected(new Set())
  }

  function continueWithFallback() {
    if (!level) return
    const all = [...GRAMMAR_BY_LEVEL[level], ...VOCAB_THEMES_BY_LEVEL[level]]
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
        <button className="btn btn-ghost btn-sm" onClick={() => { setShowFallback((s) => !s); setLevel(null) }}>
          {showFallback ? 'Hide quick-tap fallback' : "Nothing to photograph? Log points instead →"}
        </button>
      </div>

      {showFallback && !level && (
        <div className="card">
          <p className="card-title">Which level is this lesson?</p>
          <div className="category-grid" style={{ marginTop: 10 }}>
            {JLPT_LEVELS.map((l) => (
              <button key={l} className="category-chip" onClick={() => chooseLevel(l)}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {showFallback && level && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p className="card-title">{level} grammar points</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setLevel(null)}>Change level</button>
          </div>
          <div className="category-grid" style={{ marginBottom: 18 }}>
            {GRAMMAR_BY_LEVEL[level].map((c) => (
              <button key={c.label} className={'category-chip' + (selected.has(`${c.item_type}:${c.label}`) ? ' selected' : '')} onClick={() => toggleCategory(c)}>
                {c.label}
              </button>
            ))}
          </div>
          <p className="card-title">{level} vocab themes</p>
          <div className="category-grid">
            {VOCAB_THEMES_BY_LEVEL[level].map((c) => (
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
