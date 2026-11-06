"use client"

/**
 * The "captures waiting to sync" notice. `stuck` is how many of the waiting captures have used up their automatic retries:
 * they are kept on this device and are only tried again when the person presses Sync Now.
 */
export function OfflineSyncBanner({ waiting, stuck, onSyncNow }: { waiting: number; stuck: number; onSyncNow: () => void }) {
  if (waiting <= 0) return null
  const plural = (n: number) => (n !== 1 ? "s" : "")
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
      <span>
        {waiting} capture{plural(waiting)} waiting to sync
        {stuck > 0 && ` (${stuck} could not be saved after several tries and are kept on this device until you press Sync Now)`}
      </span>
      <button onClick={onSyncNow} className="text-xs font-semibold text-blue-700 underline hover:text-blue-900">
        Sync Now
      </button>
    </div>
  )
}
