"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"

const DAMAGE_TYPES = ["Decking", "Flashing", "Vent / Pipe Boot", "Drip Edge", "Ice & Water", "Multiple Layers", "Other"]
const ROOF_AREAS = ["Front", "Back", "Left", "Right", "Valley", "Chimney", "Ridge", "Eave"]

type Project = { id: string; project_name: string }

export function QuickCapture({
  userId,
  open,
  onClose,
  onSaved,
}: {
  userId: string
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [step, setStep] = useState<"photo" | "details">("photo")
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [damageType, setDamageType] = useState("")
  const [roofArea, setRoofArea] = useState("")
  const [fieldNote, setFieldNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      loadProjects()
      // Reset state
      setStep("photo")
      setPhotos([])
      setPreviews([])
      setDamageType("")
      setRoofArea("")
      setFieldNote("")
      setNewProjectName("")
      setCreatingProject(false)
      setError("")
      setSelectedProjectId("")
    }
  }, [open])

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("id, project_name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (data) {
      setProjects(data)
      if (data.length > 0) setSelectedProjectId(data[0].id)
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 6 - photos.length)
    if (newFiles.length === 0) return

    const updated = [...photos, ...newFiles].slice(0, 6)
    setPhotos(updated)

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setPreviews((p) => [...p, ...newPreviews].slice(0, 6))
    setStep("details")
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setPhotos((p) => p.filter((_, i) => i !== index))
    setPreviews((p) => p.filter((_, i) => i !== index))
  }

  async function compressImage(file: File): Promise<Blob> {
    if (file.size < 500 * 1024) return file
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxW = 1200
        const scale = img.width > maxW ? maxW / img.width : 1
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.8)
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    setCreatingProject(true)
    const { data, error: err } = await supabase
      .from("projects")
      .insert({ project_name: newProjectName.trim(), user_id: userId })
      .select("id, project_name")
      .single()
    if (data) {
      setProjects((p) => [data, ...p])
      setSelectedProjectId(data.id)
      setNewProjectName("")
    }
    if (err) setError(err.message)
    setCreatingProject(false)
  }

  async function handleSave() {
    if (!selectedProjectId) { setError("Select or create a project first."); return }
    if (photos.length === 0) { setError("Add at least one photo."); return }
    if (!damageType) { setError("Select a damage type."); return }
    if (!roofArea) { setError("Select a roof area."); return }

    setSaving(true)
    setError("")

    try {
      // Upload photos
      const uploadedUrls: string[] = []
      for (const file of photos) {
        const compressed = await compressImage(file)
        const rand = Math.random().toString(36).slice(2, 8)
        const filename = `${Date.now()}-${rand}-${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from("test-uploads")
          .upload(filename, compressed, { contentType: "image/jpeg" })
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from("test-uploads").getPublicUrl(filename)
        uploadedUrls.push(urlData.publicUrl)
      }

      // Insert capture
      const row = {
        project_id: selectedProjectId,
        image_url: uploadedUrls[0],
        image_urls: uploadedUrls,
        damage_type: damageType,
        roof_area: roofArea,
        field_note: fieldNote,
        status: "Captured",
      }

      const { error: insertErr } = await supabase.from("captures").insert(row)
      if (insertErr) {
        // Fallback without newer columns
        await supabase.from("captures").insert({
          project_id: selectedProjectId,
          image_url: uploadedUrls[0],
          damage_type: damageType,
          roof_area: roofArea,
          field_note: fieldNote,
        })
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save capture.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-3.5 rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-base font-bold text-zinc-900">Quick Capture</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100"
          >
            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Photo section */}
          {photos.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">Photos ({photos.length}/6)</p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 hover:border-indigo-400 hover:text-indigo-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">Take or upload a damage photo</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Camera button — shows on mobile */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-8 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-sm font-medium">Take Photo</span>
                </button>
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-8 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium">Upload File</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Details (shown after photo) */}
          {step === "details" && (
            <>
              {/* Project picker */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Project</label>
                {projects.length > 0 ? (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setSelectedProjectId("")
                        setNewProjectName("")
                      } else {
                        setSelectedProjectId(e.target.value)
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 min-h-[48px] text-sm text-zinc-900"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                    <option value="__new__">+ Create new project</option>
                  </select>
                ) : null}

                {(projects.length === 0 || !selectedProjectId) && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Smith Residence"
                      className="flex-1 rounded-lg border border-zinc-300 px-3 min-h-[48px] text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                    <button
                      onClick={handleCreateProject}
                      disabled={creatingProject || !newProjectName.trim()}
                      className="rounded-lg bg-indigo-600 px-4 min-h-[48px] text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {creatingProject ? "..." : "Create"}
                    </button>
                  </div>
                )}
              </div>

              {/* Damage type */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Damage Type</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DAMAGE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setDamageType(type)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        damageType === type
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roof area */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Roof Area</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ROOF_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => setRoofArea(area)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        roofArea === area
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Damage Notes (optional)</label>
                <textarea
                  value={fieldNote}
                  onChange={(e) => setFieldNote(e.target.value)}
                  placeholder="Describe the damage or use voice dictation in the full app..."
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 min-h-[48px] text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Capture"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
