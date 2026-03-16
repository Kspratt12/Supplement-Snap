"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"

export function CompanySettings({ userId }: { userId: string }) {
  const [companyName, setCompanyName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch(`/api/company-settings?userId=${userId}`)
      const data = await res.json()
      if (data.settings) {
        setCompanyName(data.settings.company_name || "")
        setLogoUrl(data.settings.logo_url || "")
      }
    } catch {}
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/company-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, companyName, logoUrl }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogoUpload(file: File) {
    setUploading(true)
    const rand = Math.random().toString(36).slice(2, 8)
    const filename = `logo-${userId}-${rand}-${file.name}`
    const { error } = await supabase.storage.from("test-uploads").upload(filename, file, { contentType: file.type })
    if (!error) {
      const { data } = supabase.storage.from("test-uploads").getPublicUrl(filename)
      setLogoUrl(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">Company Branding</h3>
      <p className="mt-0.5 text-xs text-zinc-400">Your logo appears on PDF reports sent to adjusters.</p>

      <div className="mt-4 space-y-3">
        {/* Logo */}
        <div>
          <label className="text-xs font-medium text-zinc-500">Company Logo</label>
          <div className="mt-1.5 flex items-center gap-3">
            {logoUrl ? (
              <div className="h-12 w-12 rounded-lg border border-zinc-200 overflow-hidden bg-white flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
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
          <label className="text-xs font-medium text-zinc-500">Company Name</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Smith Roofing LLC"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 min-h-[44px] text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 min-h-[40px] text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Branding"}
          </button>
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
