"use client"

import { useState, useEffect } from "react"

type Contact = {
  id: string
  name: string
  email: string
  company: string | null
  last_used_at: string
}

export function AdjusterContacts({ userId }: { userId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadContacts() }, [])

  async function loadContacts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/adjuster-contacts?userId=${userId}`)
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch {}
    setLoading(false)
  }

  async function handleAdd() {
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    await fetch("/api/adjuster-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: name.trim(), email: email.trim(), company: company.trim() }),
    })
    setName("")
    setEmail("")
    setCompany("")
    setShowAdd(false)
    setSaving(false)
    loadContacts()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/adjuster-contacts?id=${id}`, { method: "DELETE" })
    loadContacts()
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Saved Adjusters</h3>
          <p className="mt-0.5 text-xs text-zinc-400">Quick-select when sending reports</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-indigo-600 px-3 min-h-[36px] text-xs font-medium text-white hover:bg-indigo-500"
        >
          + Add
        </button>
      </div>

      {showAdd && (
        <div className="mt-3 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adjuster name"
            className="block w-full rounded-lg border border-zinc-300 px-3 min-h-[40px] text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adjuster@insurance.com"
            className="block w-full rounded-lg border border-zinc-300 px-3 min-h-[40px] text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Insurance company (optional)"
            className="block w-full rounded-lg border border-zinc-300 px-3 min-h-[40px] text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !name.trim() || !email.trim()}
              className="flex-1 rounded-lg bg-indigo-600 min-h-[40px] text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "..." : "Save Contact"}
            </button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-zinc-300 bg-white px-3 min-h-[40px] text-xs text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-3 flex justify-center py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="mt-3 text-center text-xs text-zinc-400 py-2">No saved adjusters yet.</p>
      ) : (
        <div className="mt-3 space-y-1.5">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                <p className="text-xs text-zinc-400 truncate">{c.email}{c.company ? ` · ${c.company}` : ""}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-zinc-400 hover:text-red-600 flex-shrink-0 ml-2">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
