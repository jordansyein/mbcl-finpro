import type { IncomingMessage, ServerResponse } from 'http'
import { getAnthropic, MODEL, readJsonBody, requireUser, withHandler, extractJsonBlock, HttpError } from './_shared.js'

interface DrillItemInput {
  item_type: 'vocab' | 'grammar' | 'corrected_sentence' | 'kanji'
  content: string
  reading?: string | null
  meaning?: string | null
  example_sentence?: string | null
  source_correction?: string | null
}

function buildPrompt(item: DrillItemInput): string {
  const known = `Known info — reading: ${item.reading || '(unknown)'}, meaning: ${item.meaning || '(unknown)'}, example sentence on file: ${item.example_sentence || '(none)'}.`

  switch (item.item_type) {
    case 'vocab':
      return `Create a cloze-deletion drill for the JLPT vocabulary word "${item.content}". ${known}
If an example sentence is on file, reuse it verbatim and blank out the word. Otherwise write a natural, level-appropriate sentence using the word, then blank it out.
Return ONLY JSON: {"type":"cloze","sentence_with_blank":"...(use ___ for the blank)...","answer":"${item.content}","hint":"short hint, e.g. reading or meaning","reading":"kana reading","meaning":"English meaning","example_sentence":"the full sentence with the word filled in"}`

    case 'grammar':
      return `Create a guided, step-by-step sentence-construction drill for the JLPT grammar pattern "${item.content}". ${known}
Don't just show a finished example — walk the student through building their own sentence: 2-4 short steps, each with a "prompt" telling them what to add/decide next and an optional "hint". End with one fully correct "target_sentence" that demonstrates the pattern (for reference, not to be shown until the student finishes).
Return ONLY JSON: {"type":"guided_construction","pattern":"${item.content}","meaning":"what this pattern expresses","steps":[{"prompt":"...","hint":"..."}],"target_sentence":"..."}`

    case 'corrected_sentence': {
      const correction = item.source_correction ? `The tutor's correction is: "${item.source_correction}".` : 'No tutor correction is on file — infer the most natural correction.'
      return `Create an error-correction drill from this student sentence that had a mistake: "${item.content}". ${correction}
Return ONLY JSON: {"type":"error_correction","original_wrong":"${item.content}","correct_answer":"the corrected sentence","explanation":"one short sentence on what was wrong and why"}`
    }

    case 'kanji':
    default:
      return `Create a recognition flashcard for the kanji "${item.content}". ${known}
Return ONLY JSON: {"type":"flashcard","character":"${item.content}","onyomi":"onyomi reading(s) in katakana","kunyomi":"kunyomi reading(s) in hiragana","meaning":"core English meaning(s)","example_word":"a common word using this kanji","example_reading":"that word's reading"}`
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return withHandler(req, res, async () => {
    await requireUser(req)
    const { item } = await readJsonBody<{ item?: DrillItemInput }>(req)
    if (!item || !item.item_type || !item.content) throw new HttpError(400, 'item is required')

    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(item) }],
    })

    const text = message.content.find((b) => b.type === 'text')?.text ?? '{}'
    const drill = extractJsonBlock(text)
    return { drill }
  })
}
