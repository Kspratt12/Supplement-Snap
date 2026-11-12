"use client"

import { useEffect, useState } from "react"
import { signedPhotoUrl } from "./photo-access"

// A 1x1 transparent picture shown while the link is fetched, so the layout and size classes stay as they were.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string; projectId?: string }

/** Drop-in replacement for <img> on stored photos: shows the picture through a short-lived link. */
export function SignedImg({ src, projectId, alt, ...rest }: Props) {
  const [resolved, setResolved] = useState<{ for: string; link: string } | null>(null)

  useEffect(() => {
    let live = true
    signedPhotoUrl(src, projectId).then((link) => { if (live) setResolved({ for: src, link }) })
    return () => { live = false }
  }, [src, projectId])

  const link = resolved && resolved.for === src ? resolved.link : BLANK
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} src={link} alt={alt ?? ""} />
}
