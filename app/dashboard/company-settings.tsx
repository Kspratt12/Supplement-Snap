"use client"

import { useState, useEffect, useRef } from "react"
import { authFetch } from "../../lib/auth-fetch"
import { supabase } from "../../lib/supabase"
import { SignedImg } from "../../lib/signed-img"

export function CompanySettings({ userId }: { userId: string }) {
  const [companyName, setCompanyName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  // A just-uploaded logo is not on the saved settings yet, so it is shown from the chosen file until the page is reloaded
  const [localLogoPreview, setLocalLogoPreview] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")
  const editsRef = useRef(0) // counts edits, so a save that finishes after newer typing is not shown as covering it
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    authFetch(`/api/company-settings?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.settings) return
        setCompanyName(data.settings.company_name || "")
        setLogoUrl(data.settings.logo_url || "")
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [userId])

  // "Saved" is shown only once the server has accepted the change. On any failure the typed name and logo stay as they are.
  async function handleSave() {
    setSaving(true)
    setSaveError("")
    const editsAtStart = editsRef.current
    try {
      const res = await authFetch("/api/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, companyName, logoUrl }),
      })
      if (res.ok) {
        if (editsRef.current === editsAtStart) setSaved(true)
      } else {
        const data = await res.json().catch(() => null)
        setSaveError(
          typeof data?.error === "string" && data.error
            ? data.error
            : res.status === 503
              ? "We couldn't check your plan right now. Please try again in a moment."
              : "Your branding could not be saved. Please try again.",
        )
      }
    } catch {
      setSaveError("Your branding could not be saved. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(file: File) {
    setUploading(true)
    const rand = crypto.randomUUID()
    const filename = `logo-${userId}-${rand}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60)}`
    const { error } = await supabase.storage.from("test-uploads").upload(filename, file, { contentType: file.type })
    if (!error) {
      const { data } = supabase.storage.from("test-uploads").getPublicUrl(filename)
      setLogoUrl(data.publicUrl)
      setLocalLogoPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
      editsRef.current++
      setSaved(false)
      setSaveError("")
    }
    setUploading(false)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">Company Branding</h3>
      <p className="mt-0.5 text-xs text-zinc-500">Your logo appears on PDF reports sent to adjusters.</p>

      <div className="mt-4 space-y-3">
        {/* Logo */}
        <div>
          <label className="text-xs font-medium text-zinc-500">Company Logo</label>
          <div className="mt-1.5 flex items-center gap-3">
            {logoUrl ? (
              <div className="h-12 w-12 rounded-lg border border-zinc-200 overflow-hidden bg-white flex items-center justify-center">
                {localLogoPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={localLogoPreview} alt="Logo" className="h-full w-full object-contain" />
                  : <SignedImg src={logoUrl} alt="Logo" className="h-full w-full object-contain" />}
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : logoUrl ? "Change" : "Upload Logo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="company-name" className="text-xs font-medium text-zinc-500">Company Name</label>
          <input
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); editsRef.current++; setSaved(false); setSaveError("") }}
            id="company-name"
            placeholder="Smith Roofing LLC"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 min-h-[44px] text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-lg px-4 min-h-[44px] text-sm font-medium transition-colors ${
            saved
              ? "bg-green-600 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-500"
          } disabled:opacity-50`}
        >
          {saving ? "Saving..." : saved ? "Branding Saved!" : "Save Branding"}
        </button>
        {saveError && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {saveError}
          </p>
        )}
      </div>
    </div>
  )
}
