import { useState } from 'react'

interface Slide {
  icon: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    icon: '先',
    title: 'Welcome to SenpAI',
    body: "Never let what your tutor covers evaporate before your next lesson. SenpAI turns your notes into spaced-repetition practice.",
  },
  {
    icon: '📷',
    title: 'Capture a lesson',
    body: "Snap a photo of your study notes and let the app summarize the vocab, grammar and corrections.\n\nNothing to photograph? Pick your level, then tap through common categories instead.",
  },
  {
    icon: '✅',
    title: 'Review & confirm',
    body: "Fix any misreads, rate how confident you feel about each item, and drop what you don't need. Nothing is scheduled until you confirm.",
  },
  {
    icon: '🎯',
    title: 'Practice, on schedule',
    body: "Each item becomes its own drill. SenpAI brings back what's due — weighted toward what's still shaky — so you walk into your next lesson prepared.",
  },
]

interface Props {
  onClose: () => void
}

export default function OnboardingCarousel({ onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const isLast = index === SLIDES.length - 1

  function next() {
    if (isLast) onClose()
    else setIndex((i) => i + 1)
  }
  function prev() {
    setIndex((i) => Math.max(0, i - 1))
  }

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX)
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (dx < -40) next()
    else if (dx > 40) prev()
    setTouchStartX(null)
  }

  const slide = SLIDES[index]

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="App tutorial"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className="onboarding-skip" onClick={onClose}>Skip</button>

      <div className="onboarding-slide">
        <div className="onboarding-icon" aria-hidden>{slide.icon}</div>
        <h2>{slide.title}</h2>
        <p>{slide.body}</p>
      </div>

      <div className="onboarding-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={'onboarding-dot' + (i === index ? ' onboarding-dot--active' : '')}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <button className="btn btn-primary btn-block onboarding-cta" onClick={next}>
        {isLast ? 'Get started' : 'Next'}
      </button>
    </div>
  )
}
