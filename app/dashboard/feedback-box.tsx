"use client"

import { useState } from "react"
import { authFetch } from "../../lib/auth-fetch"

export function FeedbackBox({ page }: { page: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")

  const send = async () => {
    setStatus("sending")
    setError("")
    try {
      const res = await authFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, page }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Could not send feedback. Please try again.")
        setStatus("error")
        return
      }
      setMessage("")
      setStatus("sent")
    } catch {
      setError("Could not send feedback. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Something missing or confusing? Tell us
        </button>
      ) : status === "sent" ? (
        <p className="text-sm text-green-700">Thanks. We read every message.</p>
      ) : (
        <div className="text-left">
          <label htmlFor="feedback-message" className="text-sm font-medium text-zinc-800">
            What would make this more useful on a real job?
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={2000}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            placeholder="A missing feature, something confusing, a bug..."
          />
          {status === "error" && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={send}
              disabled={status === "sending" || message.trim().length < 3}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send"}
            </button>
            <button onClick={() => setOpen(false)} className="text-sm text-zinc-500 hover:text-zinc-800">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
