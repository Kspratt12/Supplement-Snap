"use client"

import { useState, useEffect } from "react"

type TeamMember = {
  id: string
  member_email: string
  member_name: string | null
  role: string
  status: string
  invited_at: string
}

export function TeamManager({ userId }: { userId: string }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("crew")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/team?ownerId=${userId}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch {
      setMembers([])
    }
    setLoading(false)
  }

  async function handleInvite() {
    if (!email.trim()) return
    setInviting(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: userId, email: email.trim(), name: name.trim(), role }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`Invite sent to ${email}`)
        setEmail("")
        setName("")
        setShowInvite(false)
        loadMembers()
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch {
      setError("Failed to send invite")
    }
    setInviting(false)
  }

  async function handleRemove(id: string) {
    await fetch(`/api/team?id=${id}`, { method: "DELETE" })
    loadMembers()
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Your Team</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{members.length} member{members.length !== 1 ? "s" : ""} invited</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-lg bg-indigo-600 px-3 min-h-[36px] text-xs font-medium text-white hover:bg-indigo-500"
        >
          + Invite
        </button>
      </div>

      {success && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      )}

      {showInvite && (
        <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div>
            <label className="text-xs font-medium text-zinc-500">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="crew@company.com"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 min-h-[44px] text-sm text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 min-h-[44px] text-sm text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 min-h-[44px] text-sm text-zinc-900"
            >
              <option value="crew">Crew Member</option>
              <option value="foreman">Foreman</option>
              <option value="office">Office Staff</option>
              <option value="manager">Project Manager</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={inviting || !email.trim()}
              className="flex-1 rounded-lg bg-indigo-600 min-h-[44px] text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send Invite"}
            </button>
            <button
              onClick={() => { setShowInvite(false); setError("") }}
              className="rounded-lg border border-zinc-300 bg-white px-4 min-h-[44px] text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Team list */}
      {loading ? (
        <div className="mt-4 flex justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <p className="mt-4 text-center text-xs text-zinc-400 py-3">
          No team members yet. Invite your crew to start collaborating.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {m.member_name || m.member_email}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    m.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {m.status === "active" ? "Active" : "Pending"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate">{m.role} · {m.member_email}</p>
              </div>
              <button
                onClick={() => handleRemove(m.id)}
                className="flex-shrink-0 text-xs text-zinc-400 hover:text-red-600 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
