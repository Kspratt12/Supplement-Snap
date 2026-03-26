"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { extractAllExifData } from "../../lib/exif-utils"
import { uploadPhotosWithRetry } from "../../lib/upload-utils"

const DAMAGE_TYPES = ["Decking", "Flashing", "Vent / Pipe Boot", "Drip Edge", "Ice & Water", "Multiple Layers", "Other"]
const ROOF_AREAS = ["Front", "Back", "Left", "Right", "Valley", "Chimney", "Ridge", "Eave"]

type Project = { id: string; project_name: string }

// Shared helpers
function useProjects(userId: string, open: boolean) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)

  useEffect(() => {
    if (open) load()
  }, [open])

  async function load() {
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

  async function createProject(): Promise<string | null> {
    if (!newProjectName.trim()) return null
    setCreatingProject(true)
    const { data } = await supabase
      .from("projects")
      .insert({ project_name: newProjectName.trim(), user_id: userId })
      .select("id, project_name")
      .single()
    if (data) {
      setProjects((p) => [data, ...p])
      setSelectedProjectId(data.id)
      setNewProjectName("")
      setCreatingProject(false)
      return data.id
    }
    setCreatingProject(false)
    return null
  }

  function reset() {
    setSelectedProjectId(projects.length > 0 ? projects[0].id : "")
    setNewProjectName("")
    setCreatingProject(false)
  }

  return { projects, selectedProjectId, setSelectedProjectId, newProjectName, setNewProjectName, creatingProject, createProject, reset, reload: load }
}

