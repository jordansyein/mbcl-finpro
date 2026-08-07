import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCaptureDraft } from '../context/CaptureDraftContext'
import { createLessonWithItems, uploadLessonPhoto } from '../lib/db'
import type { Confidence, ItemDraft, ItemType } from '../lib/types'

const TYPE_LABEL: Record<ItemType, string> = {
  vocab: 'Vocab',
  grammar: 'Grammar',
  corrected_sentence: 'Correction',
  kanji: 'Kanji',
}

function ItemEditor({ draft, onChange, onDelete }: { draft: ItemDraft; onChange: (d: ItemDraft) => void; onDelete: () => void }) {
  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => onChange({ ...draft, [key]: value })

  return (
    <div className="card" style={{ opacity: draft.included ? 1 : 0.5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="pill pill-type">{TYPE_LABEL[draft.item_type]}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => set('included', !draft.included)}>
            {draft.included ? 'Exclude' : 'Include'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {draft.included && (
        <>
          <div className="field">
            <label>{draft.item_type === 'corrected_sentence' ? 'Original (wrong) sentence' : 'Content'}</label>
            <input value={draft.content} onChange={(e) => set('content', e.target.value)} />
          </div>
          {draft.item_type === 'corrected_sentence' && (
            <div className="field">
              <label>Tutor's correction</label>
              <input value={draft.source_correction} onChange={(e) => set('source_correction', e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>Reading</label>
            <input value={draft.reading} onChange={(e) => set('reading', e.target.value)} placeholder="かな reading" />
          </div>
          <div className="field">
            <label>Meaning</label>
            <input value={draft.meaning} onChange={(e) => set('meaning', e.target.value)} placeholder="English meaning" />
          </div>
          <div className="field">
            <label>Example sentence</label>
            <textarea value={draft.example_sentence} onChange={(e) => set('example_sentence', e.target.value)} />
          </div>
          <div className="field">
            <label>Confidence</label>
            <div className="confidence-picker">
              {(['shaky', 'okay', 'solid'] as Confidence[]).map((c) => (
                <button key={c} type="button" data-c={c} className={draft.confidence_at_log === c ? 'active' : ''} onClick={() => set('confidence_at_log', c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ConfirmPage() {
  const { user } = useAuth()
  const { draft, setDraft } = useCaptureDraft()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState(draft?.notes ?? '')

  if (!draft) return <Navigate to="/capture" replace />

  function updateAt(tempId: string, next: ItemDraft) {
    setDraft({ ...draft!, drafts: draft!.drafts.map((d) => (d.tempId === tempId ? next : d)) })
  }
  function deleteAt(tempId: string) {
    setDraft({ ...draft!, drafts: draft!.drafts.filter((d) => d.tempId !== tempId) })
  }

  const includedCount = draft.drafts.filter((d) => d.included).length

  async function commit() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      let photoRef: string | null = null
      if (draft!.photoBlob) {
        photoRef = await uploadLessonPhoto(user.id, draft!.photoBlob, 'jpg')
      }
      await createLessonWithItems(
        user.id,
        { capture_method: draft!.captureMethod, raw_photo_ref: photoRef, notes: notes || null },
        draft!.drafts
      )
      setDraft(null)
      navigate('/practice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Review &amp; confirm</h1>
        <p>Fix any misreads, drop what's not useful, and rate your confidence. Nothing is scheduled until you confirm.</p>
      </div>

      <div className="field">
        <label>Lesson notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering about today's lesson" />
      </div>

      {draft.drafts.length === 0 && <div className="empty-state">No items left. Go back and capture again.</div>}

      {draft.drafts.map((d) => (
        <ItemEditor key={d.tempId} draft={d} onChange={(next) => updateAt(d.tempId, next)} onDelete={() => deleteAt(d.tempId)} />
      ))}

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-block" disabled={saving || includedCount === 0} onClick={commit} style={{ marginTop: 12 }}>
        {saving ? <span className="spinner" /> : `Confirm ${includedCount} item${includedCount === 1 ? '' : 's'} & start scheduling`}
      </button>
    </div>
  )
}
