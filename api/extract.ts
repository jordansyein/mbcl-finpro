import type { IncomingMessage, ServerResponse } from 'http'
import { getAnthropic, MODEL, readJsonBody, requireUser, withHandler, extractJsonBlock, HttpError } from './_shared.js'

const EXTRACTION_PROMPT = `You are helping a JLPT student (level N5 through N1) capture a private Japanese lesson from a photo of their notes (handwritten notes, a textbook page, or a worksheet with tutor corrections).

Extract every distinct study-worthy item you can identify and return ONLY a JSON object (no prose, no markdown fences) of this exact shape:

{
  "items": [
    {
      "item_type": "vocab" | "grammar" | "corrected_sentence" | "kanji",
      "content": "the headword, grammar pattern, kanji character, or (for corrected_sentence) the ORIGINAL incorrect sentence",
      "reading": "kana reading (vocab), or onyomi + kunyomi separated by ' / ' (kanji)",
      "meaning": "concise English meaning/definition",
      "example_sentence": "an example sentence using this item — reuse the exact sentence from the notes if one appears there, otherwise write a natural one",
      "source_correction": "ONLY for corrected_sentence items: the tutor's actual corrected version of the sentence"
    }
  ]
}

Rules:
- item_type "vocab": a vocabulary word or set phrase.
- item_type "grammar": a grammar pattern/construction (e.g. 〜ばかりに), content should be the pattern itself.
- item_type "corrected_sentence": only when the photo shows a sentence the student wrote with a visible tutor correction (strikethrough, circled fix, margin note, etc). "content" = the original wrong sentence, "source_correction" = the fixed version.
- item_type "kanji": for EVERY distinct kanji character that appears inside a "vocab" item's content, ALSO emit a separate top-level item with item_type "kanji", content = that single character, reading = its onyomi and kunyomi readings, meaning = its core meaning, and example_sentence = a short common word using that kanji (can differ from the vocab word it came from). Do not skip this step — it is required, not optional.
- If nothing legible or study-worthy is visible, return {"items": []}.
- Never invent content that isn't visibly supported by the photo, except for the required per-kanji breakdown described above, which may draw on your own knowledge of the kanji.`

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return withHandler(req, res, async () => {
    await requireUser(req)
    const { imageBase64, mediaType } = await readJsonBody<{ imageBase64?: string; mediaType?: string }>(req)
    if (!imageBase64) throw new HttpError(400, 'imageBase64 is required')
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const type = allowedTypes.includes(mediaType || '') ? (mediaType as string) : 'image/jpeg'

    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: type as any, data: imageBase64 } },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    })

    const text = message.content.find((b) => b.type === 'text')?.text ?? '{}'
    const parsed = extractJsonBlock(text)
    return { items: Array.isArray(parsed.items) ? parsed.items : [] }
  })
}
