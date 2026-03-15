"use client"

import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [status, setStatus] = useState("No upload yet")

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImage(URL.createObjectURL(file))
    setStatus("Uploading...")

    const fileName = `${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("test-uploads")
      .upload(fileName, file)

    if (error) {
      setStatus(`Upload failed: ${error.message}`)
      return
    }

    setStatus("Upload successful")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-10">
      <h1 className="text-3xl font-bold">Supplement Snap Supabase Test</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="border p-2"
      />

      <p>{status}</p>

      {image && (
        <img
          src={image}
          alt="uploaded preview"
          className="max-w-md rounded border"
        />
      )}
    </main>
  )
}