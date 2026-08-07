import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CaptureMethod, ItemDraft } from '../lib/types'

interface CaptureDraft {
  captureMethod: CaptureMethod
  photoBlob: Blob | null
  photoPreviewUrl: string | null
  notes: string
  drafts: ItemDraft[]
}

interface CaptureDraftContextValue {
  draft: CaptureDraft | null
  setDraft: (d: CaptureDraft | null) => void
}

const CaptureDraftContext = createContext<CaptureDraftContextValue>({ draft: null, setDraft: () => {} })

export function CaptureDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CaptureDraft | null>(null)
  return <CaptureDraftContext.Provider value={{ draft, setDraft }}>{children}</CaptureDraftContext.Provider>
}

export function useCaptureDraft() {
  return useContext(CaptureDraftContext)
}

export type { CaptureDraft }
