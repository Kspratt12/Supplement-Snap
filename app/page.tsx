"use client"

import { useState } from "react"

export default function Home() {
  const [image, setImage] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setImage(url)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-10">
      <h1 className="text-3xl font-bold">Supplement Snap Upload Test</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="border p-2"
      />

      {image && (
        <img
          src={image}
          alt="uploaded"
          className="max-w-md rounded border"
        />
      )}
    </main>
  )
}