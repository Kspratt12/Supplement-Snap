"use client"

import { useState, useRef, useEffect, useCallback } from "react"

type Tool = "circle" | "arrow" | "text"
type Annotation = {
  tool: Tool
  x: number
  y: number
  x2?: number
  y2?: number
  text?: string
  color: string
}

export function PhotoAnnotator({
  imageUrl,
  open,
  onClose,
  onSave,
}: {
  imageUrl: string
  open: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>("circle")
  const [color, setColor] = useState("#ef4444")
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Draw annotations
    for (const a of annotations) {
      ctx.strokeStyle = a.color
      ctx.fillStyle = a.color
      ctx.lineWidth = 3

      if (a.tool === "circle") {
        const rx = Math.abs((a.x2 || a.x) - a.x) / 2
        const ry = Math.abs((a.y2 || a.y) - a.y) / 2
        const cx = (a.x + (a.x2 || a.x)) / 2
        const cy = (a.y + (a.y2 || a.y)) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 10), Math.max(ry, 10), 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (a.tool === "arrow") {
        const x2 = a.x2 || a.x
        const y2 = a.y2 || a.y
        // Line
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        // Arrowhead
        const angle = Math.atan2(y2 - a.y, x2 - a.x)
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      } else if (a.tool === "text" && a.text) {
        ctx.font = "bold 16px sans-serif"
        // Background
        const metrics = ctx.measureText(a.text)
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        ctx.fillRect(a.x - 2, a.y - 16, metrics.width + 8, 22)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(a.text, a.x + 2, a.y)
      }
    }
  }, [annotations, imageLoaded])

  useEffect(() => {
    if (!open) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (canvas) {
        // Scale to fit container
        const maxW = Math.min(600, window.innerWidth - 48)
        const scale = maxW / img.width
        canvas.width = maxW
        canvas.height = img.height * scale
        setImageLoaded(true)
      }
    }
    img.src = imageUrl
    setAnnotations([])
    setImageLoaded(false)
  }, [open, imageUrl])

  useEffect(() => {
    draw()
  }, [draw])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (tool === "text") {
      const pos = getPos(e)
      const text = prompt("Enter annotation text:")
      if (text) {
        setAnnotations((prev) => [...prev, { tool: "text", x: pos.x, y: pos.y, text, color }])
      }
      return
    }
    setDrawing(true)
    setStartPos(getPos(e))
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || !startPos) return
    const pos = getPos(e)
    // Live preview
    const temp = [...annotations, { tool, x: startPos.x, y: startPos.y, x2: pos.x, y2: pos.y, color }]
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    for (const a of temp) {
      ctx.strokeStyle = a.color
      ctx.lineWidth = 3
      if (a.tool === "circle") {
        const rx = Math.abs((a.x2 || a.x) - a.x) / 2
        const ry = Math.abs((a.y2 || a.y) - a.y) / 2
        const cx = (a.x + (a.x2 || a.x)) / 2
        const cy = (a.y + (a.y2 || a.y)) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 5), Math.max(ry, 5), 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (a.tool === "arrow") {
        const x2 = a.x2 || a.x
        const y2 = a.y2 || a.y
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        const angle = Math.atan2(y2 - a.y, x2 - a.x)
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      } else if (a.tool === "text" && a.text) {
        ctx.font = "bold 16px sans-serif"
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        const metrics = ctx.measureText(a.text)
        ctx.fillRect(a.x - 2, a.y - 16, metrics.width + 8, 22)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(a.text, a.x + 2, a.y)
      }
    }
  }

  function handleEnd(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || !startPos) return
    setDrawing(false)
    const pos = getPos(e)
    setAnnotations((prev) => [...prev, { tool, x: startPos.x, y: startPos.y, x2: pos.x, y2: pos.y, color }])
    setStartPos(null)
  }

  function handleUndo() {
    setAnnotations((prev) => prev.slice(0, -1))
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    draw() // Ensure final render
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
    onSave(dataUrl)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <div className="w-full sm:max-w-[650px] max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-base font-bold text-zinc-900">Annotate Photo</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100">
            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 overflow-x-auto">
          <button
            onClick={() => setTool("circle")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${tool === "circle" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
            </svg>
            Circle
          </button>
          <button
            onClick={() => setTool("arrow")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${tool === "arrow" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20L20 4M20 4h-6M20 4v6" />
            </svg>
            Arrow
          </button>
          <button
            onClick={() => setTool("text")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${tool === "text" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Text
          </button>
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          {["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#ffffff"].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full border-2 flex-shrink-0 ${color === c ? "border-indigo-600 ring-2 ring-indigo-200" : "border-zinc-300"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="rounded-lg px-3 py-2 text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30"
          >
            Undo
          </button>
        </div>

        {/* Canvas */}
        <div className="px-4 py-4 flex justify-center bg-zinc-900">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="rounded-lg cursor-crosshair touch-none max-w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 py-4 border-t border-zinc-100">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-indigo-600 min-h-[48px] text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save Annotated Photo
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-4 min-h-[48px] text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
