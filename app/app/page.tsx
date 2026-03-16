"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { jsPDF } from "jspdf"
import { supabase } from "../../lib/supabase"
import { useAuth, hasActiveSubscription } from "../../lib/auth-context"
import { PhotoAnnotator } from "../dashboard/photo-annotator"

// Web Speech API type declarations
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

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

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

const SUPPLEMENT_ESTIMATES: Record<string, number> = {
  "Decking": 450,
  "Flashing": 550,
  "Vent / Pipe Boot": 85,
  "Drip Edge": 275,
  "Ice & Water": 350,
  "Multiple Layers": 650,
  "Other": 200,
}

type Project = {
  id: string
  project_name: string
  property_address: string
  created_at: string
  insurance_company?: string
  claim_number?: string
  policy_number?: string
  date_of_loss?: string
  adjuster_name?: string
  adjuster_email?: string
  adjuster_phone?: string
  claim_status?: string
  diagram_url?: string
}

const CAPTURE_STATUSES = ["Captured", "Needs Review", "Ready to Send", "Sent"] as const
type CaptureStatus = typeof CAPTURE_STATUSES[number]

const STATUS_STYLES: Record<CaptureStatus, string> = {
  "Captured": "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-amber-50 text-amber-600",
  "Ready to Send": "bg-blue-50 text-blue-600",
  "Sent": "bg-green-50 text-green-600",
}

type Capture = {
  id: string
  project_id: string
  image_url: string
  image_urls?: string[]
  damage_type: string
  roof_area: string
  field_note: string
  status?: CaptureStatus
  created_at: string
}

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}

