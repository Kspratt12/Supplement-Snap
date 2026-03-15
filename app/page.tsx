"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Supplement Snap</h1>
      <p className="mb-6 text-sm text-gray-500">
        Capture roof damage during tear-off
      </p>

      {/* Project selector */}
      <section className="mb-8 rounded border border-gray-700 p-4">
        <label className="mb-2 block text-sm font-medium">Project / Job</label>
        <div className="flex gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setShowNewProject(false)
            }}
            className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
            className="rounded bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700"
          >
            {showNewProject ? "Cancel" : "+ New"}
          </button>
        </div>

        {/* New project form */}
        {showNewProject && (
          <form onSubmit={handleCreateProject} className="mt-3 space-y-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name (e.g. Smith Residence)"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
            <input
              type="text"
              value={newProjectAddress}
              onChange={(e) => setNewProjectAddress(e.target.value)}
              placeholder="Property address (optional)"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={creatingProject || !newProjectName.trim()}
              className="rounded bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
            >
              {creatingProject ? "Creating..." : "Create Project"}
            </button>
          </form>
        )}

        {/* Selected project info */}
        {selectedProject && (
          <p className="mt-2 text-xs text-gray-500">
            {selectedProject.property_address || "No address"}
            {" · "}
            {captures.length} capture{captures.length !== 1 ? "s" : ""}
          </p>
        )}
      </section>

      {/* Capture form — only show when a project is selected */}
      {selectedProjectId ? (
        <form onSubmit={handleSave} className="mb-10 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Damage Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-gray-700"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-3 max-h-64 rounded border border-gray-700"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Damage Type
            </label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
            <label className="mb-1 block text-sm font-medium">Roof Area</label>
            <select
              value={roofArea}
              onChange={(e) => setRoofArea(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
            <label className="mb-1 block text-sm font-medium">
              Field Note
            </label>
            <textarea
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
              placeholder="Describe the damage..."
              rows={3}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {status && (
            <p
              className={`text-sm ${status.includes("failed") ? "text-red-400" : status.includes("saved") ? "text-green-400" : "text-gray-400"}`}
            >
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Capture"}
          </button>
        </form>
      ) : (
        <p className="mb-10 text-sm text-gray-500">
          Select or create a project above to start capturing damage.
        </p>
      )}

      {/* Saved captures for selected project */}
      {captures.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Captures ({captures.length})
          </h2>
          <div className="space-y-4">
            {captures.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded border border-gray-700"
              >
                <img
                  src={c.image_url}
                  alt={`${c.damage_type} - ${c.roof_area}`}
                  className="w-full object-cover"
                  style={{ maxHeight: "300px" }}
                />
                <div className="space-y-1 p-4">
                  <div className="flex gap-2">
                    <span className="rounded bg-gray-800 px-2 py-0.5 text-xs">
                      {c.damage_type}
                    </span>
                    <span className="rounded bg-gray-800 px-2 py-0.5 text-xs">
                      {c.roof_area}
                    </span>
                  </div>
                  {c.field_note && (
                    <p className="text-sm text-gray-300">{c.field_note}</p>
                  )}
                  <p className="truncate text-xs text-gray-500">
                    {c.image_url}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(c.created_at).toLocaleString()}
                  </p>

                  {!drafts[c.id] && !draftLoading[c.id] && (
                    <button
                      type="button"
                      onClick={() => generateDraft(c)}
                      className="mt-2 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      Generate Supplement Draft
                    </button>
                  )}

                  {draftLoading[c.id] && (
                    <p className="mt-2 text-xs text-gray-400">
                      Generating draft...
                    </p>
                  )}

                  {draftErrors[c.id] && (
                    <div className="mt-2">
                      <p className="text-xs text-red-400">
                        {draftErrors[c.id]}
                      </p>
                      <button
                        type="button"
                        onClick={() => generateDraft(c)}
                        className="mt-1 text-xs text-gray-400 underline hover:text-white"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {drafts[c.id] && (
                    <div className="mt-3 rounded border border-gray-600 bg-gray-900 p-3">
                      <p className="mb-1 text-xs font-medium text-gray-400">
                        Supplement Draft
                      </p>
                      <p className="text-sm text-gray-200">{drafts[c.id]}</p>
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
                        className="mt-2 rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
                      >
                        {copied[c.id] ? "Copied!" : "Copy Draft"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
