"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signedPhotoUrl } from "./photo-access"

// A 1x1 transparent picture shown while the link is fetched, so the layout and size classes stay as they were.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string
  projectId?: string
  /** Short text for the "could not load" box; the full explanation is always in the accessible name. */
  unavailableLabel?: string
}

type State = { for: string; status: "loading" } | { for: string; status: "ready"; link: string } | { for: string; status: "failed" }

/**
 * Drop-in replacement for <img> on stored photos: shows the picture through a short-lived link.
 *
 * If no link can be had, or the picture does not load from its link, it shows a visible "unavailable, tap to retry"
 * box instead of a broken or vanished picture. One broken load triggers a single automatic fresh link first, because a
 * page left open for over an hour holds a link that has expired.
 */
export function SignedImg({ src, projectId, alt, unavailableLabel = "Photo unavailable. Tap to retry", onError, className, ...rest }: Props) {
  const [state, setState] = useState<State>({ for: src, status: "loading" })
  const refreshedFor = useRef<string | null>(null)

  const load = useCallback((force: boolean, live: () => boolean) => {
    signedPhotoUrl(src, projectId, { force }).then((link) => {
      if (!live()) return
      setState(link ? { for: src, status: "ready", link } : { for: src, status: "failed" })
    })
  }, [src, projectId])

  useEffect(() => {
    let alive = true
    refreshedFor.current = null
    load(false, () => alive)
    return () => { alive = false }
  }, [load])

  const current: State = state.for === src ? state : { for: src, status: "loading" }

  if (current.status === "failed") {
    return (
      <button
        type="button"
        onClick={() => { setState({ for: src, status: "loading" }); refreshedFor.current = null; load(true, () => true) }}
        aria-label={`${alt || "Photo"}: could not be loaded. Retry`}
        title="Could not be loaded. Tap to retry"
        className={`${className ?? ""} flex min-h-24 min-w-24 items-center justify-center rounded-lg border border-dashed border-zinc-400 bg-zinc-100 px-2 text-center text-xs leading-tight text-zinc-700`}
      >
        {unavailableLabel}
      </button>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      className={className}
      src={current.status === "ready" ? current.link : BLANK}
      alt={alt ?? ""}
      onError={(e) => {
        if (current.status !== "ready") return
        if (refreshedFor.current !== src) {
          refreshedFor.current = src
          load(true, () => true)
        } else {
          setState({ for: src, status: "failed" })
        }
        onError?.(e)
      }}
    />
  )
}
