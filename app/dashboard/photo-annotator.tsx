"use client"

import { useState, useRef, useEffect, useCallback } from "react"

type Tool = "circle" | "arrow" | "text"
export type Annotation = {
  tool: Tool
  x: number
  y: number
  x2?: number
  y2?: number
  text?: string
  color: string
}

type PhotoAnnotatorProps = {
  imageUrl: string
  open: boolean
  onClose: () => void
  /** Receives the marked-up image. The original photo is never changed; this is a separate copy. */
  onSave: (dataUrl: string) => void
  /** Label for the main button, for example "Add to finding" */
  saveLabel?: string
}

/** Longest side of the marked-up copy. Big enough to read detail, small enough to upload from a phone. */
const MAX_SIDE = 2000

/** Draws the photo and every mark onto the canvas. Sizes scale with the canvas so marks look the same at any resolution. */
export function drawAnnotations(ctx: CanvasRenderingContext2D, img: CanvasImageSource, width: number, height: number, list: Annotation[]) {
  const s = Math.max(1, width / 600)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  for (const a of list) {
    ctx.strokeStyle = a.color
    ctx.fillStyle = a.color
    ctx.lineWidth = 3 * s
    if (a.tool === "circle") {
      const rx = Math.abs((a.x2 ?? a.x) - a.x) / 2
      const ry = Math.abs((a.y2 ?? a.y) - a.y) / 2
      const cx = (a.x + (a.x2 ?? a.x)) / 2
      const cy = (a.y + (a.y2 ?? a.y)) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.max(rx, 8 * s), Math.max(ry, 8 * s), 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (a.tool === "arrow") {
      const x2 = a.x2 ?? a.x
      const y2 = a.y2 ?? a.y
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      const angle = Math.atan2(y2 - a.y, x2 - a.x)
      const headLen = 15 * s
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    } else if (a.tool === "text" && a.text) {
      const size = 16 * s
      ctx.font = `bold ${size}px sans-serif`
      const metrics = ctx.measureText(a.text)
      ctx.fillStyle = "rgba(0,0,0,0.6)"
      ctx.fillRect(a.x - 2 * s, a.y - size, metrics.width + 8 * s, size * 1.4)
      ctx.fillStyle = "#ffffff"
      ctx.fillText(a.text, a.x + 2 * s, a.y)
    }
  }
}

type PointerLike = { clientX: number; clientY: number }

/**
 * Where the pointer is, in the canvas's own pixels. A touch that has just ended is no longer in `touches`, only in
 * `changedTouches`; reading `touches[0]` there threw on phones and the mark was never added.
 */
export function canvasPoint(
  e: { touches?: ArrayLike<PointerLike>; changedTouches?: ArrayLike<PointerLike>; clientX?: number; clientY?: number },
  rect: { left: number; top: number; width: number; height: number },
  canvasSize: { width: number; height: number },
): { x: number; y: number } {
  const p: PointerLike | undefined =
    (e.touches && e.touches.length > 0 ? e.touches[0] : undefined) ??
    (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : undefined) ??
    (typeof e.clientX === "number" && typeof e.clientY === "number" ? { clientX: e.clientX, clientY: e.clientY } : undefined)
  if (!p || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
  return {
    x: ((p.clientX - rect.left) * canvasSize.width) / rect.width,
    y: ((p.clientY - rect.top) * canvasSize.height) / rect.height,
  }
}

// Closed means removed, and a different photo starts fresh, so there is nothing to reset by hand
export function PhotoAnnotator(props: PhotoAnnotatorProps) {
  if (!props.open) return null
  return <PhotoAnnotatorInner key={props.imageUrl} {...props} />
}

function PhotoAnnotatorInner({ imageUrl, onClose, onSave, saveLabel = "Save Annotated Photo" }: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>("circle")
  const [color, setColor] = useState("#ef4444")
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const render = useCallback((list: Annotation[]) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !img || !ctx) return
    drawAnnotations(ctx, img, canvas.width, canvas.height, list)
  }, [])

  useEffect(() => {
    if (imageLoaded) render(annotations)
  }, [annotations, imageLoaded, render])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      // The photo's own resolution (capped), so the marked-up copy is as sharp as the original. CSS fits it to the screen.
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height))
      canvas.width = Math.round((img.naturalWidth || img.width) * scale)
      canvas.height = Math.round((img.naturalHeight || img.height) * scale)
      setImageLoaded(true)
    }
    img.onerror = () => setLoadFailed(true)
    img.src = imageUrl
  }, [imageUrl])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    return canvasPoint(e as unknown as Parameters<typeof canvasPoint>[0], canvas.getBoundingClientRect(), canvas)
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (!imageLoaded) return
    const pos = getPos(e)
    if (tool === "text") {
      const text = prompt("Enter annotation text:")
      if (text) setAnnotations((prev) => [...prev, { tool: "text", x: pos.x, y: pos.y, text, color }])
      return
    }
    setStartPos(pos)
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!startPos) return
    const pos = getPos(e)
    render([...annotations, { tool, x: startPos.x, y: startPos.y, x2: pos.x, y2: pos.y, color }])
  }

  function handleEnd(e: React.MouseEvent | React.TouchEvent) {
    if (!startPos) return
    const pos = getPos(e)
    setAnnotations((prev) => [...prev, { tool, x: startPos.x, y: startPos.y, x2: pos.x, y2: pos.y, color }])
    setStartPos(null)
  }

  function exportImage(): string | null {
    const canvas = canvasRef.current
    if (!canvas || !imageLoaded) return null
    render(annotations)
    try {
      return canvas.toDataURL("image/jpeg", 0.9)
    } catch {
      return null // the browser refused to export this image
    }
  }

  function handleSave() {
    const dataUrl = exportImage()
    if (!dataUrl) return
    onSave(dataUrl)
    onClose()
  }

  function handleDownload() {
    const dataUrl = exportImage()
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "marked-up-photo.jpg"
    a.click()
  }

  const toolBtn = (t: Tool, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setTool(t)}
      aria-pressed={tool === t}
      className={`flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium ${tool === t ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"}`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 sm:items-center sm:px-4">
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-[650px] sm:rounded-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-zinc-100 bg-white px-4 py-3 sm:rounded-t-xl">
          <h2 className="text-base font-bold text-zinc-900">Mark Up Photo</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-zinc-100">
            <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-100 px-4 py-3">
          {toolBtn("circle", "Circle", <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>)}
          {toolBtn("arrow", "Arrow", <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 20L20 4M20 4h-6M20 4v6" /></svg>)}
          {toolBtn("text", "Text", <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" /></svg>)}
          <div className="mx-1 h-5 w-px bg-zinc-200" />
          {["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#ffffff"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`h-9 w-9 flex-shrink-0 rounded-full border-2 ${color === c ? "border-indigo-600 ring-2 ring-indigo-200" : "border-zinc-300"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="mx-1 h-5 w-px bg-zinc-200" />
          <button
            type="button"
            onClick={() => setAnnotations((prev) => prev.slice(0, -1))}
            disabled={annotations.length === 0}
            className="min-h-[44px] rounded-lg bg-zinc-100 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-200 disabled:opacity-30"
          >
            Undo
          </button>
        </div>

        <div className="flex justify-center bg-zinc-900 px-4 py-4">
          {loadFailed ? (
            <p className="py-10 text-sm text-white">The photo could not be loaded for mark-up. Close this and try again.</p>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              data-testid="annotator-canvas"
              className="max-h-[60vh] max-w-full cursor-crosshair touch-none rounded-lg"
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
          )}
        </div>
        <p className="px-4 pt-3 text-xs text-zinc-500">The original photo is kept as it is. Your marks are saved as a separate copy.</p>

        <div className="flex flex-wrap gap-3 px-4 py-4">
          <button type="button" onClick={handleSave} disabled={!imageLoaded} className="min-h-[48px] flex-1 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
            {saveLabel}
          </button>
          <button type="button" onClick={handleDownload} disabled={!imageLoaded} className="min-h-[48px] rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
            Download
          </button>
          <button type="button" onClick={onClose} className="min-h-[48px] rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