function ProjectPicker({ p }: { p: ReturnType<typeof useProjects> }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500">Project</label>
      {p.projects.length > 0 ? (
        <select
          value={p.selectedProjectId}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              p.setSelectedProjectId("")
              p.setNewProjectName("")
            } else {
              p.setSelectedProjectId(e.target.value)
            }
          }}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 min-h-[48px] text-sm text-zinc-900"
        >
          {p.projects.map((proj) => (
            <option key={proj.id} value={proj.id}>{proj.project_name}</option>
          ))}
          <option value="__new__">+ Create new project</option>
        </select>
      ) : null}

      {(p.projects.length === 0 || !p.selectedProjectId) && (
        <div className="mt-2 flex gap-2">
          <input
            value={p.newProjectName}
            onChange={(e) => p.setNewProjectName(e.target.value)}
            placeholder="e.g. Smith Residence"
            className="flex-1 rounded-lg border border-zinc-300 px-3 min-h-[48px] text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <button
            onClick={p.createProject}
            disabled={p.creatingProject || !p.newProjectName.trim()}
            className="rounded-lg bg-indigo-600 px-4 min-h-[48px] text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {p.creatingProject ? "..." : "Create"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── QUICK VOICE RECORD ─────────────────────────────────────────
// Voice-first: record a voice note, pick/create project, save.
// Photos are optional — can be added later in the full app.

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

export function QuickVoiceRecord({
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
  const p = useProjects(userId, open)
  const [fieldNote, setFieldNote] = useState("")
  const [damageType, setDamageType] = useState("")
  const [roofArea, setRoofArea] = useState("")
  const [recording, setRecording] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    if (open) {
      setFieldNote("")
      setDamageType("")
      setRoofArea("")
      setRecording(false)
      setTranslating(false)
      setTranslated(false)
      setSaving(false)
      setSaved(false)
      setError("")
      p.reset()
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [open])

  const speechSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript) {
        setFieldNote((prev) => {
          const spacer = prev && !prev.endsWith(" ") ? " " : ""
          return prev + spacer + transcript
        })
      }
    }

    recognition.onend = () => {
      setRecording(false)
      // Auto-translate after recording stops
      setTimeout(() => translateNote(), 100)
    }

    recognition.onerror = () => {
      setRecording(false)
    }

    recognition.start()
    setRecording(true)
  }

  async function translateNote() {
    // Get the current note value from DOM since state might be stale
    const noteEl = document.getElementById("qvr-note") as HTMLTextAreaElement | null
    const currentNote = noteEl?.value || ""
    if (!currentNote.trim()) return

    setTranslating(true)
    try {
      const res = await fetch("/api/translate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentNote }),
      })
      const data = await res.json()
      if (data.translated && data.text) {
        setFieldNote(data.text)
        setTranslated(true)
        setTimeout(() => setTranslated(false), 4000)
      }
    } catch {
      // Translation failed silently — keep original text
    } finally {
      setTranslating(false)
    }
  }

  async function handleSave() {
    if (!p.selectedProjectId && !p.newProjectName.trim()) {
      setError("Select or create a project first.")
      return
    }
    if (!fieldNote.trim()) { setError("Record or type a damage note first."); return }
    if (!damageType) { setError("Select a damage type."); return }
    if (!roofArea) { setError("Select a roof area."); return }

    setSaving(true)
    setError("")

    try {
      let projectId = p.selectedProjectId
      if (!projectId) {
        const newId = await p.createProject()
        if (!newId) { setError("Failed to create project."); setSaving(false); return }
        projectId = newId
      }

      // Insert capture with voice note only — no photo required
      const row: Record<string, string> = {
        project_id: projectId,
        image_url: "",
        damage_type: damageType,
        roof_area: roofArea,
        field_note: fieldNote,
        status: "Captured",
      }

      const { error: insertErr } = await supabase.from("captures").insert(row)
      if (insertErr) {
        // Fallback
        await supabase.from("captures").insert({
          project_id: projectId,
          image_url: "",
          damage_type: damageType,
          roof_area: roofArea,
          field_note: fieldNote,
        })
      }

      setSaved(true)
      onSaved()
      setTimeout(() => onClose(), 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.")
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
          <h2 className="text-base font-bold text-zinc-900">Quick Voice Record</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100">
            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {saved ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-900">Voice note saved!</p>
              <p className="mt-1 text-xs text-zinc-500">You can add photos later in the full app.</p>
            </div>
          ) : (
            <>
              {/* Mic button */}
              <div className="flex flex-col items-center py-4">
                {speechSupported ? (
                  <button
                    onClick={toggleRecording}
                    className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                      recording
                        ? "bg-red-500 shadow-lg shadow-red-200 animate-pulse"
                        : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-200"
                    }`}
                  >
                    {recording ? (
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12v12H6z" />
                      </svg>
                    ) : (
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <p className="text-xs text-zinc-400">Voice recording not supported in this browser.</p>
                )}
                <p className="mt-3 text-sm font-medium text-zinc-600">
                  {recording ? "Recording... tap to stop" : "Tap to record damage note"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">Speak in any language — auto-translates to English</p>
              </div>

              {/* Translation indicator */}
              {translating && (
                <div className="flex items-center justify-center gap-2 text-xs text-indigo-600">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  Translating to English...
                </div>
              )}
              {translated && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-green-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Translated to English
                </div>
              )}

              {/* Note text */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Damage Note</label>
                <textarea
                  id="qvr-note"
                  value={fieldNote}
                  onChange={(e) => setFieldNote(e.target.value)}
                  placeholder="Tap the mic above or type your note here..."
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
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
                        damageType === type ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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
                        roofArea === area ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project */}
              <ProjectPicker p={p} />

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 min-h-[48px] text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Voice Note"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── QUICK PHOTO CAPTURE ────────────────────────────────────────
// Photo-first: snap a photo or upload, pick/create project, save.

export function QuickPhotoCapture({
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
  const p = useProjects(userId, open)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [damageType, setDamageType] = useState("")
  const [roofArea, setRoofArea] = useState("")
  const [fieldNote, setFieldNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPhotos([])
      setPreviews([])
      setDamageType("")
      setRoofArea("")
      setFieldNote("")
      setSaving(false)
      setSaved(false)
      setError("")
      p.reset()
    }
  }, [open])

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 6 - photos.length)
    if (newFiles.length === 0) return
    const updated = [...photos, ...newFiles].slice(0, 6)
    setPhotos(updated)
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 6))
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
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

  async function handleSave() {
    if (!p.selectedProjectId && !p.newProjectName.trim()) {
      setError("Select or create a project first.")
      return
    }
    if (photos.length === 0) { setError("Add at least one photo."); return }
    if (!damageType) { setError("Select a damage type."); return }
    if (!roofArea) { setError("Select a roof area."); return }

    setSaving(true)
    setError("")

    try {
      let projectId = p.selectedProjectId
      if (!projectId) {
        const newId = await p.createProject()
        if (!newId) { setError("Failed to create project."); setSaving(false); return }
        projectId = newId
      }

      // Extract EXIF metadata BEFORE compression (compression strips it)
      const photoMetadata = await extractAllExifData(photos)

      // Compress all photos
      const compressed = await Promise.all(photos.map((f) => compressImage(f)))

      // Upload with retry logic
      const { urls: uploadedUrls, failedIndexes } = await uploadPhotosWithRetry(compressed)

      if (uploadedUrls.length === 0) {
        setError("All uploads failed. Check your connection and try again.")
        setSaving(false)
        return
      }

      const row = {
        project_id: projectId,
        image_url: uploadedUrls[0],
        image_urls: uploadedUrls,
        damage_type: damageType,
        roof_area: roofArea,
        field_note: fieldNote,
        status: "Captured",
        photo_metadata: photoMetadata,
      }

      const { error: insertErr } = await supabase.from("captures").insert(row)
      if (insertErr) {
        await supabase.from("captures").insert({
          project_id: projectId,
          image_url: uploadedUrls[0],
          image_urls: uploadedUrls,
          damage_type: damageType,
          roof_area: roofArea,
          field_note: fieldNote,
        })
      }

      if (failedIndexes.length > 0) {
        setError(`Saved! ${failedIndexes.length} photo(s) failed to upload — you can re-add them later.`)
      }

      setSaved(true)
      onSaved()
      setTimeout(() => onClose(), 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save capture.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const hasPhotos = photos.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-3.5 rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-base font-bold text-zinc-900">Quick Photo Capture</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100">
            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {saved ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-900">Photo capture saved!</p>
            </div>
          ) : (
            <>
              {/* Photo section */}
              {hasPhotos ? (
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
                  <p className="text-xs font-medium text-zinc-500">Snap or upload damage photos</p>
                  <div className="grid grid-cols-2 gap-3">
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

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

              {hasPhotos && (
                <>
                  <ProjectPicker p={p} />

                  <div>
                    <label className="text-xs font-medium text-zinc-500">Damage Type</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {DAMAGE_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setDamageType(type)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            damageType === type ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500">Roof Area</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ROOF_AREAS.map((area) => (
                        <button
                          key={area}
                          onClick={() => setRoofArea(area)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            roofArea === area ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500">Notes (optional)</label>
                    <textarea
                      value={fieldNote}
                      onChange={(e) => setFieldNote(e.target.value)}
                      placeholder="Quick description of the damage..."
                      rows={2}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  {error && <p className="text-xs text-red-600">{error}</p>}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-lg bg-indigo-600 min-h-[48px] text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving ? "Uploading..." : "Save Photo Capture"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
