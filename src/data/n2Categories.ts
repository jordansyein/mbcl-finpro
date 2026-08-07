// Quick-tap fallback for sessions with nothing to photograph. Not exhaustive —
// just enough common N2 grammar patterns and vocab themes to seed a manual entry.
export interface QuickCategory {
  item_type: 'grammar' | 'vocab'
  label: string
}

export const N2_GRAMMAR: QuickCategory[] = [
  { item_type: 'grammar', label: '〜あげく' },
  { item_type: 'grammar', label: '〜一方だ' },
  { item_type: 'grammar', label: '〜おかげで' },
  { item_type: 'grammar', label: '〜かねる／かねない' },
  { item_type: 'grammar', label: '〜からには' },
  { item_type: 'grammar', label: '〜くせに' },
  { item_type: 'grammar', label: '〜げ' },
  { item_type: 'grammar', label: '〜ことに' },
  { item_type: 'grammar', label: '〜ざるを得ない' },
  { item_type: 'grammar', label: '〜しかない' },
  { item_type: 'grammar', label: '〜つつある' },
  { item_type: 'grammar', label: '〜において' },
  { item_type: 'grammar', label: '〜に応じて' },
  { item_type: 'grammar', label: '〜に限らず' },
  { item_type: 'grammar', label: '〜に加えて' },
  { item_type: 'grammar', label: '〜にすぎない' },
  { item_type: 'grammar', label: '〜に対して' },
  { item_type: 'grammar', label: '〜にほかならない' },
  { item_type: 'grammar', label: '〜にわたって' },
  { item_type: 'grammar', label: '〜ぬきで' },
  { item_type: 'grammar', label: '〜ばかりに' },
  { item_type: 'grammar', label: '〜べきではない' },
  { item_type: 'grammar', label: '〜ものの' },
  { item_type: 'grammar', label: '〜わけがない' },
  { item_type: 'grammar', label: '〜をきっかけに' },
  { item_type: 'grammar', label: '〜を通じて' },
]

export const N2_VOCAB_THEMES: QuickCategory[] = [
  { item_type: 'vocab', label: 'ビジネス・仕事 (business / work)' },
  { item_type: 'vocab', label: '感情・気持ち (emotions)' },
  { item_type: 'vocab', label: '社会・ニュース (society / news)' },
  { item_type: 'vocab', label: '自然・環境 (nature / environment)' },
  { item_type: 'vocab', label: '健康・医療 (health / medicine)' },
  { item_type: 'vocab', label: '経済・お金 (economy / money)' },
  { item_type: 'vocab', label: '人間関係 (relationships)' },
  { item_type: 'vocab', label: '教育・学校 (education)' },
  { item_type: 'vocab', label: '政治・法律 (politics / law)' },
  { item_type: 'vocab', label: 'テクノロジー (technology)' },
  { item_type: 'vocab', label: '敬語表現 (keigo / polite speech)' },
  { item_type: 'vocab', label: 'オノマトペ (onomatopoeia)' },
]
