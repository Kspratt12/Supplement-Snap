"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

const DAMAGE_TYPES = [
  "Decking",
  "Flashing",
  "Vent / Pipe Boot",
  "Drip Edge",
  "Ice & Water",
  "Multiple Layers",
  "Other",
] as const

const ROOF_AREAS = [
  "Front",
  "Back",
  "Left",
  "Right",
  "Valley",
  "Chimney",
  "Ridge",
  "Eave",
] as const

type Project = {
  id: string
  project_name: string
  property_address: string
  created_at: string
}

type Capture = {
  id: string
  project_id: string
  image_url: string
  damage_type: string
  roof_area: string
  field_note: string
  created_at: string
}

export default function Home() {
  // Project state
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectAddress, setNewProjectAddress] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)

  // Capture form state
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [damageType, setDamageType] = useState("")
  const [roofArea, setRoofArea] = useState("")
  const [fieldNote, setFieldNote] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  // Captures + drafts
  const [captures, setCaptures] = useState<Capture[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({})
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  // Project draft state
  const [projectDraft, setProjectDraft] = useState("")
  const [projectDraftLoading, setProjectDraftLoading] = useState(false)
  const [projectDraftError, setProjectDraftError] = useState("")
  const [projectDraftCopied, setProjectDraftCopied] = useState(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load captures when selected project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadCaptures(selectedProjectId)
    } else {
      setCaptures([])
    }
    setDrafts({})
    setDraftLoading({})
    setDraftErrors({})
    setProjectDraft("")
    setProjectDraftError("")
  }, [selectedProjectId])

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setProjects(data)
  }

  async function loadCaptures(projectId: string) {
    const { data } = await supabase
      .from("captures")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
    if (data) setCaptures(data)
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreatingProject(true)
    const { data, error } = await supabase
      .from("projects")
      .insert({
        project_name: newProjectName.trim(),
        property_address: newProjectAddress.trim(),
      })
      .select()
      .single()

    if (!error && data) {
      setProjects((prev) => [data, ...prev])
      setSelectedProjectId(data.id)
      setNewProjectName("")
      setNewProjectAddress("")
      setShowNewProject(false)
    }
    setCreatingProject(false)
  }

  async function deleteCapture(c: Capture) {
    if (!confirm("Delete this capture? This cannot be undone.")) return

    // Extract storage file path from the public URL
    const match = c.image_url.match(/test-uploads\/(.+)$/)
    if (match) {
      await supabase.storage.from("test-uploads").remove([match[1]])
    }

    await supabase.from("captures").delete().eq("id", c.id)
    setCaptures((prev) => prev.filter((cap) => cap.id !== c.id))
  }

  async function generateProjectDraft() {
    if (!selectedProject || !selectedProjectId) return

    setProjectDraftLoading(true)
    setProjectDraftError("")
    setProjectDraft("")

    try {
      // Re-fetch fresh captures from Supabase to ensure we have the latest data
      const { data: freshCaptures, error: fetchError } = await supabase
        .from("captures")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to load captures: ${fetchError.message}`)
      }

      if (!freshCaptures || freshCaptures.length === 0) {
        throw new Error("No captures found for this project.")
      }

      const res = await fetch("/api/generate-project-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: selectedProject.project_name,
          property_address: selectedProject.property_address,
          captures: freshCaptures.map((c) => ({
            damage_type: c.damage_type,
            roof_area: c.roof_area,
            field_note: c.field_note,
            created_at: c.created_at,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      const { draft } = await res.json()
      setProjectDraft(draft)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setProjectDraftError(message)
    } finally {
      setProjectDraftLoading(false)
    }
  }

  async function generateDraft(c: Capture) {
    setDraftLoading((prev) => ({ ...prev, [c.id]: true }))
    setDraftErrors((prev) => ({ ...prev, [c.id]: "" }))

    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          damage_type: c.damage_type,
          roof_area: c.roof_area,
          field_note: c.field_note,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      const { draft } = await res.json()
      setDrafts((prev) => ({ ...prev, [c.id]: draft }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setDraftErrors((prev) => ({ ...prev, [c.id]: message }))
    } finally {
      setDraftLoading((prev) => ({ ...prev, [c.id]: false }))
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setStatus("")
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedProjectId) {
      setStatus("Please select or create a project first.")
      return
    }
    if (!file) {
      setStatus("Please select a photo first.")
      return
    }
    if (!damageType) {
      setStatus("Please select a damage type.")
      return
    }
    if (!roofArea) {
      setStatus("Please select a roof area.")
      return
    }

    setSaving(true)
    setStatus("Uploading photo...")

    const fileName = `${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("test-uploads")
      .upload(fileName, file)

    if (uploadError) {
      setStatus(`Upload failed: ${uploadError.message}`)
      setSaving(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("test-uploads")
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    setStatus("Saving capture...")

    const { error: insertError } = await supabase.from("captures").insert({
      project_id: selectedProjectId,
      image_url: imageUrl,
      damage_type: damageType,
      roof_area: roofArea,
      field_note: fieldNote,
    })

    if (insertError) {
      setStatus(`Save failed: ${insertError.message}`)
      setSaving(false)
      return
    }

    setStatus("Capture saved!")
    setFile(null)
    setPreview(null)
    setDamageType("")
    setRoofArea("")
    setFieldNote("")
    setSaving(false)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (input) input.value = ""

    await loadCaptures(selectedProjectId)
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* App header */}
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Supplement Snap</h1>
            <p className="text-sm text-zinc-500">
              Capture roof damage during tear-off and generate supplement drafts
            </p>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Back to Site
        </Link>
      </header>

      {/* Project selector */}
      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Project / Job
        </label>
        <div className="flex gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setShowNewProject(false)
            }}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
                {p.property_address ? ` — ${p.property_address}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewProject(!showNewProject)}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
          >
            {showNewProject ? "Cancel" : "+ New"}
          </button>
        </div>

        {/* New project form */}
        {showNewProject && (
          <form onSubmit={handleCreateProject} className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name (e.g. Smith Residence)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <input
              type="text"
              value={newProjectAddress}
              onChange={(e) => setNewProjectAddress(e.target.value)}
              placeholder="Property address (optional)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={creatingProject || !newProjectName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingProject ? "Creating..." : "Create Project"}
            </button>
          </form>
        )}

        {/* Selected project info */}
        {selectedProject && (
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{selectedProject.property_address || "No address"}</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="font-medium text-zinc-600 dark:text-zinc-400">
              {captures.length} capture{captures.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </section>

      {/* Project draft */}
      {selectedProject && captures.length > 0 && (
        <section className="mb-8">
          {!projectDraft && !projectDraftLoading && (
            <button
              type="button"
              onClick={generateProjectDraft}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              Generate Project Draft ({captures.length} capture
              {captures.length !== 1 ? "s" : ""})
            </button>
          )}

          {projectDraftLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-zinc-500">Generating project draft...</p>
            </div>
          )}

          {projectDraftError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">{projectDraftError}</p>
              <button
                type="button"
                onClick={generateProjectDraft}
                className="mt-1 text-xs font-medium text-red-500 underline hover:text-red-400"
              >
                Retry
              </button>
            </div>
          )}

          {projectDraft && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Project Supplement Draft
                </p>
              </div>

              {/* Findings summary */}
              <div className="mb-4 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                <p className="mb-2 text-xs font-medium text-zinc-400">
                  Based on {captures.length} finding{captures.length !== 1 ? "s" : ""}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {captures.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      <span className="font-medium">{c.damage_type}</span>
                      <span className="text-zinc-300 dark:text-zinc-600">/</span>
                      <span>{c.roof_area}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Draft text */}
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {projectDraft}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(projectDraft)
                    setProjectDraftCopied(true)
                    setTimeout(() => setProjectDraftCopied(false), 2000)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {projectDraftCopied ? "Copied!" : "Copy Draft"}
                </button>
                <button
                  type="button"
                  onClick={generateProjectDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Capture form — only show when a project is selected */}
      {selectedProjectId ? (
        <form onSubmit={handleSave} className="mb-10 space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">New Capture</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Damage Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-3 max-h-64 rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Damage Type
            </label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select damage type...</option>
              {DAMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Roof Area
            </label>
            <select
              value={roofArea}
              onChange={(e) => setRoofArea(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select roof area...</option>
              {ROOF_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Field Note
            </label>
            <textarea
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
              placeholder="Describe the damage..."
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          {status && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                status.includes("failed")
                  ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                  : status.includes("saved")
                    ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Capture"}
          </button>
        </form>
      ) : (
        <div className="mb-10 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <svg className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-2 text-sm text-zinc-500">
            Select or create a project above to start capturing damage.
          </p>
        </div>
      )}

      {/* Saved captures for selected project */}
      {captures.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Captures
            </h2>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {captures.length}
            </span>
          </div>
          <div className="space-y-4">
            {captures.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <img
                  src={c.image_url}
                  alt={`${c.damage_type} - ${c.roof_area}`}
                  className="w-full object-cover"
                  style={{ maxHeight: "280px" }}
                />
                <div className="p-4 space-y-3">
                  {/* Tags + timestamp row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                        {c.damage_type}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {c.roof_area}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Field note */}
                  {c.field_note && (
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{c.field_note}</p>
                  )}

                  {/* Generate draft button */}
                  {!drafts[c.id] && !draftLoading[c.id] && (
                    <button
                      type="button"
                      onClick={() => generateDraft(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate Supplement Draft
                    </button>
                  )}

                  {/* Draft loading */}
                  {draftLoading[c.id] && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <p className="text-xs text-zinc-500">Generating draft...</p>
                    </div>
                  )}

                  {/* Draft error */}
                  {draftErrors[c.id] && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/30">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {draftErrors[c.id]}
                      </p>
                      <button
                        type="button"
                        onClick={() => generateDraft(c)}
                        className="mt-1 text-xs font-medium text-red-500 underline hover:text-red-400"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Draft result */}
                  {drafts[c.id] && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <div className="mb-2 flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Supplement Draft
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{drafts[c.id]}</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(drafts[c.id])
                          setCopied((prev) => ({ ...prev, [c.id]: true }))
                          setTimeout(
                            () =>
                              setCopied((prev) => ({
                                ...prev,
                                [c.id]: false,
                              })),
                            2000
                          )
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copied[c.id] ? "Copied!" : "Copy Draft"}
                      </button>
                    </div>
                  )}

                  {/* Delete */}
                  <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => deleteCapture(c)}
                      className="text-xs text-zinc-400 hover:text-red-500"
                    >
                      Delete Capture
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
