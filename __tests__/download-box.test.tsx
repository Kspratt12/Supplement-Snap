import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { DownloadBox } from "../app/blog/[slug]/download-box"
import { TEMPLATES, getTemplate } from "../lib/templates"

describe("DownloadBox", () => {
  const plausible = vi.fn()
  beforeEach(() => {
    plausible.mockClear()
    window.plausible = plausible
  })
  afterEach(() => cleanup())

  it("shows one download link per file, pointing at the file, with the download attribute", () => {
    const t = getTemplate("roofing-estimate-template")!
    render(<DownloadBox template={t} />)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(t.files.length)
    for (const f of t.files) {
      const a = screen.getByRole("link", { name: new RegExp(`Download ${f.format}`) })
      expect(a.getAttribute("href")).toBe(f.href)
      expect(a.hasAttribute("download")).toBe(true)
    }
    expect(screen.getByText(/No email or sign-up needed/)).toBeTruthy()
    expect(screen.getByText(/not legal advice/i)).toBeTruthy()
  })

  it("only shows the templates page link when asked", () => {
    const t = TEMPLATES[0]
    const { rerender } = render(<DownloadBox template={t} />)
    expect(screen.queryByText(/See all free roofing templates/)).toBeNull()
    rerender(<DownloadBox template={t} showHubLink />)
    const hub = screen.getByText(/See all free roofing templates/)
    expect(hub.closest("a")!.getAttribute("href")).toBe("/free-roofing-templates")
  })

  it("reports the click to analytics with the file and format, and still lets the download happen", () => {
    const t = getTemplate("roofing-supplement-template")!
    render(<DownloadBox template={t} />)
    const pdf = screen.getByRole("link", { name: /Download PDF/ })
    const notPrevented = fireEvent.click(pdf)
    expect(notPrevented).toBe(true) // default action (the download) was not cancelled
    expect(plausible).toHaveBeenCalledTimes(1)
    expect(plausible).toHaveBeenCalledWith("cta_click", { props: { location: "template-download-roofing-supplement-template-pdf", target: "/downloads/roofing-supplement-template.pdf" } })
  })

  it("does not break when analytics is not loaded", () => {
    delete window.plausible
    const t = TEMPLATES[0]
    render(<DownloadBox template={t} />)
    expect(() => fireEvent.click(screen.getByRole("link", { name: /Download PDF/ }))).not.toThrow()
  })

  it("shows a fillable PDF button with a reader tip, and tracks it with a clean label", () => {
    const t = getTemplate("roof-repair-estimate-template")!
    render(<DownloadBox template={t} />)
    const a = screen.getByRole("link", { name: /Download Fillable PDF/ })
    expect(a.getAttribute("href")).toBe("/downloads/roof-repair-estimate-template-fillable.pdf")
    expect(screen.getByText(/Adobe Acrobat Reader/)).toBeTruthy()
    fireEvent.click(a)
    expect(plausible).toHaveBeenCalledWith("cta_click", { props: { location: "template-download-roof-repair-estimate-template-fillable-pdf", target: "/downloads/roof-repair-estimate-template-fillable.pdf" } })
  })

  it("renders every registered template", () => {
    for (const t of TEMPLATES) {
      const { unmount } = render(<DownloadBox template={t} />)
      expect(screen.getByText(t.title)).toBeTruthy()
      unmount()
    }
  })
})
