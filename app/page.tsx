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

type Capture = {
  id: string
  image_url: string
  damage_type: string
  roof_area: string
  field_note: string
  created_at: string
}

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [damageType, setDamageType] = useState("")
  const [roofArea, setRoofArea] = useState("")
  const [fieldNote, setFieldNote] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  function generateDraft(c: Capture) {
    const note = c.field_note
      ? `The contractor noted: ${c.field_note}.`
      : "No additional field notes were recorded."
    const draft =
      `During tear-off on the ${c.roof_area} of the roof, damage to the ${c.damage_type} was discovered. ` +
      `${note} ` +
      `This condition was not visible prior to shingle removal and requires repair or replacement as part of the restoration scope.`
    setDrafts((prev) => ({ ...prev, [c.id]: draft }))
  }

  useEffect(() => {
    loadCaptures()
  }, [])

  async function loadCaptures() {
    const { data, error } = await supabase
      .from("captures")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setCaptures(data)
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

    // Reset file input
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (input) input.value = ""

    await loadCaptures()
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Supplement Snap</h1>
      <p className="mb-8 text-sm text-gray-500">
        Capture roof damage during tear-off
      </p>

      <form onSubmit={handleSave} className="mb-10 space-y-5">
        {/* Photo upload */}
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

        {/* Damage type */}
        <div>
          <label className="mb-1 block text-sm font-medium">Damage Type</label>
          <select
            value={damageType}
            onChange={(e) => setDamageType(e.target.value)}
            className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm"
          >
            <option value="">Select damage type...</option>
            {DAMAGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Roof area */}
        <div>
          <label className="mb-1 block text-sm font-medium">Roof Area</label>
          <select
            value={roofArea}
            onChange={(e) => setRoofArea(e.target.value)}
            className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm"
          >
            <option value="">Select roof area...</option>
            {ROOF_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Field note */}
        <div>
          <label className="mb-1 block text-sm font-medium">Field Note</label>
          <textarea
            value={fieldNote}
            onChange={(e) => setFieldNote(e.target.value)}
            placeholder="Describe the damage..."
            rows={3}
            className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm"
          />
        </div>

        {/* Status */}
        {status && (
          <p
            className={`text-sm ${status.includes("failed") ? "text-red-400" : status.includes("saved") ? "text-green-400" : "text-gray-400"}`}
          >
            {status}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Capture"}
        </button>
      </form>

      {/* Saved captures */}
      {captures.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Saved Captures ({captures.length})
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
                  {!drafts[c.id] && (
                    <button
                      type="button"
                      onClick={() => generateDraft(c)}
                      className="mt-2 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      Generate Supplement Draft
                    </button>
                  )}
                  {drafts[c.id] && (
                    <div className="mt-3 rounded border border-gray-600 bg-gray-900 p-3">
                      <p className="mb-1 text-xs font-medium text-gray-400">
                        Supplement Draft
                      </p>
                      <p className="text-sm text-gray-200">{drafts[c.id]}</p>
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
