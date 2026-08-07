// CJK Unified Ideographs range covers the kanji used in everyday Japanese.
const KANJI_RE = /[一-龯]/g

export function extractKanjiChars(text: string): string[] {
  const matches = text.match(KANJI_RE)
  if (!matches) return []
  return Array.from(new Set(matches))
}
