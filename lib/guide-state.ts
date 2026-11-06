import { flushUnsynced, queueUnsynced, writeLocalDismissal, type DismissalSpec } from "./dismissal-sync"

// Remembers two things about the "Start here" guide, safely when browser storage is blocked:
//  - whether this person has ever created a project of their own (then the guide never shows again), and
//  - whether this person tapped Hide (then it stays hidden for them, on this browser and, through the account, on others).
//
// Hide is saved the same way the onboarding checklist saves its dismissal (see dismissal-sync.ts): a copy in this browser,
// keyed by the person, and a setting on their account. The account setting is what lets it follow them to another device
// or survive cleared browser data.

const CREATED_KEY = (userId: string) => `ss-created-project:${userId}`
const HIDDEN_KEY = (userId: string) => `ss-start-here-hidden:${userId}`
/** The name of the account setting that holds the Hide choice (it lives in the person's user metadata). */
export const GUIDE_HIDDEN_SETTING = "ss_start_here_hidden"

/** How "Start here" records and finds a Hide: the browser key and account setting above, with the shared logic in dismissal-sync.ts. */
export const START_HERE_SPEC: DismissalSpec = {
  localKeys: (userId) => [HIDDEN_KEY(userId)],
  localValue: "1",
  accountPatch: { [GUIDE_HIDDEN_SETTING]: true },
  isDismissedInMetadata: (metadata) => metadata?.[GUIDE_HIDDEN_SETTING] === true,
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // storage can be blocked; the guide then simply follows the live project list
  }
}

export function hasCreatedProject(userId: string): boolean {
  return read(CREATED_KEY(userId)) === "1"
}
export function markProjectCreated(userId: string) {
  write(CREATED_KEY(userId), "1")
}

/** Whether this person chose Hide: on the account (passed in as savedOnAccount) or in this browser. */
export function isGuideHidden(userId: string, savedOnAccount?: boolean): boolean {
  return savedOnAccount === true || read(HIDDEN_KEY(userId)) === "1"
}
export function hideGuide(userId: string) {
  writeLocalDismissal(START_HERE_SPEC, userId)
  // Save on the account so it follows this person to every device. If that fails it is kept and tried again later, and the
  // browser copy still applies meanwhile.
  queueUnsynced(userId, START_HERE_SPEC.accountPatch)
  void flushUnsynced(userId)
}

/** The guide shows only to someone who has no project of their own yet, and has not hidden it. */
export function shouldShowStartGuide(opts: { onlyDemoOrNone: boolean; createdBefore: boolean; hidden: boolean }): boolean {
  return opts.onlyDemoOrNone && !opts.createdBefore && !opts.hidden
}
