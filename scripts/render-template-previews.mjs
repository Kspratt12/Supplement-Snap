// Makes the first-page preview picture of each downloadable template, from the real PDF files in public/downloads.
// Run again after a template PDF changes:
//   node scripts/render-template-previews.mjs
// Output: public/templates/previews/<template id>-preview.jpg  (900 px wide)
//
// It draws each PDF in Chrome, because Chrome uses the computer's real fonts. Drawing the same PDFs in plain Node
// substitutes fonts and mis-spaces letters (for example "ROOFI NG"). Needs Google Chrome and the playwright-core package;
// if playwright-core is not installed, point PLAYWRIGHT_CORE_PATH at its index.mjs.
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const { chromium } = await import(process.env.PLAYWRIGHT_CORE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_CORE_PATH).href : "playwright-core")
const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"

const WIDTH = 900
const downloads = path.join(root, "public/downloads")
const outDir = path.join(root, "public/templates/previews")
fs.mkdirSync(outDir, { recursive: true })

// A small local server so the browser can load the PDF library and the PDF files
const types = { ".mjs": "text/javascript", ".js": "text/javascript", ".pdf": "application/pdf", ".html": "text/html" }
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (url === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end("<html><body></body></html>") }
  const file = path.join(root, url)
  if ( !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" })
  fs.createReadStream(file).pipe(res)
}).listen(0)
const port = server.address().port

const browser = await chromium.launch({ executablePath: chrome })
const page = await browser.newPage()
await page.goto(`http://localhost:${port}/`) // a same-origin page, so the PDF library can load
await page.evaluate(async (port) => {
  const lib = await import(`http://localhost:${port}/node_modules/pdfjs-dist/build/pdf.mjs`)
  lib.GlobalWorkerOptions.workerSrc = `http://localhost:${port}/node_modules/pdfjs-dist/build/pdf.worker.mjs`
  window.__render = async (url, width) => {
    const doc = await lib.getDocument({ url }).promise
    const p = await doc.getPage(1)
    const vp = p.getViewport({ scale: width / p.getViewport({ scale: 1 }).width })
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height)
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    await p.render({ canvasContext: ctx, viewport: vp }).promise
    return { data: canvas.toDataURL("image/jpeg", 0.85), w: canvas.width, h: canvas.height }
  }
}, port)

const pdfs = fs.readdirSync(downloads).filter((f) => f.endsWith(".pdf") && !f.endsWith("-fillable.pdf")).sort()
for (const file of pdfs) {
  const id = file.replace(/\.pdf$/, "")
  const out = await page.evaluate(([u, w]) => window.__render(u, w), [`/public/downloads/${file}`, WIDTH])
  const bytes = Buffer.from(out.data.split(",")[1], "base64")
  fs.writeFileSync(path.join(outDir, `${id}-preview.jpg`), bytes)
  console.log(`${id}-preview.jpg`.padEnd(64), `${out.w}x${out.h}`, `${Math.round(bytes.length / 1024)} KB`)
}
await browser.close()
server.close()
