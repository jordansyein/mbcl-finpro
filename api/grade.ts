import type { IncomingMessage, ServerResponse } from 'http'
import { getAnthropic, MODEL, readJsonBody, requireUser, withHandler, extractJsonBlock, HttpError } from './_shared.js'

// Grading is only used for production-style drills (grammar construction,
// error correction) where more than one phrasing can be valid, so it needs
// judgment rather than exact-match. Claude returns pass/fail + feedback
// only — it never picks a quality score or interval; that mapping happens
// deterministically in src/lib/sm2.ts (CLAUDE_GRADE_QUALITY).
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return withHandler(req, res, async () => {
    await requireUser(req)
    const { item_type, prompt, expected, userAnswer } = await readJsonBody<{
      item_type?: 'grammar' | 'corrected_sentence'
      prompt?: string
      expected?: string
      userAnswer?: string
    }>(req)
    if (!item_type || !prompt || !userAnswer) throw new HttpError(400, 'item_type, prompt, and userAnswer are required')

    const task =
      item_type === 'grammar'
        ? `A JLPT student was asked to construct a sentence using the grammar pattern/prompt: "${prompt}".`
        : `A JLPT student was asked to correct this sentence: "${prompt}".`
    const referenceLine = expected ? `A reference correct answer is: "${expected}" (the student's answer does not need to match this exactly — any grammatically correct, natural phrasing that fulfills the task should pass).` : ''

    const gradePrompt = `${task} ${referenceLine}
The student's answer was: "${userAnswer}"

Judge whether the student's answer is grammatically correct and naturally fulfills the task. Be reasonably strict about the target grammar point but lenient about vocabulary choice and minor stylistic differences.
Return ONLY JSON: {"pass": true|false, "feedback": "one or two short, encouraging sentences explaining what was right or wrong, in English"}`

    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: gradePrompt }],
    })

    const text = message.content.find((b) => b.type === 'text')?.text ?? '{}'
    const parsed = extractJsonBlock(text)
    return { pass: !!parsed.pass, feedback: String(parsed.feedback ?? '') }
  })
}
