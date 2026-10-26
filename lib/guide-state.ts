// Remembers two things about the "Start here" guide, safely when browser storage is blocked:
//  - whether this person has ever created a project of their own (then the guide never shows again), and
//  - whether they tapped Hide during this visit (then it stays hidden until they log in again).

const CREATED_KEY = (userId: string) => `ss-created-project:${userId}`
const HIDDEN_KEY = "ss-start-here-hidden"

function read(store: "localStorage" | "sessionStorage", key: string): string | null {
  try {
    return window[store].getItem(key)
  } catch {
    return null
  }
}
function write(store: "localStorage" | "sessionStorage", key: string, value: string) {
  try {
    window[store].setItem(key, value)
  } catch {
    // storage can be blocked; the guide then simply follows the live project list
  }
}

export function hasCreatedProject(userId: string): boolean {
  return read("localStorage", CREATED_KEY(userId)) === "1"
}
export function markProjectCreated(userId: string) {
  write("localStorage", CREATED_KEY(userId), "1")
}
export function isGuideHiddenThisVisit(): boolean {
  return read("sessionStorage", HIDDEN_KEY) === "1"
}
export function hideGuideThisVisit() {
  write("sessionStorage", HIDDEN_KEY, "1")
}
/** Called when someone logs out, so the guide comes back the next time they log in. */
export function clearGuideVisit() {
  try {
    window.sessionStorage.removeItem(HIDDEN_KEY)
  } catch {
    // nothing to clear
  }
}

/** The guide shows only to someone who has no project of their own yet, and has not hidden it during this visit. */
export function shouldShowStartGuide(opts: { onlyDemoOrNone: boolean; createdBefore: boolean; hiddenThisVisit: boolean }): boolean {
  return opts.onlyDemoOrNone && !opts.createdBefore && !opts.hiddenThisVisit
}
