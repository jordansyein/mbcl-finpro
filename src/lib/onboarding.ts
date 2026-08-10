// Tracked per-user (not globally) so a shared/reused browser doesn't skip
// onboarding for a different account, and so it naturally reappears if the
// same user logs in on a new device.
const KEY_PREFIX = 'senpai:onboarding-seen:'

export function hasSeenOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + userId) === '1'
  } catch {
    return true
  }
}

export function markOnboardingSeen(userId: string): void {
  try {
    localStorage.setItem(KEY_PREFIX + userId, '1')
  } catch {
    // localStorage unavailable (e.g. private browsing) — nothing to persist
  }
}
