"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { trackEvent } from "./analytics"

type Props = ComponentProps<typeof Link> & {
  /** Where on the site the link sits, e.g. "checklist-footer" or "article-top" */
  location: string
}

/** next/link that reports a cta_click event with its location and destination. */
export function TrackedLink({ location, onClick, href, ...rest }: Props) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        trackEvent("cta_click", { location, target: typeof href === "string" ? href : (href.pathname ?? "") })
        onClick?.(e)
      }}
      {...rest}
    />
  )
}