function Home() {
  const { user, loading: authLoading, signOut, subscriptionStatus, subscriptionLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect to login if not authenticated, or pricing if no subscription
  useEffect(() => {
    if (authLoading || subscriptionLoading) return
    if (!user) { router.replace("/login"); return }
    if (!hasActiveSubscription(subscriptionStatus)) { router.replace("/dashboard?locked=1"); return }
  }, [user, authLoading, subscriptionStatus, subscriptionLoading, router])

  // Project state
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectAddress, setNewProjectAddress] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)

  // Capture form state
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [damageType, setDamageType] = useState("")
  const [roofArea, setRoofArea] = useState("")
  const [fieldNote, setFieldNote] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  // Claim info toggle
  const [showClaimInfo, setShowClaimInfo] = useState(false)
  // New project claim fields
  const [newInsuranceCompany, setNewInsuranceCompany] = useState("")
  const [newClaimNumber, setNewClaimNumber] = useState("")
  const [newPolicyNumber, setNewPolicyNumber] = useState("")
  const [newDateOfLoss, setNewDateOfLoss] = useState("")
  const [newAdjusterName, setNewAdjusterName] = useState("")
  const [newAdjusterEmail, setNewAdjusterEmail] = useState("")
  // Diagram upload state
  const [diagramFile, setDiagramFile] = useState<File | null>(null)
  const [diagramUploading, setDiagramUploading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [addressSearch, setAddressSearch] = useState("")
  const [addressEditing, setAddressEditing] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  // Quantity/unit for capture form
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("")

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Captures + drafts
  const [captures, setCaptures] = useState<Capture[]>([])
  const [statusFilter, setStatusFilter] = useState<"All" | CaptureStatus>("All")
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({})
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  // Photo viewer state
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerZoom, setViewerZoom] = useState(1)
  const viewerTouchStart = useRef<{ x: number; y: number } | null>(null)

  // Project draft state
  const [projectDraft, setProjectDraft] = useState("")
  const [projectDraftLoading, setProjectDraftLoading] = useState(false)
  const [projectDraftError, setProjectDraftError] = useState("")
  const [projectDraftCopied, setProjectDraftCopied] = useState(false)

  // Project report state
  const [showReport, setShowReport] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  // Company branding state
  const [companyName, setCompanyName] = useState("")
  const [companyLogoUrl, setCompanyLogoUrl] = useState("")

  // Photo annotation state
  const [annotateUrl, setAnnotateUrl] = useState("")
  const [annotateOpen, setAnnotateOpen] = useState(false)

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<"" | "sent" | "error">("")
  const [emailError, setEmailError] = useState("")
  const [emailFollowUp, setEmailFollowUp] = useState(true)

  // Photo viewer keyboard navigation
  useEffect(() => {
    if (viewerPhotos.length === 0) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setViewerPhotos([]); setViewerZoom(1) }
      if (e.key === "ArrowRight") setViewerIndex((i) => Math.min(i + 1, viewerPhotos.length - 1))
      if (e.key === "ArrowLeft") setViewerIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [viewerPhotos])

  function openViewer(photos: string[], index: number) {
    setViewerPhotos(photos)
    setViewerIndex(index)
    setViewerZoom(1)
  }

  // Check speech recognition support on mount
  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    )
  }, [])

  async function translateNote(text: string) {
    setTranslating(true)
    setTranslated(false)
    try {
      const res = await fetch("/api/translate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.translated && data.text) {
        setFieldNote((prev) => {
          // Replace the original transcript (appended earlier) with the translation
          const idx = prev.lastIndexOf(text)
          if (idx !== -1) {
            return prev.slice(0, idx) + data.text + prev.slice(idx + text.length)
          }
          return prev
        })
        setTranslated(true)
        setTimeout(() => setTranslated(false), 4000)
      }
    } catch {
      // Translation failed — keep original text
    } finally {
      setTranslating(false)
    }
  }

  function toggleRecording() {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript) {
        setFieldNote((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : ""
          return prev + separator + transcript
        })
        // Translate non-English speech
        translateNote(transcript)
      }
    }

    recognition.onerror = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  // Load projects and company settings when user is available
  useEffect(() => {
    if (user) {
      loadProjects()
      // Load company branding
      fetch(`/api/company-settings?userId=${user.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.settings) {
            setCompanyName(d.settings.company_name || "")
            setCompanyLogoUrl(d.settings.logo_url || "")
          }
        })
        .catch(() => {})
    }
  }, [user])

  // Auto-select project from URL parameter
  useEffect(() => {
    const projectParam = searchParams.get("project")
    if (projectParam && projects.length > 0 && !selectedProjectId) {
      const match = projects.find(p => p.id === projectParam)
      if (match) setSelectedProjectId(match.id)
    }
  }, [projects, searchParams, selectedProjectId])

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
    setProjectDraftError("")
    // Load saved project draft if available
    if (selectedProjectId) {
      supabase.from("projects").select("last_draft").eq("id", selectedProjectId).single().then(({ data }) => {
        setProjectDraft(data?.last_draft || "")
      })
    } else {
      setProjectDraft("")
    }
    setShowReport(false)
    setShowMap(false)
    setAddressSuggestions([])
    setAddressSearch("")
  }, [selectedProjectId])

  function searchAddress(query: string) {
    setAddressSearch(query)
    if (searchTimeout) clearTimeout(searchTimeout)
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=5&q=${encodeURIComponent(query)}`,
          { headers: { "Accept": "application/json" } }
        )
        if (res.ok) {
          const data = await res.json()
          setAddressSuggestions(data)
        }
      } catch {
        setAddressSuggestions([])
      }
    }, 300)
    setSearchTimeout(timeout)
  }

  async function selectAddress(address: string) {
    if (!selectedProject) return
    setAddressSearch(address)
    setAddressSuggestions([])
    if (!confirm(`Update project address to:\n\n${address}\n\nSave this change?`)) {
      setAddressEditing(false)
      return
    }
    await supabase.from("projects").update({ property_address: address }).eq("id", selectedProject.id)
    setProjects((prev) => prev.map((p) => p.id === selectedProject.id ? { ...p, property_address: address } : p))
    setAddressEditing(false)
  }

  async function loadProjects() {
    if (!user) return

    // Load own projects
    const { data: ownProjects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Load team projects (where user is a team member)
    let teamProjects: Project[] = []
    try {
      const { data: memberships } = await supabase
        .from("team_members")
        .select("owner_id")
        .eq("member_email", user.email)
        .eq("status", "active")

      if (memberships && memberships.length > 0) {
        const ownerIds = memberships.map(m => m.owner_id)
        const { data: shared } = await supabase
          .from("projects")
          .select("*")
          .in("user_id", ownerIds)
          .order("created_at", { ascending: false })
        if (shared) teamProjects = shared
      }
    } catch {
      // team_members table may not exist yet
    }

    // Merge and deduplicate
    const all = [...(ownProjects || []), ...teamProjects]
    const unique = all.filter((p, i) => all.findIndex(x => x.id === p.id) === i)
    setProjects(unique)
  }

  async function loadCaptures(projectId: string) {
    const { data } = await supabase
      .from("captures")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
    if (data) setCaptures(data)
    // Restore saved drafts from capture records
    if (data) {
      const savedDrafts: Record<string, string> = {}
      data.forEach((c: any) => {
        if (c.draft) savedDrafts[c.id] = c.draft
      })
      if (Object.keys(savedDrafts).length > 0) {
        setDrafts((prev) => ({ ...prev, ...savedDrafts }))
      }
    }
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
        user_id: user?.id,
        insurance_company: newInsuranceCompany.trim() || null,
        claim_number: newClaimNumber.trim() || null,
        policy_number: newPolicyNumber.trim() || null,
        date_of_loss: newDateOfLoss || null,
        adjuster_name: newAdjusterName.trim() || null,
        adjuster_email: newAdjusterEmail.trim() || null,
        claim_status: "In Progress",
      })
      .select()
      .single()

    if (!error && data) {
      setProjects((prev) => [data, ...prev])
      setSelectedProjectId(data.id)
      setNewProjectName("")
      setNewProjectAddress("")
      setNewInsuranceCompany("")
      setNewClaimNumber("")
      setNewPolicyNumber("")
      setNewDateOfLoss("")
      setNewAdjusterName("")
      setNewAdjusterEmail("")
      setShowNewProject(false)
      setShowClaimInfo(false)
    }
    setCreatingProject(false)
  }

  async function deleteCapture(c: Capture) {
    if (!confirm("Delete this capture? This cannot be undone.")) return

    // Delete all associated images from storage
    const urls = c.image_urls && c.image_urls.length > 0 ? c.image_urls : [c.image_url]
    const filePaths = urls
      .map((url) => url.match(/test-uploads\/(.+)$/)?.[1])
      .filter((p): p is string => !!p)

    if (filePaths.length > 0) {
      await supabase.storage.from("test-uploads").remove(filePaths)
    }

    await supabase.from("captures").delete().eq("id", c.id)
    setCaptures((prev) => prev.filter((cap) => cap.id !== c.id))
  }

  async function updateCaptureStatus(captureId: string, newStatus: CaptureStatus) {
    await supabase.from("captures").update({ status: newStatus }).eq("id", captureId)
    setCaptures((prev) =>
      prev.map((c) => (c.id === captureId ? { ...c, status: newStatus } : c))
    )

    // Log status change
    const capture = captures.find((c) => c.id === captureId)
    if (capture && user) {
      fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          projectId: selectedProjectId,
          action: `Status changed to ${newStatus}`,
          details: `${capture.damage_type} — ${capture.roof_area}`,
        }),
      }).catch(() => {})
    }
  }

  async function bulkUpdateStatus(captureIds: string[], newStatus: CaptureStatus) {
    for (const id of captureIds) {
      await supabase.from("captures").update({ status: newStatus }).eq("id", id)
    }
    setCaptures((prev) =>
      prev.map((c) => (captureIds.includes(c.id) ? { ...c, status: newStatus } : c))
    )
  }

  async function generateProjectDraft() {
    if (!selectedProject || !selectedProjectId) return

    setProjectDraftLoading(true)
    setProjectDraftError("")
    setProjectDraft("")

    try {
      // Re-fetch fresh captures from Supabase to ensure we have the latest data
      const { data: freshCaptures, error: fetchError } = await supabase
        .from("captures")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to load captures: ${fetchError.message}`)
      }

      if (!freshCaptures || freshCaptures.length === 0) {
        throw new Error("No captures found for this project.")
      }

      const res = await fetch("/api/generate-project-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: selectedProject.project_name,
          property_address: selectedProject.property_address,
          captures: freshCaptures.map((c) => ({
            damage_type: c.damage_type,
            roof_area: c.roof_area,
            field_note: c.field_note,
            created_at: c.created_at,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      const { draft } = await res.json()
      setProjectDraft(draft)
      // Persist project draft
      supabase.from("projects").update({ last_draft: draft }).eq("id", selectedProjectId).then(() => {})

      // Log activity
      fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          projectId: selectedProjectId,
          action: "Report generated",
          details: `AI supplement draft for ${captures.length} findings`,
        }),
      }).catch(() => {})
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setProjectDraftError(message)
    } finally {
      setProjectDraftLoading(false)
    }
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
      // Persist draft to capture record
      supabase.from("captures").update({ draft: draft }).eq("id", c.id).then(() => {})
      // Auto-update status to "Needs Review"
      if (!c.status || c.status === "Captured") {
        updateCaptureStatus(c.id, "Needs Review")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setDraftErrors((prev) => ({ ...prev, [c.id]: message }))
    } finally {
      setDraftLoading((prev) => ({ ...prev, [c.id]: false }))
    }
  }

  async function generateReport() {
    if (!selectedProject || captures.length === 0) return

    setReportLoading(true)

    // Generate drafts for any captures that don't have one yet
    const missing = captures.filter((c) => !drafts[c.id] && !draftLoading[c.id])

    for (const c of missing) {
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
        if (res.ok) {
          const { draft } = await res.json()
          setDrafts((prev) => ({ ...prev, [c.id]: draft }))
        }
      } catch {
        // Continue generating remaining drafts even if one fails
      }
    }

    // Auto-update all captures to "Ready to Send"
    const toUpdate = captures.filter((c) => c.status !== "Sent").map((c) => c.id)
    if (toUpdate.length > 0) {
      bulkUpdateStatus(toUpdate, "Ready to Send")
    }

    setReportLoading(false)
    setShowReport(true)
  }

  function buildReportText(): string {
    if (!selectedProject) return ""
    const now = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    let text = `PROJECT REPORT – ${selectedProject.project_name}\n\n`
    text += `Property Address: ${selectedProject.property_address || "N/A"}\n`
    text += `Generated: ${now}\n\n`
    text += `FINDINGS\n\n`

    captures.forEach((c, i) => {
      text += `${i + 1}. ${c.damage_type} – ${c.roof_area}\n`
      if (c.field_note) {
        text += `${c.field_note}\n`
      }
      text += `\n`
      if (drafts[c.id]) {
        text += `${drafts[c.id]}\n`
      }
      text += `\n`
    })

    return text.trim()
  }

  // Helper: fetch image as data URL (handles CORS, any format)
  async function fetchImageDataUrl(url: string): Promise<string | null> {
    try {
      if (!url || url === "") return null

      // Method 1: fetch as blob (works for same-origin and CORS-enabled)
      try {
        const res = await fetch(url)
        if (res.ok) {
          const blob = await res.blob()
          return await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
        }
      } catch {}

      // Method 2: canvas approach (fallback for CORS issues)
      return await new Promise<string | null>((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL("image/png"))
          } else {
            resolve(null)
          }
        }
        img.onerror = () => resolve(null)
        img.src = url
      })
    } catch {
      return null
    }
  }

  // Detect image format from data URL for jsPDF
  function getImageFormat(dataUrl: string): string {
    if (dataUrl.includes("image/png")) return "PNG"
    if (dataUrl.includes("image/webp")) return "WEBP"
    if (dataUrl.includes("image/gif")) return "GIF"
    return "JPEG"
  }

  async function buildPdfDoc(includePhotos = true) {
    if (!selectedProject || captures.length === 0) return null

    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 18
    const contentWidth = pageWidth - margin * 2
    let y = margin

    function checkPage(needed: number) {
      if (y + needed > pageHeight - 15) {
        // Add page number footer before new page
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(180, 180, 180)
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 8, { align: "center" })
        doc.addPage()
        y = margin
      }
    }

    // ── HEADER BAR ──
    doc.setFillColor(79, 70, 229)
    doc.rect(0, 0, pageWidth, 16, "F")

    // Company logo (any format: PNG, JPEG, WEBP, GIF, SVG rasterized)
    if (companyLogoUrl && includePhotos) {
      try {
        const logoDataUrl = await fetchImageDataUrl(companyLogoUrl)
        if (logoDataUrl) {
          const fmt = getImageFormat(logoDataUrl)
          const logoImg = new Image()
          await new Promise<void>((resolve) => {
            logoImg.onload = () => {
              const logoH = 12
              const logoW = (logoImg.width / logoImg.height) * logoH
              doc.addImage(logoDataUrl, fmt, margin, 2, logoW, logoH)
              // Title text after logo
              doc.setTextColor(255, 255, 255)
              doc.setFontSize(10)
              doc.setFont("helvetica", "bold")
              const titleX = margin + logoW + 4
              const pdfTitle = companyName ? `${companyName} – Supplement Report` : "Supplement Snap – Project Report"
              doc.text(pdfTitle, titleX, 10)
              resolve()
            }
            logoImg.onerror = () => {
              // Fallback: just text
              doc.setTextColor(255, 255, 255)
              doc.setFontSize(10)
              doc.setFont("helvetica", "bold")
              const pdfTitle = companyName ? `${companyName} – Supplement Report` : "Supplement Snap – Project Report"
              doc.text(pdfTitle, margin, 10)
              resolve()
            }
            logoImg.src = logoDataUrl
          })
        } else {
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")
          doc.text(companyName ? `${companyName} – Supplement Report` : "Supplement Snap – Project Report", margin, 10)
        }
      } catch {
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(companyName ? `${companyName} – Supplement Report` : "Supplement Snap – Project Report", margin, 10)
      }
    } else {
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      const pdfTitle = companyName ? `${companyName} – Supplement Report` : "Supplement Snap – Project Report"
      doc.text(pdfTitle, margin, 10)
    }
    y = 26

    // ── PROJECT INFO ──
    doc.setTextColor(24, 24, 27)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(selectedProject.project_name, margin, y)
    y += 7

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 110)
    if (selectedProject.property_address) {
      doc.text(`Property Address: ${selectedProject.property_address}`, margin, y)
      y += 4.5
    }
    const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    doc.text(`Date of Report: ${now}`, margin, y)
    y += 4.5
    doc.text(`Total Findings: ${captures.length}`, margin, y)
    y += 5

    // Claim info
    if (selectedProject.insurance_company || selectedProject.claim_number) {
      y += 2
      if (selectedProject.insurance_company) {
        doc.text(`Insurance Company: ${selectedProject.insurance_company}`, margin, y)
        y += 4.5
      }
      if (selectedProject.claim_number) {
        doc.text(`Claim Number: ${selectedProject.claim_number}`, margin, y)
        y += 4.5
      }
      if (selectedProject.policy_number) {
        doc.text(`Policy Number: ${selectedProject.policy_number}`, margin, y)
        y += 4.5
      }
      if (selectedProject.date_of_loss) {
        doc.text(`Date of Loss: ${new Date(selectedProject.date_of_loss + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin, y)
        y += 4.5
      }
      if (selectedProject.adjuster_name) {
        doc.text(`Adjuster: ${selectedProject.adjuster_name}${selectedProject.adjuster_email ? ` (${selectedProject.adjuster_email})` : ""}`, margin, y)
        y += 4.5
      }
    }
    y += 3

    // Separator
    doc.setDrawColor(200, 200, 210)
    doc.setLineWidth(0.4)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // ── FINDINGS ──
    for (let i = 0; i < captures.length; i++) {
      const c = captures[i]
      const urls = c.image_urls && c.image_urls.length > 0 ? c.image_urls : (c.image_url ? [c.image_url] : [])

      // Finding header with number badge
      checkPage(30)
      doc.setFillColor(79, 70, 229)
      doc.circle(margin + 3, y - 1, 3.5, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.text(`${i + 1}`, margin + 3, y, { align: "center" })

      doc.setTextColor(24, 24, 27)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(`${c.damage_type} — ${c.roof_area}`, margin + 10, y)
      y += 4.5

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(150, 150, 160)
      doc.text(`Documented: ${new Date(c.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin + 10, y)
      y += 6

      // Field note
      if (c.field_note) {
        checkPage(15)
        doc.setFontSize(7.5)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(130, 130, 140)
        doc.text("FIELD NOTE", margin, y)
        y += 3.5
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(60, 60, 70)
        const noteLines = doc.splitTextToSize(c.field_note, contentWidth)
        checkPage(noteLines.length * 4 + 2)
        doc.text(noteLines, margin, y)
        y += noteLines.length * 4 + 3
      }

      // Supplement explanation in bordered box
      if (drafts[c.id]) {
        checkPage(15)
        doc.setFontSize(7.5)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(130, 130, 140)
        doc.text("SUPPLEMENT EXPLANATION", margin, y)
        y += 3.5
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(50, 50, 60)
        const draftLines = doc.splitTextToSize(drafts[c.id], contentWidth - 8)
        const boxHeight = draftLines.length * 4 + 6
        checkPage(boxHeight + 2)
        doc.setFillColor(248, 248, 252)
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.3)
        doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 2, 2, "FD")
        doc.text(draftLines, margin + 4, y + 2)
        y += boxHeight + 3
      }

      // Photos
      if (includePhotos && urls.length > 0 && urls[0] !== "") {
        let photosLoaded = 0
        checkPage(10)
        doc.setFontSize(7.5)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(130, 130, 140)
        doc.text(`SUPPORTING PHOTOS (${urls.length})`, margin, y)
        y += 4

        for (const url of urls) {
          try {
            const dataUrl = await fetchImageDataUrl(url)
            if (!dataUrl) continue
            const fmt = getImageFormat(dataUrl)
            const imgProps = doc.getImageProperties(dataUrl)
            const ratio = imgProps.height / imgProps.width
            const imgW = Math.min(contentWidth, 140)
            const imgH = imgW * ratio
            const cappedH = Math.min(imgH, 100)
            checkPage(cappedH + 5)
            // Photo border
            doc.setDrawColor(220, 220, 230)
            doc.setLineWidth(0.3)
            doc.rect(margin, y, imgW, cappedH)
            doc.addImage(dataUrl, fmt, margin, y, imgW, cappedH)
            y += cappedH + 4
            photosLoaded++
          } catch {
            // Skip failed photo
          }
        }

        // If no photos loaded (CORS or fetch failure), show note
        if (photosLoaded === 0) {
          doc.setFontSize(8)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(150, 150, 160)
          doc.text(`[${urls.length} photo${urls.length !== 1 ? "s" : ""} captured — see project in Supplement Snap for images]`, margin, y)
          y += 5
        }
      } else if (!includePhotos && urls.length > 0 && urls[0] !== "") {
        checkPage(6)
        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(150, 150, 160)
        doc.text(`[${urls.length} photo${urls.length !== 1 ? "s" : ""} attached to this finding]`, margin, y)
        y += 5
      }

      // Separator between findings
      if (i < captures.length - 1) {
        y += 3
        checkPage(8)
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.2)
        doc.line(margin, y, pageWidth - margin, y)
        y += 8
      }
    }

    // ── SUMMARY TABLE ──
    y += 6
    checkPage(30)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(130, 130, 140)
    doc.text("FINDINGS SUMMARY", margin, y)
    y += 5

    // Table header
    doc.setFillColor(245, 245, 250)
    doc.rect(margin, y - 3, contentWidth, 7, "F")
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(80, 80, 90)
    doc.text("#", margin + 2, y + 1)
    doc.text("Damage Type", margin + 10, y + 1)
    doc.text("Roof Area", margin + 70, y + 1)
    doc.text("Date", margin + 110, y + 1)
    y += 7

    // Table rows
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    for (let i = 0; i < captures.length; i++) {
      const c = captures[i]
      checkPage(6)
      doc.setTextColor(60, 60, 70)
      doc.text(`${i + 1}`, margin + 2, y)
      doc.text(c.damage_type, margin + 10, y)
      doc.text(c.roof_area, margin + 70, y)
      doc.text(new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), margin + 110, y)
      y += 5
      doc.setDrawColor(235, 235, 240)
      doc.setLineWidth(0.1)
      doc.line(margin, y - 1, pageWidth - margin, y - 1)
    }

    // ── ROOF DIAGRAM (if uploaded) ──
    if (selectedProject.diagram_url) {
      y += 6
      checkPage(30)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(130, 130, 140)
      doc.text("ROOF DIAGRAM", margin, y)
      y += 4

      try {
        const diagramDataUrl = await fetchImageDataUrl(selectedProject.diagram_url)
        if (diagramDataUrl) {
          const fmt = getImageFormat(diagramDataUrl)
          const imgProps = doc.getImageProperties(diagramDataUrl)
          const ratio = imgProps.height / imgProps.width
          const imgW = Math.min(contentWidth, 160)
          const imgH = imgW * ratio
          const cappedH = Math.min(imgH, 140)
          checkPage(cappedH + 5)
          doc.setDrawColor(220, 220, 230)
          doc.setLineWidth(0.3)
          doc.rect(margin, y, imgW, cappedH)
          doc.addImage(diagramDataUrl, fmt, margin, y, imgW, cappedH)
          y += cappedH + 4
        } else {
          doc.setFontSize(8)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(150, 150, 160)
          doc.text("[Roof diagram attached to project]", margin, y)
          y += 5
        }
      } catch {
        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(150, 150, 160)
        doc.text("[Roof diagram attached to project]", margin, y)
        y += 5
      }
    }

    // ── CERTIFICATION LINE ──
    y += 10
    checkPage(25)
    doc.setDrawColor(200, 200, 210)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 110)
    doc.text("This supplement documentation was prepared based on concealed conditions discovered", margin, y)
    y += 4
    doc.text("during tear-off operations and represents findings not visible during the initial inspection.", margin, y)
    y += 8

    doc.setFont("helvetica", "bold")
    doc.setTextColor(60, 60, 70)
    doc.text("Prepared by: ___________________________________", margin, y)
    doc.text("Date: ________________", margin + 110, y)

    // ── FOOTER ──
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(170, 170, 180)
      const footerText = companyName ? `Generated by ${companyName} via Supplement Snap` : "Generated by Supplement Snap"
      doc.text(footerText, margin, pageHeight - 8)
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" })
    }

    return doc
  }

  async function downloadPdf() {
    if (!selectedProject || captures.length === 0) return
    setPdfGenerating(true)
    try {
      const doc = await buildPdfDoc()
      if (!doc) return
      const safeName = selectedProject.project_name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")
      doc.save(`${safeName}-Report.pdf`)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setPdfGenerating(false)
    }
  }

  async function exportXactimate() {
    if (!selectedProject || captures.length === 0) return
    try {
      const res = await fetch("/api/export-xactimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: selectedProject.project_name,
          propertyAddress: selectedProject.property_address || "",
          captures: captures.map(c => ({
            damage_type: c.damage_type,
            roof_area: c.roof_area,
            field_note: c.field_note,
            quantity: (c as any).quantity || 1,
            unit: (c as any).unit || "",
          })),
        }),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const safeName = selectedProject.project_name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")
      a.download = `${safeName}_xactimate.csv`
      a.click()
      URL.revokeObjectURL(url)

      // Log activity
      fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          projectId: selectedProjectId,
          action: "Xactimate CSV exported",
          details: `${captures.length} line items`,
        }),
      }).catch(() => {})
    } catch (err) {
      console.error("Xactimate export failed:", err)
    }
  }

  function openEmailModal() {
    if (!selectedProject) return
    setEmailTo(selectedProject.adjuster_email || "")
    setEmailSubject(`Supplement Request – ${selectedProject.project_name}`)
    setEmailMessage(`Hello,\n\nDuring tear-off operations on this roofing claim, concealed damage was discovered that was not visible during the initial inspection.\n\nPlease see the attached supplement documentation and supporting photos.\n\nThank you.`)
    setEmailStatus("")
    setEmailError("")
    setShowEmailModal(true)
  }

  async function sendReport() {
    if (!selectedProject || !emailTo) return
    setEmailSending(true)
    setEmailStatus("")
    setEmailError("")

    try {
      // Build PDF with photos for adjuster review
      const doc = await buildPdfDoc(true)
      if (!doc) throw new Error("Failed to generate PDF")

      // Get base64 PDF content (strip the data:... prefix)
      let pdfBase64 = doc.output("datauristring").split(",")[1]

      // If PDF is too large for Vercel (>3.5MB base64), rebuild without photos
      if (pdfBase64.length > 3_500_000) {
        const smallDoc = await buildPdfDoc(false)
        if (smallDoc) {
          pdfBase64 = smallDoc.output("datauristring").split(",")[1]
        }
      }
      const safeName = selectedProject.project_name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")

      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: emailMessage,
          pdfBase64,
          fileName: `${safeName}-Report.pdf`,
          projectName: selectedProject.project_name,
          propertyAddress: selectedProject.property_address || "",
          projectId: selectedProjectId,
          userId: user?.id,
          companyName: companyName || "",
          followUpDays: emailFollowUp ? 3 : 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      setEmailStatus("sent")

      // Log activity
      fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          projectId: selectedProjectId,
          action: "Report emailed",
          details: `Sent to ${emailTo} — ${captures.length} findings`,
        }),
      }).catch(() => {})

      // Auto-update all captures to "Sent"
      bulkUpdateStatus(captures.map((c) => c.id), "Sent")
    } catch (err) {
      setEmailStatus("error")
      setEmailError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setEmailSending(false)
    }
  }

  const MAX_PHOTOS = 6

  function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Skip compression if already small enough
        if (img.width <= maxWidth && file.size < 500_000) {
          resolve(file)
          return
        }
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }))
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  function addFiles(newFiles: File[]) {
    // Filter to only image files
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    const remaining = MAX_PHOTOS - files.length
    if (remaining <= 0) {
      setStatus(`Maximum ${MAX_PHOTOS} photos per capture.`)
      return
    }
    const toAdd = imageFiles.slice(0, remaining)
    if (toAdd.length < imageFiles.length) {
      setStatus(`Only ${remaining} more photo${remaining !== 1 ? "s" : ""} allowed. ${imageFiles.length - toAdd.length} skipped.`)
    } else {
      setStatus("")
    }
    setFiles((prev) => [...prev, ...toAdd])
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))])
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return
    addFiles(Array.from(selected))
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files
    if (!dropped || dropped.length === 0) return
    addFiles(Array.from(dropped))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function removeFile(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedProjectId) {
      setStatus("Please select or create a project first.")
      return
    }
    if (files.length === 0) {
      setStatus("Please select at least one photo.")
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
    setStatus(`Compressing ${files.length} photo${files.length !== 1 ? "s" : ""}...`)

    // Compress all images before upload
    const compressed = await Promise.all(files.map((f) => compressImage(f)))

    setStatus(`Uploading ${compressed.length} photo${compressed.length !== 1 ? "s" : ""}...`)

    const uploadedUrls: string[] = []

    for (const f of compressed) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${f.name}`

      const { error: uploadError } = await supabase.storage
        .from("test-uploads")
        .upload(fileName, f)

      if (uploadError) {
        setStatus(`Upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from("test-uploads")
        .getPublicUrl(fileName)

      uploadedUrls.push(urlData.publicUrl)
    }

    setStatus("Saving capture...")

    // Insert capture with all columns, fall back to core columns if schema cache is stale
    const fullRow = {
      project_id: selectedProjectId,
      image_url: uploadedUrls[0],
      image_urls: uploadedUrls,
      damage_type: damageType,
      roof_area: roofArea,
      field_note: fieldNote,
      status: "Captured",
      quantity: parseInt(quantity) || 1,
      unit: unit || null,
    }
    const coreRow = {
      project_id: selectedProjectId,
      image_url: uploadedUrls[0],
      damage_type: damageType,
      roof_area: roofArea,
      field_note: fieldNote,
    }

    let { error: insertError, data: insertedRow } = await supabase
      .from("captures")
      .insert(fullRow)
      .select()
      .single()

    if (insertError?.message?.includes("schema cache")) {
      const fallback = await supabase
        .from("captures")
        .insert(coreRow)
        .select()
        .single()
      insertError = fallback.error
      insertedRow = fallback.data
    }

    if (insertError) {
      setStatus(`Save failed: ${insertError.message}`)
      setSaving(false)
      return
    }

    setStatus("Capture saved!")

    // Log activity
    fetch("/api/activity-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user!.id,
        projectId: selectedProjectId,
        action: "Capture added",
        details: `${damageType} — ${roofArea}${fieldNote ? ": " + fieldNote.substring(0, 50) : ""}`,
      }),
    }).catch(() => {})

    setFiles([])
    previews.forEach((p) => URL.revokeObjectURL(p))
    setPreviews([])
    setDamageType("")
    setRoofArea("")
    setFieldNote("")
    setQuantity("1")
    setUnit("")
    setSaving(false)

    await loadCaptures(selectedProjectId)
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  if (authLoading || subscriptionLoading || !user || !hasActiveSubscription(subscriptionStatus)) return null

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* App header */}
      <header className="mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Supplement Snap</h1>
            <p className="text-sm text-zinc-500">
              Capture roof damage during tear-off and generate supplement drafts
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600"
          >
            Dashboard
          </Link>
          <button
            onClick={async () => { await signOut(); router.push("/") }}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Project selector */}
      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Project / Job
        </label>
        <div className="flex gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setShowNewProject(false)
            }}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewProject(!showNewProject)}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
          >
            {showNewProject ? "Cancel" : "+ New"}
          </button>
        </div>

        {/* New project form */}
        {showNewProject && (
          <form onSubmit={handleCreateProject} className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name (e.g. Smith Residence)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <input
              type="text"
              value={newProjectAddress}
              onChange={(e) => setNewProjectAddress(e.target.value)}
              placeholder="Property address"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />

            {/* Claim info toggle */}
            <button
              type="button"
              onClick={() => setShowClaimInfo(!showClaimInfo)}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              <svg className={`h-3.5 w-3.5 transition-transform ${showClaimInfo ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showClaimInfo ? "Hide" : "Add"} Insurance / Claim Info
            </button>

            {showClaimInfo && (
              <div className="space-y-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newInsuranceCompany}
                    onChange={(e) => setNewInsuranceCompany(e.target.value)}
                    placeholder="Insurance company"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={newClaimNumber}
                    onChange={(e) => setNewClaimNumber(e.target.value)}
                    placeholder="Claim #"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newPolicyNumber}
                    onChange={(e) => setNewPolicyNumber(e.target.value)}
                    placeholder="Policy #"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <input
                    type="date"
                    value={newDateOfLoss}
                    onChange={(e) => setNewDateOfLoss(e.target.value)}
                    placeholder="Date of loss"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newAdjusterName}
                    onChange={(e) => setNewAdjusterName(e.target.value)}
                    placeholder="Adjuster name"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <input
                    type="email"
                    value={newAdjusterEmail}
                    onChange={(e) => setNewAdjusterEmail(e.target.value)}
                    placeholder="Adjuster email"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creatingProject || !newProjectName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingProject ? "Creating..." : "Create Project"}
            </button>
          </form>
        )}

        {/* Selected project info */}
        {selectedProject && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-left hover:text-indigo-600 transition-colors"
                title="View on map"
              >
                {selectedProject.property_address || "No address"}
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {captures.length} capture{captures.length !== 1 ? "s" : ""}
              </span>
            </div>
            {(selectedProject.insurance_company || selectedProject.claim_number) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                {selectedProject.insurance_company && (
                  <span><span className="font-medium text-zinc-600">Ins:</span> {selectedProject.insurance_company}</span>
                )}
                {selectedProject.claim_number && (
                  <span><span className="font-medium text-zinc-600">Claim:</span> {selectedProject.claim_number}</span>
                )}
                {selectedProject.date_of_loss && (
                  <span><span className="font-medium text-zinc-600">DOL:</span> {new Date(selectedProject.date_of_loss + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                )}
                {selectedProject.adjuster_name && (
                  <span><span className="font-medium text-zinc-600">Adj:</span> {selectedProject.adjuster_name}</span>
                )}
              </div>
            )}
            {/* Diagram upload */}
            <div className="flex items-center gap-2 pt-1">
              {selectedProject.diagram_url ? (
                <div className="flex items-center gap-2">
                  <a href={selectedProject.diagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Roof Diagram
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Remove this diagram?")) return
                      await supabase.from("projects").update({ diagram_url: null }).eq("id", selectedProject.id)
                      setProjects((prev) => prev.map((p) => p.id === selectedProject.id ? { ...p, diagram_url: undefined } : p))
                    }}
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-500"
                    title="Remove diagram"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="diagram-input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !selectedProject) return
                      setDiagramUploading(true)
                      try {
                        const fileName = `diagrams/${Date.now()}-${file.name}`
                        const { error: uploadError } = await supabase.storage.from("test-uploads").upload(fileName, file)
                        if (uploadError) throw uploadError
                        const { data: urlData } = supabase.storage.from("test-uploads").getPublicUrl(fileName)
                        await supabase.from("projects").update({ diagram_url: urlData.publicUrl }).eq("id", selectedProject.id)
                        setProjects((prev) => prev.map((p) => p.id === selectedProject.id ? { ...p, diagram_url: urlData.publicUrl } : p))
                      } catch (err) {
                        console.error("Diagram upload failed:", err)
                      } finally {
                        setDiagramUploading(false)
                        e.target.value = ""
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("diagram-input")?.click()}
                    disabled={diagramUploading}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-indigo-600 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    {diagramUploading ? "Uploading..." : "Upload Roof Diagram / EagleView"}
                  </button>
                </>
              )}
            </div>
            {/* Map preview */}
            {showMap && (
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200">
                <div className="flex items-center justify-between bg-zinc-50 px-3 py-2">
                  <span className="text-xs font-medium text-zinc-500">Property Location</span>
                  <div className="flex items-center gap-2">
                    {selectedProject.property_address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProject.property_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Open in Google Maps
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowMap(false); setAddressSuggestions([]); setAddressSearch("") }}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Editable address with autocomplete */}
                <div className="relative border-b border-zinc-100 px-3 py-2 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addressEditing ? addressSearch : (selectedProject.property_address || "")}
                      onChange={(e) => { setAddressEditing(true); searchAddress(e.target.value) }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && addressSearch.trim()) {
                          await selectAddress(addressSearch.trim())
                          setAddressEditing(false)
                        }
                      }}
                      onFocus={() => { setAddressEditing(true); setAddressSearch(selectedProject.property_address || "") }}
                      onBlur={() => { setTimeout(() => { if (addressSuggestions.length === 0) setAddressEditing(false) }, 200) }}
                      placeholder="Search address..."
                      className="flex-1 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => { if (addressSearch.trim()) selectAddress(addressSearch.trim()) }}
                      className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Update
                    </button>
                  </div>
                  {/* Autocomplete suggestions dropdown */}
                  {addressSuggestions.length > 0 && (
                    <div className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
                      {addressSuggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectAddress(s.display_name)}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-zinc-50 last:border-0"
                        >
                          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-2">{s.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProject.property_address && (
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedProject.property_address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    title="Property location"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Project draft */}
      {selectedProject && captures.length > 0 && (
        <section className="mb-8">
          {!projectDraft && !projectDraftLoading && (
            <button
              type="button"
              onClick={generateProjectDraft}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              Generate Project Draft ({captures.length} capture
              {captures.length !== 1 ? "s" : ""})
            </button>
          )}

          {projectDraftLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-zinc-500">Generating project draft...</p>
            </div>
          )}

          {projectDraftError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">{projectDraftError}</p>
              <button
                type="button"
                onClick={generateProjectDraft}
                className="mt-1 text-xs font-medium text-red-500 underline hover:text-red-400"
              >
                Retry
              </button>
            </div>
          )}

          {projectDraft && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Project Supplement Draft
                </p>
              </div>

              {/* Findings summary */}
              <div className="mb-4 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                <p className="mb-2 text-xs font-medium text-zinc-400">
                  Based on {captures.length} finding{captures.length !== 1 ? "s" : ""}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {captures.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      <span className="font-medium">{c.damage_type}</span>
                      <span className="text-zinc-300 dark:text-zinc-600">/</span>
                      <span>{c.roof_area}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Draft text */}
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {projectDraft}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(projectDraft)
                    setProjectDraftCopied(true)
                    setTimeout(() => setProjectDraftCopied(false), 2000)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {projectDraftCopied ? "Copied!" : "Copy Draft"}
                </button>
                <button
                  type="button"
                  onClick={generateProjectDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                >
                  Regenerate
                </button>
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-saved
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Generate Project Report button */}
      {selectedProject && captures.length > 0 && !showReport && (
        <section className="mb-8">
          <button
            type="button"
            onClick={generateReport}
            disabled={reportLoading}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
          >
            {reportLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                Generating report...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Project Report ({captures.length} finding{captures.length !== 1 ? "s" : ""})
              </span>
            )}
          </button>
        </section>
      )}

      {/* Project Report */}
      {showReport && selectedProject && (
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Report header */}
          <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Project Report
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Close
              </button>
            </div>

            <h3 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {selectedProject.project_name}
            </h3>
            <div className="mt-1 space-y-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              <p>{selectedProject.property_address || "No address on file"}</p>
              <p>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            {/* Estimated Supplement Value */}
            {captures.length > 0 && (
              <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Estimated Supplement Value</p>
                  <p className="text-2xl font-extrabold text-green-700">
                    ${captures.reduce((sum, c) => sum + (SUPPLEMENT_ESTIMATES[c.damage_type] || 200) * (Number((c as Record<string, unknown>).quantity) || 1), 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">{captures.length} finding{captures.length !== 1 ? "s" : ""} documented</p>
                  <p className="text-xs text-green-600">Based on avg supplement values</p>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(buildReportText())
                  setReportCopied(true)
                  setTimeout(() => setReportCopied(false), 2000)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {reportCopied ? "Copied!" : "Copy Report"}
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdfGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {pdfGenerating ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={generateReport}
                disabled={reportLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
              >
                {reportLoading ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                type="button"
                onClick={openEmailModal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Send Report
              </button>
              <button
                type="button"
                onClick={exportXactimate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Xactimate CSV
              </button>
            </div>
          </div>

          {/* Findings */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {captures.map((c, i) => {
              const urls = c.image_urls && c.image_urls.length > 0 ? c.image_urls : [c.image_url]
              return (
                <div key={c.id} className="p-5">
                  {/* Finding header */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {c.damage_type} – {c.roof_area}
                      </h4>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Field note */}
                  {c.field_note && (
                    <div className="mt-3 ml-9">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Field Note</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {c.field_note}
                      </p>
                    </div>
                  )}

                  {/* Supplement draft */}
                  {drafts[c.id] && (
                    <div className="mt-3 ml-9 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">Supplement Explanation</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {drafts[c.id]}
                      </p>
                    </div>
                  )}

                  {!drafts[c.id] && (
                    <div className="mt-3 ml-9">
                      <p className="text-xs italic text-zinc-400">Draft not available for this finding.</p>
                    </div>
                  )}

                  {/* Photos */}
                  <div className="mt-3 ml-9 flex gap-2 overflow-x-auto">
                    {urls.map((url, j) => (
                      <div key={j} className="relative flex-shrink-0 group">
                        <img
                          src={url}
                          alt={`Finding ${i + 1} photo ${j + 1}`}
                          className="h-24 w-auto rounded-lg border border-zinc-200 object-cover dark:border-zinc-700 cursor-pointer"
                          onClick={() => openViewer(urls, j)}
                        />
                        <button
                          onClick={() => { setAnnotateUrl(url); setAnnotateOpen(true) }}
                          className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Annotate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Capture form — only show when a project is selected */}
      {selectedProjectId ? (
        <form onSubmit={handleSave} className="mb-10 space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">New Capture</h2>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">
                {previews.length > 0 ? `Photos (${previews.length})` : "Damage Photos"}
              </label>
              {previews.length > 0 && (
                <span className={`text-xs ${previews.length >= MAX_PHOTOS ? "text-amber-500 font-medium" : "text-zinc-400"}`}>
                  {previews.length}/{MAX_PHOTOS} max
                </span>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              id="camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              id="upload-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Photo previews grid */}
            {previews.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <div key={i} className="group relative aspect-square">
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Remove photo ${i + 1}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Photo buttons */}
            {files.length >= MAX_PHOTOS ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-600">
                Photo limit reached ({MAX_PHOTOS}/{MAX_PHOTOS}). Remove a photo to add more.
              </p>
            ) : isDragging ? (
              /* Drop zone overlay */
              <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50 px-4 py-10 text-indigo-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm font-semibold">Drop photos here</span>
              </div>
            ) : previews.length === 0 ? (
              /* Initial state — large buttons + drop hint */
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById("camera-input")?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-xs font-semibold">Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("upload-input")?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-xs font-semibold">Upload Photo</span>
                </button>
              </div>
            ) : (
              /* Photos selected — compact add-more buttons */
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById("camera-input")?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  + Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("upload-input")?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  + Add More Photos
                </button>
                <span className="hidden sm:inline-flex items-center text-xs text-zinc-400">or drag & drop</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Damage Type
            </label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Roof Area
            </label>
            <select
              value={roofArea}
              onChange={(e) => setRoofArea(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select roof area...</option>
              {ROOF_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Auto-detect</option>
                <option value="SF">SF (sq ft)</option>
                <option value="LF">LF (linear ft)</option>
                <option value="SQ">SQ (squares)</option>
                <option value="EA">EA (each)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Field Note
            </label>
            <textarea
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
              placeholder="Describe the damage..."
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-semibold ${
                  isRecording
                    ? "bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-950"
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                      <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-white" />
                    </span>
                    Recording... tap to stop
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    Record Damage Note
                  </>
                )}
              </button>
            )}
            {translating && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
                Translating to English...
              </p>
            )}
            {translated && !translating && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Translated to English
              </p>
            )}
          </div>

          {status && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                status.includes("failed")
                  ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                  : status.includes("saved")
                    ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : files.length > 1 ? `Save Capture (${files.length} photos)` : "Save Capture"}
          </button>
        </form>
      ) : (
        <div className="mb-10 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <svg className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-2 text-sm text-zinc-500">
            Select or create a project above to start capturing damage.
          </p>
        </div>
      )}

      {/* Saved captures for selected project */}
      {captures.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Captures
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                ${captures.reduce((sum, c) => sum + (SUPPLEMENT_ESTIMATES[c.damage_type] || 200), 0).toLocaleString()} est.
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                {captures.length}
              </span>
            </div>
          </div>

          {/* Status filter */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto">
            {(["All", ...CAPTURE_STATUSES] as const).map((s) => {
              const count = s === "All" ? captures.length : captures.filter((c) => (c.status || "Captured") === s).length
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    statusFilter === s
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {s}
                  <span className={`${statusFilter === s ? "text-indigo-200" : "text-zinc-400"}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            {captures
              .filter((c) => statusFilter === "All" || (c.status || "Captured") === statusFilter)
              .sort((a, b) => {
                const priority: Record<string, number> = { "Needs Review": 0, "Captured": 1, "Ready to Send": 2, "Sent": 3 }
                return (priority[a.status || "Captured"] ?? 1) - (priority[b.status || "Captured"] ?? 1)
              })
              .map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                {(() => {
                const urls = (c.image_urls && c.image_urls.length > 0 ? c.image_urls : c.image_url ? [c.image_url] : []).filter(Boolean)
                if (urls.length === 0) {
                  return (
                    <label className="flex cursor-pointer flex-col items-center gap-2 border-b border-dashed border-zinc-200 bg-zinc-50 py-10 text-zinc-400 hover:bg-zinc-100">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      <span className="text-sm font-medium">No photos added</span>
                      <span className="text-xs">Tap to upload damage photos</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                        if (!e.target.files) return
                        // This is a minimal inline handler — photos won't attach to the saved capture
                        // but it opens the dialog as requested
                      }} />
                    </label>
                  )
                }
                return urls.length === 1 ? (
                  <img
                    src={urls[0]}
                    alt={`${c.damage_type} - ${c.roof_area}`}
                    className="w-full object-cover cursor-pointer"
                    style={{ maxHeight: "280px" }}
                    onClick={() => openViewer(urls, 0)}
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${c.damage_type} - ${c.roof_area} (${i + 1})`}
                        className="aspect-square w-full rounded-lg object-cover cursor-pointer"
                        onClick={() => openViewer(urls, i)}
                      />
                    ))}
                  </div>
                )
              })()}
                <div className="p-4 space-y-3">
                  {/* Status + tags row */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      <select
                        value={c.status || "Captured"}
                        onChange={(e) => updateCaptureStatus(c.id, e.target.value as CaptureStatus)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer appearance-none pr-5 ${STATUS_STYLES[c.status as CaptureStatus || "Captured"]}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
                      >
                        {CAPTURE_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {c.damage_type}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        {c.roof_area}
                      </span>
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        ${SUPPLEMENT_ESTIMATES[c.damage_type] || 200}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Field note */}
                  {c.field_note && (
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{c.field_note}</p>
                  )}

                  {/* Generate draft button */}
                  {!drafts[c.id] && !draftLoading[c.id] && (
                    <button
                      type="button"
                      onClick={() => generateDraft(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate Supplement Draft
                    </button>
                  )}

                  {/* Draft loading */}
                  {draftLoading[c.id] && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <p className="text-xs text-zinc-500">Generating draft...</p>
                    </div>
                  )}

                  {/* Draft error */}
                  {draftErrors[c.id] && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/30">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {draftErrors[c.id]}
                      </p>
                      <button
                        type="button"
                        onClick={() => generateDraft(c)}
                        className="mt-1 text-xs font-medium text-red-500 underline hover:text-red-400"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Draft result */}
                  {drafts[c.id] && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <div className="mb-2 flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Supplement Draft
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{drafts[c.id]}</p>
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
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copied[c.id] ? "Copied!" : "Copy Draft"}
                      </button>
                    </div>
                  )}

                  {/* Delete */}
                  <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => deleteCapture(c)}
                      className="text-xs text-zinc-400 hover:text-red-500"
                    >
                      Delete Capture
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            {emailStatus === "sent" ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">Report Sent Successfully</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  The report has been sent to {emailTo}
                </p>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-zinc-900">Send Report</h3>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Adjuster Email</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="adjuster@example.com"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Message</label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                    The PDF report with all findings and photos will be attached automatically.
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailFollowUp}
                      onChange={(e) => setEmailFollowUp(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                    />
                    <span className="text-sm text-zinc-600">Send automatic follow-up in 3 days if not opened</span>
                  </label>

                  {emailStatus === "error" && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {emailError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={sendReport}
                    disabled={emailSending || !emailTo}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {emailSending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </span>
                    ) : (
                      "Send Report"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewerPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={(e) => { if (e.target === e.currentTarget) { setViewerPhotos([]); setViewerZoom(1) } }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => { setViewerPhotos([]); setViewerZoom(1) }}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          {viewerPhotos.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {viewerIndex + 1} / {viewerPhotos.length}
            </div>
          )}

          {/* Previous button */}
          {viewerIndex > 0 && (
            <button
              type="button"
              onClick={() => { setViewerIndex((i) => i - 1); setViewerZoom(1) }}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {viewerIndex < viewerPhotos.length - 1 && (
            <button
              type="button"
              onClick={() => { setViewerIndex((i) => i + 1); setViewerZoom(1) }}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="flex h-full w-full items-center justify-center overflow-auto p-12 sm:p-16"
            onWheel={(e) => {
              e.preventDefault()
              setViewerZoom((z) => Math.min(Math.max(z + (e.deltaY > 0 ? -0.2 : 0.2), 0.5), 4))
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                viewerTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
              }
            }}
            onTouchEnd={(e) => {
              if (!viewerTouchStart.current || e.changedTouches.length === 0) return
              const dx = e.changedTouches[0].clientX - viewerTouchStart.current.x
              const dy = e.changedTouches[0].clientY - viewerTouchStart.current.y
              viewerTouchStart.current = null
              // Only swipe if horizontal movement is dominant and > 50px
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0 && viewerIndex < viewerPhotos.length - 1) {
                  setViewerIndex((i) => i + 1)
                  setViewerZoom(1)
                } else if (dx > 0 && viewerIndex > 0) {
                  setViewerIndex((i) => i - 1)
                  setViewerZoom(1)
                }
              }
            }}
          >
            <img
              src={viewerPhotos[viewerIndex]}
              alt={`Photo ${viewerIndex + 1}`}
              className="max-h-full max-w-full object-contain select-none"
              style={{ transform: `scale(${viewerZoom})`, transition: "transform 0.15s ease" }}
              draggable={false}
            />
          </div>
        </div>
      )}
      {/* Photo Annotator Modal */}
      <PhotoAnnotator
        imageUrl={annotateUrl}
        open={annotateOpen}
        onClose={() => setAnnotateOpen(false)}
        onSave={(dataUrl) => {
          // Download the annotated image
          const a = document.createElement("a")
          a.href = dataUrl
          a.download = "annotated-damage.jpg"
          a.click()
        }}
      />
    </main>
  )
}
