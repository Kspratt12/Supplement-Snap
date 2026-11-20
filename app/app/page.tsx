"use client"

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { authFetch } from "../../lib/auth-fetch"
import { photoPathsForCaptures, removePhotoFiles } from "../../lib/storage-paths"
import { NOT_SAVED_NO_PERMISSION, writeOutcome } from "../../lib/write-result"
import { quantityLabel } from "../../lib/quantity-label"
import { PDF_FOOTER_LINES, DEFAULT_REPORT_EMAIL_MESSAGE } from "../../lib/report-wording"
import { uploadQueuedCapture, serverCaptureId, savedState } from "../../lib/sync-capture"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { jsPDF } from "jspdf"
import { supabase } from "../../lib/supabase"
import { useAuth, hasActiveSubscription } from "../../lib/auth-context"
import { PhotoAnnotator } from "../dashboard/photo-annotator"
import { SignedImg } from "../../lib/signed-img"
import { signedPhotoUrl, openStoredFile } from "../../lib/photo-access"
import { describeExportFailure, describeMissingPdfAssets, noMissingPdfAssets } from "../../lib/pdf-assets"
import { ClaimsOverview, ClaimStatusSelect, StartHere } from "./claims-overview"
import { normalizeClaimStatus, filterProjects, statusAfterSend, isFirstRun, isDemoProject, type ClaimStatus } from "../../lib/claim-status"
import { hasCreatedProject, markProjectCreated } from "../../lib/guide-state"
import { FeedbackBox } from "../dashboard/feedback-box"
import { ensureSpace, drawLabeledText, drawSectionLabel } from "../../lib/pdf-layout"
import { extractAllExifData } from "../../lib/exif-utils"
import {
  alignMetadata,
  appendPhotos,
  metadataForUploaded,
  removePhotoAt,
  shotCoverage,
  photoLabel,
  photoFileDetails,
  isNetworkFailure,
  LOCAL_ID_PREFIX,
  PROVENANCE_NOTE,
  type PhotoDetails,
  type ShotType,
} from "../../lib/photo-evidence"
import { SPEECH_LANGS, loadSpeechLang, saveSpeechLang, fetchAccountSpeechLang } from "../../lib/speech-langs"
import { uploadPhotosWithRetry, cleanupOrphanedUploads } from "../../lib/upload-utils"
import { trackEvent } from "../../lib/analytics"
import { OfflineSyncBanner } from "./offline-sync-banner"
import { ClaimTracking, DiagramPinDialog, type TrackingPatch } from "./claim-tracking"
import { hasColumn, orderForReport, moveInReport, numberedPins, normalizePin, type Pin } from "../../lib/report-tracking"
import {
  queueCapture,
  syncPendingCaptures,
  getPendingCount,
  getCappedCount,
  getQueuedForProject,
  getRefused,
  discardQueued,
  RETRY_CAP,
  fileToArrayBuffer,
  type PendingCapture,
} from "../../lib/offline-queue"

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

type Project = {
  user_id?: string
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
  // Present only once supabase-migration-v16 has run
  amount_requested?: number | string | null
  amount_approved?: number | string | null
  follow_up_on?: string | null
  // Present only once supabase-migration-v17 has run: the owner lets team members add findings to this project
  team_capture?: boolean
}

const CAPTURE_STATUSES = ["Captured", "Needs Review", "Ready to Send", "Sent"] as const
type CaptureStatus = typeof CAPTURE_STATUSES[number]

const STATUS_STYLES: Record<CaptureStatus, string> = {
  "Captured": "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-amber-50 text-amber-600",
  "Ready to Send": "bg-blue-50 text-blue-600",
  "Sent": "bg-green-50 text-green-700",
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
  photo_metadata?: (PhotoDetails | null)[] | null
  quantity?: number | null
  unit?: string | null
  // Present only once supabase-migration-v16 has run
  report_order?: number | null
  diagram_pin?: unknown
  // Present only once supabase-migration-v17 has run: the account that added the finding
  created_by?: string | null
  /** Set only on a finding that is still in this device's queue and not yet saved to the account */
  localOnly?: { status: PendingCapture["status"]; retryCount: number }
}

const photoUrlsOf = (c: Pick<Capture, "image_url" | "image_urls">) =>
  (c.image_urls && c.image_urls.length > 0 ? c.image_urls : c.image_url ? [c.image_url] : []).filter(Boolean)

// AI replies sometimes arrive with markdown marks. Show, copy and export plain text.
function cleanAi(text: string): string {
  return (text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*-{3,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}

function Home() {
  const { user, loading: authLoading, signOut, subscriptionStatus, subscriptionPlan, subscriptionLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect to login if not authenticated — allow free users in with limits
  useEffect(() => {
    if (authLoading || subscriptionLoading) return
    if (!user) { router.replace("/login"); return }
  }, [user, authLoading, subscriptionLoading, router])

  const isFreeUser = !hasActiveSubscription(subscriptionStatus)
  const isProUser = hasActiveSubscription(subscriptionStatus) && (subscriptionPlan === "pro" || subscriptionPlan === "team" || subscriptionPlan === "enterprise")
  // Every account starts with an auto-created demo project, so a free account holds 2: the demo plus one of its own
  const FREE_PROJECT_LIMIT = 2
  const FREE_CAPTURE_LIMIT = 3

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
  const [speechLang, setSpeechLang] = useState<string>(() => loadSpeechLang())
  useEffect(() => {
    if (speechLang) return
    fetchAccountSpeechLang().then((code) => { if (code) { setSpeechLang(code); saveSpeechLang(code) } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
  // Read from the browser. The server and the first render say "no", then the real answer is used.
  const speechSupported = useSyncExternalStore(
    () => () => {},
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false
  )
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const pendingDeletes = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // Pictures the report asked for and could not get, so a report is never quietly saved or sent without them
  const pdfMissing = useRef(noMissingPdfAssets())
  const [undoCapture, setUndoCapture] = useState<Capture | null>(null)
  const demoCreatedFor = useRef<string | null>(null) // stops two concurrent loads both creating the demo project

  // Captures + drafts
  const [captures, setCaptures] = useState<Capture[]>([])
  // Reports, exports, emails and status changes use only findings saved to the account. Findings still on this device
  // are shown in the list but are never put in a report, since the adjuster could not open their photos.
  // In the person's chosen report order when they have set one (report_order), otherwise the order on screen.
  const reportCaptures = orderForReport(captures.filter((c) => !c.localOnly))
  // Controls that need supabase-migration-v16 appear only when the loaded rows carry its columns
  const canReorder = reportCaptures.length > 1 && hasColumn(reportCaptures[0], "report_order")
  // Pins need a picture to place them on: a diagram uploaded as a PDF cannot be shown in the pin screen or drawn on in the report
  const canPin = reportCaptures.length > 0 && hasColumn(reportCaptures[0], "diagram_pin")
  const diagramIsImage = (url?: string | null) => !!url && !/\.pdf($|[?#])/i.test(url)
  const [pinFor, setPinFor] = useState<string | null>(null)
  const [savingTeamCapture, setSavingTeamCapture] = useState(false)
  // Findings queued on this device that the database refused (access to the project was removed). Never retried.
  const [refusedItems, setRefusedItems] = useState<PendingCapture[]>([])
  async function discardFromDevice(ids: string[]) {
    for (const id of ids) await discardQueued(id, user?.id)
    getRefused(user?.id).then(setRefusedItems).catch(() => {})
    getPendingCount(user?.id).then(setPendingQueueCount).catch(() => {})
    if (selectedProjectId) await loadCaptures(selectedProjectId)
  }
  const [reordering, setReordering] = useState(false)
  const localOnlyCount = captures.length - reportCaptures.length
  // Optional wide/close-up tag for each photo in the capture form, in the same order as `files`
  const [shots, setShots] = useState<(ShotType | null)[]>([])
  const [statusFilter, setStatusFilter] = useState<"All" | CaptureStatus>("All")
  const [projectQuery, setProjectQuery] = useState("")
  const [claimFilter, setClaimFilter] = useState<ClaimStatus | "All">("All")
  const [savingClaimStatus, setSavingClaimStatus] = useState(false)
  const [claimStatusError, setClaimStatusError] = useState("")
  const [claimSaveError, setClaimSaveError] = useState("")
  const [notice, setNotice] = useState("")
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // A short message at the bottom of the screen for saves that did not go through (for example no signal on the roof).
  function showNotice(message: string) {
    setNotice(message)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(""), 7000)
  }
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  // Photos and edits on saved findings
  const [cardBusy, setCardBusy] = useState<Record<string, boolean>>({})
  const [cardMsg, setCardMsg] = useState<Record<string, string>>({})
  const [editingCaptureId, setEditingCaptureId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ damage_type: "", roof_area: "", field_note: "", quantity: "1", unit: "" })
  // Editing AI drafts: "project" or a capture id
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [editingDraftText, setEditingDraftText] = useState("")
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
  const [savedProjectDraft, setSavedProjectDraft] = useState("") // the draft text the database confirmed holding
  const [projectDraftLoading, setProjectDraftLoading] = useState(false)
  const [projectDraftError, setProjectDraftError] = useState("")
  const [projectDraftCopied, setProjectDraftCopied] = useState(false)
  const [draftExpanded, setDraftExpanded] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  // Which action opened the upgrade modal: a fixed list, sent with the analytics event (no account, project or claim data)
  const upgradeSource = useRef<"pdf" | "email" | "csv" | "annotate" | "project_limit" | "capture_limit">("pdf")
  function openUpgradeModal(source: "pdf" | "email" | "csv" | "annotate" | "project_limit" | "capture_limit") {
    upgradeSource.current = source
    setShowUpgradeModal(true)
  }
  // Counted once each time the modal goes from hidden to visible, not on every render
  useEffect(() => {
    if (showUpgradeModal) trackEvent("upgrade_modal_viewed", { source: upgradeSource.current })
  }, [showUpgradeModal])
  const [editingClaim, setEditingClaim] = useState(false)
  const [editClaimData, setEditClaimData] = useState({ insurance_company: "", claim_number: "", policy_number: "", adjuster_name: "", adjuster_email: "", date_of_loss: "" })

  // Project report state
  const [showReport, setShowReport] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const csvExporting = useRef(false)

  // Company branding state
  const [companyName, setCompanyName] = useState("")
  const [companyLogoUrl, setCompanyLogoUrl] = useState("")

  // Photo annotation state
  const [annotateUrl, setAnnotateUrl] = useState("")
  const [annotateOpen, setAnnotateOpen] = useState(false)
  // The finding and photo position being marked up, so the marked-up copy can be added to that finding
  const [annotateTarget, setAnnotateTarget] = useState<{ captureId: string; photoIndex: number } | null>(null)
  // Preview addresses made for findings held on this device; released when the list is rebuilt
  const localPreviewUrls = useRef<string[]>([])

  // Offline queue state
  const [pendingQueueCount, setPendingQueueCount] = useState(0)
  const [cappedQueueCount, setCappedQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  // Shows "Saved" for a few seconds after a capture is stored or queued captures finish syncing
  const [savedFlash, setSavedFlash] = useState(false)
  useEffect(() => {
    if (!savedFlash) return
    const t = setTimeout(() => setSavedFlash(false), 3000)
    return () => clearTimeout(t)
  }, [savedFlash])
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<"" | "sent" | "error">("")
  const [emailError, setEmailError] = useState("")

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

  // Offline queue: network listener + auto-sync on reconnect
  useEffect(() => {
    // Nothing is counted or uploaded without a signed-in account; each account sees and sends only its own queued captures
    // (Signed out, the page redirects to the login screen; the next account's own counts are read when it signs in.)
    if (!user?.id) return
    // Load initial pending count
    getPendingCount(user?.id).then(setPendingQueueCount).catch(() => {})
    getCappedCount(user?.id).then(setCappedQueueCount).catch(() => {}); getRefused(user?.id).then(setRefusedItems).catch(() => {})

    // Automatic syncs leave captures that used up their retries alone; a manual one (Sync Now) tries them once more.
    async function runSync(manual: boolean) {
      setSyncing(true)
      try {
        // Photos are uploaded and then the record is saved; if the record cannot be saved the photos are removed again
        const synced = await syncPendingCaptures((capture: PendingCapture) => uploadQueuedCapture(capture, compressImage), { includeCapped: manual, userId: user?.id })
        if (synced > 0) setSavedFlash(true)
        // Reload either way: an uploaded finding moves from "on this device" to saved, and a failed one shows its new state
        if (selectedProjectId) {
          await loadCaptures(selectedProjectId)
        }
      } finally {
        setSyncing(false)
        getPendingCount(user?.id).then(setPendingQueueCount).catch(() => {})
        getCappedCount(user?.id).then(setCappedQueueCount).catch(() => {}); getRefused(user?.id).then(setRefusedItems).catch(() => {})
      }
    }

    function handleOnline() {
      setIsOnline(true)
      void runSync(false)
    }

    function handleManualSync() {
      void runSync(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    // A finding kept on the device while the phone still had some signal (a photo that would not upload) gets no
    // "back online" event, so it is also retried automatically every minute while online. The retry cap still applies.
    const retryTimer = setInterval(() => {
      if (!navigator.onLine) return
      getPendingCount(user?.id).then((n) => { if (n > 0) void runSync(false) }).catch(() => {})
    }, 60_000)

    window.addEventListener("online", handleOnline)
    window.addEventListener("ss-manual-sync", handleManualSync)
    window.addEventListener("offline", handleOffline)
    return () => {
      clearInterval(retryTimer)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("ss-manual-sync", handleManualSync)
      window.removeEventListener("offline", handleOffline)
    }
  }, [selectedProjectId, user?.id])

  async function translateNote(text: string) {
    setTranslating(true)
    setTranslated(false)
    try {
      const res = await authFetch("/api/translate-note", {
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
    if (speechLang) recognition.lang = speechLang

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

    recognition.onerror = (event) => {
      const reason = (event as unknown as { error?: string }).error
      if (reason === "not-allowed" || reason === "service-not-allowed") {
        showNotice("The microphone is blocked. Allow it in your browser settings, or type your note instead.")
      } else if (reason === "audio-capture") {
        showNotice("No microphone was found. You can type your note instead.")
      } else if (reason === "network") {
        showNotice("Voice notes need a connection. Type your note, or try again when you have signal.")
      }
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
      authFetch(`/api/company-settings?userId=${user.id}`)
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

  // Auto-select the project named in the URL once the list has loaded (done while rendering, not in an effect)
  const projectParam = searchParams.get("project")
  if (projectParam && !selectedProjectId && projects.some((p) => p.id === projectParam)) {
    setSelectedProjectId(projectParam)
  }

  // When a different project is chosen, clear everything that belonged to the previous one
  const [resetFor, setResetFor] = useState(selectedProjectId)
  if (resetFor !== selectedProjectId) {
    setResetFor(selectedProjectId)
    if (!selectedProjectId) {
      setCaptures([])
      setProjectDraft("")
      setSavedProjectDraft("")
    }
    setDrafts({})
    setDraftLoading({})
    setDraftErrors({})
    setProjectDraftError("")
    setShowReport(false)
    setShowMap(false)
    setAddressSuggestions([])
    setAddressSearch("")
  }

  // Load the chosen project's captures and its saved draft
  useEffect(() => {
    if (!selectedProjectId) return
    // A different project starts at the top of the page, not wherever the last view was scrolled to
    window.scrollTo({ top: 0 })
    loadCaptures(selectedProjectId)
    supabase.from("projects").select("last_draft").eq("id", selectedProjectId).single().then(({ data }) => {
      const stored = cleanAi(data?.last_draft || "")
      setProjectDraft(stored)
      setSavedProjectDraft(stored)
    })
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
    const addressOutcome = writeOutcome(await supabase.from("projects").update({ property_address: address }).eq("id", selectedProject.id).select("id"))
    if (addressOutcome !== "ok") {
      // Show the last saved address again, not the text that was just typed
      setAddressEditing(false)
      setAddressSearch(selectedProject.property_address || "")
      showNotice(addressOutcome === "refused" ? NOT_SAVED_NO_PERMISSION : "The address was not saved. Check your connection and try again.")
      return
    }
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

    // Auto-create a demo project for brand new users
    // (not for someone who has made their own project and then deleted everything)
    if (unique.length === 0 && user?.id && demoCreatedFor.current !== user.id && !hasCreatedProject(user.id)) {
      demoCreatedFor.current = user.id
      try {
        const { data: demo } = await supabase
          .from("projects")
          .insert({
            project_name: "Demo Project — Smith Residence",
            property_address: "742 Evergreen Terrace, Springfield",
            user_id: user.id,
            insurance_company: "State Farm",
            claim_number: "SF-2026-DEMO",
            adjuster_name: "John Smith",
            adjuster_email: "",
            claim_status: "In Progress",
          })
          .select()
          .single()

        if (demo) {
          // Add sample captures to the demo project
          await supabase.from("captures").insert([
            {
              project_id: demo.id,
              damage_type: "Decking",
              roof_area: "Front",
              field_note: "3 sheets of rotted OSB decking along the eave edge. Wood is soft and deteriorated from moisture exposure.",
              image_url: "",
              status: "Captured",
            },
            {
              project_id: demo.id,
              damage_type: "Flashing",
              roof_area: "Chimney",
              field_note: "Step flashing severely corroded with multiple separation points. Not visible prior to shingle removal.",
              image_url: "",
              status: "Captured",
            },
          ])

          setProjects([demo])
          setSelectedProjectId(demo.id)
          return
        }
      } catch {
        // Demo creation failed — not critical
      }
    }

    if (user?.id && unique.some((p) => !isDemoProject(p))) markProjectCreated(user.id)
    setProjects(unique)
  }

  // Findings still in this device's queue for the project, as cards. They keep the queued photos (shown from the device)
  // and their upload state, so a refresh or reopened page still shows them, clearly marked as not yet saved.
  async function queuedCards(projectId: string): Promise<Capture[]> {
    if (!user?.id) return []
    try {
      const queued = await getQueuedForProject(projectId, user.id)
      localPreviewUrls.current.forEach((u) => URL.revokeObjectURL(u))
      localPreviewUrls.current = []
      return queued
        .map((q) => {
          const urls = q.photos.map((buf) => {
            const u = URL.createObjectURL(new Blob([buf]))
            localPreviewUrls.current.push(u)
            return u
          })
          return {
            id: `${LOCAL_ID_PREFIX}${q.id}`,
            project_id: q.projectId,
            image_url: urls[0] || "",
            image_urls: urls,
            damage_type: q.damageType,
            roof_area: q.roofArea,
            field_note: q.fieldNote,
            status: "Captured" as CaptureStatus,
            created_at: q.createdAt,
            photo_metadata: alignMetadata(q.photoMetadata, urls.length),
            quantity: q.quantity,
            unit: q.unit || null,
            localOnly: { status: q.status, retryCount: q.retryCount },
          }
        })
        .reverse() // newest first, like the saved list
    } catch {
      return [] // device storage unavailable: nothing queued can be shown
    }
  }

  async function loadCaptures(projectId: string) {
    const [{ data }, local] = await Promise.all([
      supabase
        .from("captures")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      queuedCards(projectId),
    ])
    if (data) setCaptures([...local, ...data])
    // Offline or a failed read: keep the saved findings already on screen, with the device's queue refreshed
    else setCaptures((prev) => [...local, ...prev.filter((c) => !c.localOnly && c.project_id === projectId)])
    // Restore saved drafts from capture records
    if (data) {
      const savedDrafts: Record<string, string> = {}
      data.forEach((c: Capture & { draft?: string }) => {
        if (c.draft) savedDrafts[c.id] = cleanAi(c.draft)
      })
      if (Object.keys(savedDrafts).length > 0) {
        setDrafts((prev) => ({ ...prev, ...savedDrafts }))
      }
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    if (isFreeUser) {
      // Count ALL projects ever created (not just current) to prevent delete-and-recreate
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
      if ((count || 0) >= FREE_PROJECT_LIMIT) {
        openUpgradeModal("project_limit")
        return
      }
    }

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
      if (user) markProjectCreated(user.id)
      trackEvent("project_created")
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

  // Delete hides the capture right away and removes it for real after 8 seconds, unless undone.
  // Closing the page inside that window keeps the capture, so nothing is lost by accident.
  function deleteCapture(c: Capture) {
    if (undoCapture && undoCapture.id !== c.id) {
      clearTimeout(pendingDeletes.current[undoCapture.id])
      void finalizeDelete(undoCapture)
    }
    setCaptures((prev) => prev.filter((cap) => cap.id !== c.id))
    setUndoCapture(c)
    pendingDeletes.current[c.id] = setTimeout(() => {
      setUndoCapture((cur) => (cur && cur.id === c.id ? null : cur))
      void finalizeDelete(c)
    }, 8000)
  }

  function undoDelete() {
    if (!undoCapture) return
    clearTimeout(pendingDeletes.current[undoCapture.id])
    const back = undoCapture
    setCaptures((prev) => [...prev, back].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    setUndoCapture(null)
  }

  async function finalizeDelete(c: Capture) {

    const putBack = (message: string) => {
      setCaptures((prev) => (prev.some((cap) => cap.id === c.id) ? prev : [...prev, c].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
      showNotice(message)
    }

    // The server deletes the record (only for the project's owner) and then exactly the files that record lists, including
    // photos a team member added. If the record cannot be deleted, the capture comes back with its photos.
    let result: { deleted?: boolean; reason?: string; notConfirmed?: string[] } | null = null
    try {
      const res = await authFetch("/api/captures/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ captureId: c.id }) })
      result = await res.json().catch(() => null)
    } catch {
      result = null
    }
    if (!result) {
      putBack("The capture could not be deleted, so it was put back. Check your connection and try again.")
      return
    }
    if (!result.deleted) {
      putBack(result.reason === "not_owner"
        ? "Only the project owner can delete findings, so this one was put back."
        : "This finding was not deleted, so it was put back. It may already be deleted. Refresh to check.")
      return
    }
    setCaptures((prev) => prev.filter((cap) => cap.id !== c.id))
    // The server noted any file whose removal was not confirmed; say so instead of claiming they are gone
    const notConfirmed = Array.isArray(result.notConfirmed) ? result.notConfirmed : []
    if (notConfirmed.length > 0) {
      showNotice(`The finding was deleted, but ${notConfirmed.length} photo file${notConfirmed.length === 1 ? "" : "s"} could not be confirmed removed from storage. They are noted for cleanup; email support@supplementsnap.io if you want confirmation.`)
    }
  }

  // Photo files stay reachable by their link until the file itself is removed, so a removal that was not confirmed is
  // shown to the person and written to the activity log, where it can be found and cleaned up by hand.
  function reportUnremovedFiles(paths: string[], projectId: string | null, lead: string) {
    showNotice(`${lead}, but ${paths.length} photo file${paths.length === 1 ? "" : "s"} could not be confirmed removed from storage. Email support@supplementsnap.io so we can remove ${paths.length === 1 ? "it" : "them"}.`)
    authFetch("/api/activity-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, action: "Photo files not confirmed removed", details: paths.join(", ").slice(0, 1500) }),
    }).catch(() => {})
  }

  async function updateCaptureStatus(captureId: string, newStatus: CaptureStatus) {
    const statusOutcome = writeOutcome(await supabase.from("captures").update({ status: newStatus }).eq("id", captureId).select("id"))
    if (statusOutcome !== "ok") {
      // The list keeps the last saved status, so the dropdown goes back to it
      showNotice(statusOutcome === "refused" ? NOT_SAVED_NO_PERMISSION : "The status was not saved. Check your connection and try again.")
      return
    }
    setCaptures((prev) =>
      prev.map((c) => (c.id === captureId ? { ...c, status: newStatus } : c))
    )

    // Log status change
    const capture = captures.find((c) => c.id === captureId)
    if (capture && user) {
      authFetch("/api/activity-log", {
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
    const saved: string[] = []
    for (const id of captureIds) {
      const outcome = writeOutcome(await supabase.from("captures").update({ status: newStatus }).eq("id", id).select("id"))
      if (outcome === "ok") saved.push(id)
    }
    // Only findings whose new status was really saved change on screen
    setCaptures((prev) => prev.map((c) => (saved.includes(c.id) ? { ...c, status: newStatus } : c)))
    if (saved.length < captureIds.length) showNotice("Some finding statuses could not be saved, so they were left as they were.")
  }

  async function generateProjectDraft() {
    if (!selectedProject || !selectedProjectId) return

    setProjectDraftLoading(true)
    setProjectDraftError("")
    // The draft already on screen stays until a new, finished one replaces it, so a failed regeneration loses nothing

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

      const res = await authFetch("/api/generate-project-draft", {
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

      const { draft: rawDraft } = await res.json()
      const draft = cleanAi(rawDraft)
      setProjectDraft(draft)
      setDraftExpanded(true)
      // Persist project draft (not for a project this account can only view)
      if (!readOnly) {
        supabase.from("projects").update({ last_draft: draft }).eq("id", selectedProjectId).select("id").then(
          (res) => { if (writeOutcome(res) === "ok") setSavedProjectDraft(draft) },
          () => {}
        )
      }

      // Log activity
      authFetch("/api/activity-log", {
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
      const res = await authFetch("/api/generate-draft", {
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

      const { draft: rawDraft } = await res.json()
      const draft = cleanAi(rawDraft)
      setDrafts((prev) => ({ ...prev, [c.id]: draft }))
      if (!readOnly) {
        // Save the draft to the finding. If it is not saved, say so: it is on screen now but would be gone after a refresh,
        // and the finding is not moved to Needs Review.
        const saved = writeOutcome(await supabase.from("captures").update({ draft: draft }).eq("id", c.id).select("id"))
        if (saved !== "ok") {
          setCardMsg((prev) => ({
            ...prev,
            [c.id]: saved === "refused"
              ? NOT_SAVED_NO_PERMISSION
              : "The draft is shown here but was not saved to your account. Copy it, or use Edit and Save to try again.",
          }))
        } else if (!c.status || c.status === "Captured") {
          updateCaptureStatus(c.id, "Needs Review")
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setDraftErrors((prev) => ({ ...prev, [c.id]: message }))
    } finally {
      setDraftLoading((prev) => ({ ...prev, [c.id]: false }))
    }
  }

  async function generateReport() {
    if (!selectedProject || reportCaptures.length === 0) return

    setReportLoading(true)

    // Generate drafts for any captures that don't have one yet
    const missing = reportCaptures.filter((c) => !drafts[c.id] && !draftLoading[c.id])

    // A finding is only marked Ready to Send when it has a finished draft that is saved. Findings that already had a
    // draft keep it. A draft that failed, was cut off or could not be saved leaves that finding as it was.
    const hasSavedDraft = new Set(reportCaptures.filter((c) => !!drafts[c.id]).map((c) => c.id))
    const notDrafted: string[] = []
    let firstProblem = ""

    for (const c of missing) {
      try {
        const res = await authFetch("/api/generate-draft", {
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
          if (!firstProblem) firstProblem = data?.error || `Request failed (${res.status})`
          notDrafted.push(c.id)
          continue
        }
        const { draft: rawDraft } = await res.json()
        const draft = cleanAi(rawDraft)
        if (!draft) {
          if (!firstProblem) firstProblem = "The AI returned an empty draft. Please try again."
          notDrafted.push(c.id)
          continue
        }
        setDrafts((prev) => ({ ...prev, [c.id]: draft }))
        if (readOnly) continue
        // Persist the draft so the report reads the same next time it is generated, and only count it once it is saved
        const saveRes = await supabase.from("captures").update({ draft: draft }).eq("id", c.id).select("id")
        if (writeOutcome(saveRes) === "ok") {
          hasSavedDraft.add(c.id)
        } else {
          if (!firstProblem) firstProblem = "A draft could not be saved."
          notDrafted.push(c.id)
        }
      } catch {
        // Continue generating remaining drafts even if one fails
        if (!firstProblem) firstProblem = "The AI draft request failed. Check your connection and try again."
        notDrafted.push(c.id)
      }
    }

    // Auto-update to "Ready to Send" only the findings that have a finished, saved draft
    const toUpdate = reportCaptures.filter((c) => c.status !== "Sent" && hasSavedDraft.has(c.id)).map((c) => c.id)
    if (toUpdate.length > 0 && !readOnly) {
      bulkUpdateStatus(toUpdate, "Ready to Send")
    }
    if (notDrafted.length > 0) {
      showNotice(
        `${firstProblem} ${notDrafted.length} finding${notDrafted.length !== 1 ? "s were" : " was"} not marked Ready to Send. Use "Generate Supplement Draft" on ${notDrafted.length !== 1 ? "them" : "it"} to try again.`,
      )
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

    reportCaptures.forEach((c, i) => {
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

  // Helper: fetch image and compress for PDF embedding (reduces memory usage)
  async function fetchImageForPdf(url: string, maxWidth = 800): Promise<string | null> {
    try {
      if (!url || url === "") return null

      // Fetch as blob (through a short-lived link when the file is in our storage)
      const link = await signedPhotoUrl(url, selectedProject?.id)
      if (!link) return null
      const res = await fetch(link)
      if (!res.ok) return null
      const blob = await res.blob()

      // Compress via canvas for PDF (smaller than original upload)
      return await new Promise<string | null>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1
          const canvas = document.createElement("canvas")
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext("2d")
          if (!ctx) { resolve(null); return }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6)
          URL.revokeObjectURL(img.src) // Free memory immediately
          resolve(dataUrl)
        }
        img.onerror = () => resolve(null)
        img.src = URL.createObjectURL(blob)
      })
    } catch {
      return null
    }
  }

  // Legacy helper for logo and diagram (needs full quality)
  async function fetchImageDataUrl(url: string): Promise<string | null> {
    try {
      if (!url || url === "") return null
      // The logo and diagram live in the same storage; use a short-lived link when the file is ours
      const link = await signedPhotoUrl(url, selectedProject?.id)
      if (!link) return null
      url = link

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
    // Only findings saved to the account: one still on this device has photos the adjuster could never open
    const captures = reportCaptures
    if (!selectedProject || captures.length === 0) return null
    let anyPhotoFileDetails = false
    if (includePhotos) pdfMissing.current = noMissingPdfAssets()

    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 18
    const contentWidth = pageWidth - margin * 2
    let y = margin

    function checkPage(needed: number) {
      y = ensureSpace(doc, y, needed, { pageHeight, margin })
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
          pdfMissing.current.logo = true
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
      const documentedParts = [`Documented: ${new Date(c.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`]
      const quantityText = quantityLabel(c.quantity, c.unit) // only the saved quantity and unit; nothing is added or converted
      if (quantityText) documentedParts.push(quantityText)
      doc.text(documentedParts.join("  |  "), margin + 10, y)
      y += 6

      // Field note (label stays on the same page as its text)
      if (c.field_note) {
        y = drawLabeledText(doc, y, { label: "FIELD NOTE", text: c.field_note, margin, contentWidth, geometry: { pageHeight, margin } })
      }

      // Supplement explanation in bordered box (label stays with the box)
      if (drafts[c.id]) {
        y = drawLabeledText(doc, y, { label: "SUPPLEMENT EXPLANATION", text: drafts[c.id], margin, contentWidth, geometry: { pageHeight, margin }, boxed: true })
      }

      // Photos (compressed for PDF to prevent memory crashes on large reports)
      if (includePhotos && urls.length > 0 && urls[0] !== "") {
        let photosLoaded = 0
        let photosLabelDrawn = false
        const drawPhotosLabel = () => {
          if (photosLabelDrawn) return
          checkPage(10)
          y = drawSectionLabel(doc, y, `SUPPORTING PHOTOS (${urls.length})`, margin, 4)
          photosLabelDrawn = true
        }

        for (let pi = 0; pi < urls.length; pi++) {
          const url = urls[pi]
          try {
            // Use compressed fetcher to keep PDF memory under control
            const dataUrl = await fetchImageForPdf(url, 800)
            if (!dataUrl) { pdfMissing.current.photos++; continue }
            const fmt = getImageFormat(dataUrl)
            const imgProps = doc.getImageProperties(dataUrl)
            const ratio = imgProps.height / imgProps.width
            const imgW = Math.min(contentWidth, 140)
            const imgH = imgW * ratio
            const cappedH = Math.min(imgH, 100)
            // Keep the label with the first photo: reserve room for both before drawing either
            checkPage((photosLabelDrawn ? 0 : 4) + cappedH + 12)
            drawPhotosLabel()
            // Photo border
            doc.setDrawColor(220, 220, 230)
            doc.setLineWidth(0.3)
            doc.rect(margin, y, imgW, cappedH)
            doc.addImage(dataUrl, fmt, margin, y, imgW, cappedH)
            y += cappedH + 2

            // Under each photo: its label (wide shot, close-up, marked-up copy) and the camera data read from the photo
            // file, labeled as such. The details list is aligned to the photos first, so a detail is never printed under
            // the wrong photo.
            const meta = alignMetadata(c.photo_metadata, urls.length)[pi]
            const lines = [`Photo ${pi + 1}${photoLabel(meta) ? ` – ${photoLabel(meta)}` : ""}`, photoFileDetails(meta)].filter(Boolean)
            if (photoFileDetails(meta)) anyPhotoFileDetails = true
            doc.setFontSize(6.5)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(120, 120, 130)
            for (const line of lines) {
              doc.text(doc.splitTextToSize(line, contentWidth) as string[], margin, y + 1)
              y += 3.5
            }
            y += 2
            photosLoaded++
          } catch {
            // Skip failed photo
          }
        }

        // If no photos loaded (CORS or fetch failure), show note
        if (photosLoaded === 0) {
          drawPhotosLabel()
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
          // Numbered pins the person placed, numbered like the findings above
          const pins = numberedPins(captures)
          for (const { n, pin } of pins) {
            const px = margin + pin.x * imgW
            const py = y + pin.y * cappedH
            doc.setFillColor(220, 38, 38)
            doc.setDrawColor(255, 255, 255)
            doc.setLineWidth(0.4)
            doc.circle(px, py, 2.6, "FD")
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(6.5)
            doc.setFont("helvetica", "bold")
            doc.text(String(n), px, py + 0.9, { align: "center" })
          }
          y += cappedH + 4
          if (pins.length > 0) {
            doc.setFontSize(7)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(120, 120, 130)
            doc.text("Numbered pins show where each finding was placed on the diagram by the person who prepared this report.", margin, y)
            y += 4
          }
        } else {
          pdfMissing.current.diagram = true
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
    doc.text(PDF_FOOTER_LINES[0], margin, y)
    y += 4
    doc.text(PDF_FOOTER_LINES[1], margin, y)
    y += 8
    // Where the photo dates and locations came from, whenever the report shows any
    if (anyPhotoFileDetails) {
      doc.setFontSize(7)
      const note = doc.splitTextToSize(PROVENANCE_NOTE, contentWidth) as string[]
      checkPage(note.length * 3.2 + 10)
      doc.text(note, margin, y)
      y += note.length * 3.2 + 4
      doc.setFontSize(8)
    }

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
    if (isFreeUser) { openUpgradeModal("pdf"); return }
    if (!selectedProject || reportCaptures.length === 0) return
    setPdfGenerating(true)
    try {
      const doc = await buildPdfDoc()
      if (!doc) return
      const missing = describeMissingPdfAssets(pdfMissing.current, "download")
      if (missing) { showNotice(missing); return }
      const safeName = selectedProject.project_name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")
      doc.save(`${safeName}-Report.pdf`)
      trackEvent("pdf_downloaded")
    } catch (err) {
      console.error("PDF generation failed:", err)
      showNotice(describeExportFailure("pdf"))
    } finally {
      setPdfGenerating(false)
    }
  }

  async function exportXactimate() {
    if (!isProUser) { openUpgradeModal("csv"); return }
    if (!selectedProject || reportCaptures.length === 0) return
    if (csvExporting.current) return // a second tap while the first export is still running does nothing
    csvExporting.current = true
    try {
      const res = await authFetch("/api/export-xactimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: selectedProject.project_name,
          propertyAddress: selectedProject.property_address || "",
          captures: reportCaptures.map(c => ({
            damage_type: c.damage_type,
            roof_area: c.roof_area,
            field_note: c.field_note,
            quantity: c.quantity ?? null,
            unit: c.unit || "",
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
      authFetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          projectId: selectedProjectId,
          action: "Xactimate CSV exported",
          details: `${reportCaptures.length} line items`,
        }),
      }).catch(() => {})
    } catch (err) {
      console.error("Xactimate export failed:", err)
      showNotice(describeExportFailure("csv"))
    } finally {
      csvExporting.current = false
    }
  }

  function openEmailModal(withDraft = false) {
    if (isFreeUser) { openUpgradeModal("email"); return }
    if (!selectedProject) return
    setEmailTo(selectedProject.adjuster_email || "")
    setEmailSubject(`Supplement Request – ${selectedProject.project_name}`)
    setEmailMessage(DEFAULT_REPORT_EMAIL_MESSAGE)
    if (withDraft && projectDraft.trim()) {
      setEmailMessage("Hello," + String.fromCharCode(10, 10) + projectDraft.trim() + String.fromCharCode(10, 10) + "Please see the attached report and supporting photos." + String.fromCharCode(10, 10) + "Thank you.")
    }
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
      const missingAssets = describeMissingPdfAssets(pdfMissing.current, "email")
      if (missingAssets) throw new Error(missingAssets)

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

      const res = await authFetch("/api/send-report", {
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
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      setEmailStatus("sent")
      const afterSend = statusAfterSend(selectedProject.claim_status)
      if (afterSend !== normalizeClaimStatus(selectedProject.claim_status)) void updateClaimStatus(afterSend, { silent: true })

      // Log activity
      authFetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          projectId: selectedProjectId,
          action: "Report emailed",
          details: `Sent to ${emailTo} — ${reportCaptures.length} findings`,
        }),
      }).catch(() => {})

      // Auto-update the findings that were in the report to "Sent"
      if (!readOnly) bulkUpdateStatus(reportCaptures.map((c) => c.id), "Sent")
    } catch (err) {
      setEmailStatus("error")
      setEmailError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setEmailSending(false)
    }
  }

  // Moves a job to a new claim stage. Updates the screen first, saves, and puts the old value back if the save fails.
  async function updateClaimStatus(next: ClaimStatus, opts: { silent?: boolean } = {}) {
    const project = projects.find((p) => p.id === selectedProjectId)
    if (!project) return
    const previous = project.claim_status
    if (normalizeClaimStatus(previous) === next && previous) return
    setClaimStatusError("")
    setSavingClaimStatus(true)
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, claim_status: next } : p)))
    try {
      const outcome = writeOutcome(await supabase.from("projects").update({ claim_status: next }).eq("id", project.id).select("id"))
      if (outcome !== "ok") throw new Error(outcome)
      if (!opts.silent && user) {
        authFetch("/api/activity-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, projectId: project.id, action: "Claim status changed", details: `${normalizeClaimStatus(previous)} to ${next}` }),
        }).catch(() => {})
      }
    } catch (err) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, claim_status: previous } : p)))
      setClaimStatusError(err instanceof Error && err.message === "refused" ? NOT_SAVED_NO_PERMISSION : "Could not save the status. Please try again.")
    } finally {
      setSavingClaimStatus(false)
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

  // Quantity can be a decimal such as 12.5; blank or zero counts as 1
  function quantityValue() {
    const n = parseFloat(quantity)
    return Number.isFinite(n) && n > 0 ? n : 1
  }

  // Accept any common photo format, even when the computer reports no file type
  const IMAGE_EXT = /\.(jpe?g|jfif|png|webp|gif|bmp|avif|heic|heif)$/i
  function looksLikeImage(file: File) {
    return file.type.startsWith("image/") || IMAGE_EXT.test(file.name)
  }
  function browserCanShow(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => { URL.revokeObjectURL(url); resolve(true) }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false) }
      img.src = url
    })
  }
  async function acceptImageFiles(list: File[]): Promise<{ ok: File[]; problem: string }> {
    const ok: File[] = []
    const notImages: string[] = []
    const cannotShow: string[] = []
    for (const file of list) {
      if (!looksLikeImage(file)) { notImages.push(file.name); continue }
      if (!(await browserCanShow(file))) { cannotShow.push(file.name); continue }
      ok.push(file)
    }
    let problem = ""
    if (notImages.length > 0) problem = "Only photos can be added (JPG, PNG, WEBP, GIF or HEIC)."
    if (cannotShow.length > 0) {
      problem = "This browser cannot open " + cannotShow[0] + ". Use a JPG or PNG. On iPhone: Settings, Camera, Formats, Most Compatible."
    }
    return { ok, problem }
  }

  async function addFiles(newFiles: File[]) {
    const { ok: imageFiles, problem } = await acceptImageFiles(newFiles)
    if (imageFiles.length === 0) {
      if (problem) setStatus(problem)
      return
    }

    const remaining = MAX_PHOTOS - files.length
    if (remaining <= 0) {
      setStatus(`Maximum ${MAX_PHOTOS} photos per capture.`)
      return
    }
    const toAdd = imageFiles.slice(0, remaining)
    if (toAdd.length < imageFiles.length) {
      setStatus(`Only ${remaining} more photo${remaining !== 1 ? "s" : ""} allowed. ${imageFiles.length - toAdd.length} skipped.`)
    } else {
      setStatus(problem)
    }
    setFiles((prev) => [...prev, ...toAdd])
    setShots((prev) => [...prev, ...toAdd.map(() => null)])
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
    setShots((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleShot(index: number, shot: ShotType) {
    setShots((prev) => prev.map((s, i) => (i === index ? (s === shot ? null : shot) : s)))
  }

  function resetCaptureForm() {
    previews.forEach((p) => URL.revokeObjectURL(p))
    setFiles([])
    setShots([])
    setPreviews([])
    setDamageType("")
    setRoofArea("")
    setFieldNote("")
    setQuantity("1")
    setUnit("")
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (isFreeUser) {
      const { count } = await supabase
        .from("captures")
        .select("*", { count: "exact", head: true })
        .eq("project_id", selectedProjectId)
      if ((count || 0) >= FREE_CAPTURE_LIMIT) {
        openUpgradeModal("capture_limit")
        return
      }
    }

    if (!selectedProjectId) {
      setStatus("Please select or create a project first.")
      return
    }
    // A finding needs a photo or a note (a note-only finding is fine)
    if (files.length === 0 && !fieldNote.trim()) {
      setStatus("Add at least one photo or a field note.")
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

    // Step 1: Extract EXIF metadata BEFORE compression (compression strips it)
    if (files.length > 0) setStatus("Reading photo metadata...")
    // The optional wide/close-up tag travels with each photo's camera data
    const photoMetadata: (PhotoDetails | null)[] = (await extractAllExifData(files)).map((m, i) => ({ ...m, shot: shots[i] ?? null }))

    // One id for this save, used both for the device queue entry and (through serverCaptureId) for the saved row. A save
    // that reached the server but whose answer was lost is then found by the queued retry instead of saved twice.
    const queueId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const rowId = await serverCaptureId(queueId)

    // Keeps the whole finding, with every original photo, in this device's queue. The form is cleared only once the
    // queue has it; if the device cannot store it either, everything stays in the form.
    async function keepOnDevice(message: string): Promise<boolean> {
      try {
        const photoBuffers = await Promise.all(files.map((f) => fileToArrayBuffer(f)))
        await queueCapture({
          id: queueId,
          userId: user?.id,
          projectId: selectedProjectId,
          damageType,
          roofArea,
          fieldNote,
          quantity: quantityValue(),
          unit: unit || "",
          photos: photoBuffers,
          photoNames: files.map((f) => f.name),
          photoMetadata,
          createdAt: new Date().toISOString(),
        })
      } catch {
        setStatus("This finding could not be saved, not even on this device. Your photos and note are still in the form. Try again.")
        setSaving(false)
        return false
      }
      getPendingCount(user?.id).then(setPendingQueueCount).catch(() => {})
      setStatus(message)
      resetCaptureForm()
      setSaving(false)
      await loadCaptures(selectedProjectId)
      return true
    }

    // Step 2: Offline: keep it on the device. Nothing has reached the account yet, and the message says so.
    if (!navigator.onLine) {
      setStatus("Offline — saving to this device...")
      await keepOnDevice("Saved on this device only, not to your account yet. It uploads automatically when you have a connection. Do not clear this browser's site data until it does.")
      return
    }

    // Step 3: Compress and upload
    if (files.length > 0) setStatus(`Compressing ${files.length} photo${files.length !== 1 ? "s" : ""}...`)
    const compressed = await Promise.all(files.map((f) => compressImage(f)))
    if (files.length > 0) setStatus(`Uploading ${compressed.length} photo${compressed.length !== 1 ? "s" : ""}...`)
    const { urls: uploadedUrls, failedIndexes } = await uploadPhotosWithRetry(
      compressed,
      3,
      (uploaded, total) => setStatus(`Uploaded ${uploaded}/${total} photos...`)
    )

    // Any photo that would not upload: the finding is not saved with some photos missing. The photos that did upload are
    // removed again and the whole finding is kept on the device, to upload with all its photos on a later attempt.
    if (failedIndexes.length > 0) {
      if (uploadedUrls.length > 0) {
        const notConfirmed = await cleanupOrphanedUploads(uploadedUrls)
        if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The finding was kept on this device")
      }
      await keepOnDevice(
        `${failedIndexes.length} of ${files.length} photo${files.length !== 1 ? "s" : ""} did not upload, so this finding is saved on this device only for now. It is retried automatically with all its photos; you can also press Sync Now.`,
      )
      return
    }
    setStatus("Saving capture...")

    // Step 5: Insert capture record with EXIF metadata
    const fullRow = {
      id: rowId,
      project_id: selectedProjectId,
      image_url: uploadedUrls[0] || "",
      image_urls: uploadedUrls,
      damage_type: damageType,
      roof_area: roofArea,
      field_note: fieldNote,
      status: "Captured",
      quantity: quantityValue(),
      unit: unit || null,
      photo_metadata: alignMetadata(photoMetadata, uploadedUrls.length),
    }
    const coreRow = {
      id: rowId,
      project_id: selectedProjectId,
      image_url: uploadedUrls[0] || "",
      image_urls: uploadedUrls,
      damage_type: damageType,
      roof_area: roofArea,
      field_note: fieldNote,
    }

    let { error: insertError } = await supabase
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
    }

    if (insertError && isNetworkFailure(insertError.message)) {
      // The connection dropped. The row may or may not have been saved before the answer was lost, so ask once.
      const saved = await savedState(rowId, selectedProjectId)
      if (saved.state !== "yes") {
        // Only photos that are certainly unused are removed. If the answer is unknown, they are kept: the saved row
        // might point at them, and the queued retry will find that row by its id rather than save a second copy.
        if (saved.state === "no") {
          const notConfirmed = await cleanupOrphanedUploads(uploadedUrls)
          if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The finding was kept on this device")
        }
        await keepOnDevice("The connection dropped before the finding reached your account, so it is saved on this device only for now. It is retried automatically; you can also press Sync Now.")
        return
      }
      insertError = null // it was saved; the answer was lost on the way back
    }

    if (insertError) {
      // Refused by the account (for example the project was deleted): remove the uploads; the form keeps everything
      const notConfirmed = await cleanupOrphanedUploads(uploadedUrls)
      if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The capture was not saved")
      setStatus(`Save failed: ${insertError.message}`)
      setSaving(false)
      return
    }

    setStatus("Saved to your account.")
    setSavedFlash(true)

    // Log activity (fire-and-forget)
    authFetch("/api/activity-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProjectId,
        action: "Capture added",
        details: `${damageType} — ${roofArea}${fieldNote ? ": " + fieldNote.substring(0, 50) : ""}`,
      }),
    }).catch(() => {})

    resetCaptureForm()
    setSaving(false)

    await loadCaptures(selectedProjectId)
  }

  // ---- Add photos to a saved finding (works for findings that had none, and to add more)
  async function addPhotosToCapture(c: Capture, list: FileList | null) {
    if (!list || list.length === 0) return
    const say = (text: string) => setCardMsg((prev) => ({ ...prev, [c.id]: text }))
    const existing = (c.image_urls && c.image_urls.length > 0 ? c.image_urls : c.image_url ? [c.image_url] : []).filter(Boolean)
    const room = MAX_PHOTOS - existing.length
    if (room <= 0) { say(`This finding already has ${MAX_PHOTOS} photos.`); return }
    if (!navigator.onLine) { say("You are offline. Connect to add photos to a saved finding."); return }
    const { ok, problem } = await acceptImageFiles(Array.from(list))
    if (ok.length === 0) { say(problem || "No photo was added."); return }
    const chosen = ok.slice(0, room)
    setCardBusy((prev) => ({ ...prev, [c.id]: true }))
    say(chosen.length > 1 ? "Adding photos..." : "Adding photo...")
    try {
      const meta = await extractAllExifData(chosen)
      const compressed = await Promise.all(chosen.map((file) => compressImage(file)))
      const { urls, failedIndexes } = await uploadPhotosWithRetry(compressed, 3)
      if (urls.length === 0) throw new Error("The upload failed. Check your connection and try again.")
      // Details only for the photos that uploaded, after the existing ones lined up with the existing photos
      const { urls: all, meta: nextMeta } = appendPhotos(existing, c.photo_metadata, urls, metadataForUploaded(meta, failedIndexes))
      let res = await supabase.from("captures").update({ image_url: all[0], image_urls: all, photo_metadata: nextMeta }).eq("id", c.id).select("id")
      if (res.error?.message?.includes("schema cache")) {
        res = await supabase.from("captures").update({ image_url: all[0], image_urls: all }).eq("id", c.id).select("id")
      }
      const outcome = writeOutcome(res)
      if (outcome !== "ok") {
        // Remove only the photos uploaded for this attempt, and say so if that could not be confirmed
        const notConfirmed = await cleanupOrphanedUploads(urls)
        if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The photo was not added")
        throw new Error(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : res.error?.message || "Could not add the photo.")
      }
      setCaptures((prev) => prev.map((x) => (x.id === c.id ? { ...x, image_url: all[0], image_urls: all, photo_metadata: nextMeta } : x)))
      say(failedIndexes.length > 0 ? `${urls.length} added, ${failedIndexes.length} failed. You can try those again.` : urls.length > 1 ? "Photos added." : "Photo added.")
    } catch (err) {
      say(err instanceof Error ? err.message : "Could not add the photo.")
    } finally {
      setCardBusy((prev) => ({ ...prev, [c.id]: false }))
      setTimeout(() => setCardMsg((prev) => ({ ...prev, [c.id]: "" })), 5000)
    }
  }

  // ---- Remove one photo from a saved finding (to swap in the right one)
  async function removePhotoFromCapture(c: Capture, url: string) {
    if (!confirm("Remove this photo? You can add a different one afterwards.")) return
    const say = (text: string) => setCardMsg((prev) => ({ ...prev, [c.id]: text }))
    const existing = (c.image_urls && c.image_urls.length > 0 ? c.image_urls : c.image_url ? [c.image_url] : []).filter(Boolean)
    const idx = existing.indexOf(url)
    if (idx === -1) return
    const { urls: all, meta: nextMeta } = removePhotoAt(existing, c.photo_metadata, idx)
    let res = await supabase.from("captures").update({ image_url: all[0] || "", image_urls: all, photo_metadata: nextMeta }).eq("id", c.id).select("id")
    if (res.error?.message?.includes("schema cache")) {
      res = await supabase.from("captures").update({ image_url: all[0] || "", image_urls: all }).eq("id", c.id).select("id")
    }
    const outcome = writeOutcome(res)
    if (outcome !== "ok") { say(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : `Could not remove the photo: ${res.error?.message}`); return }
    const { notConfirmed } = await removePhotoFiles(supabase.storage.from("test-uploads"), photoPathsForCaptures([{ image_url: url }]))
    setCaptures((prev) => prev.map((x) => (x.id === c.id ? { ...x, image_url: all[0] || "", image_urls: all, photo_metadata: nextMeta } : x)))
    if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The photo was removed from the finding")
    say(all.length === 0 ? "Photo removed. Tap the box to add the right one." : notConfirmed.length > 0 ? "Photo removed from the finding." : "Photo removed.")
    setTimeout(() => setCardMsg((prev) => ({ ...prev, [c.id]: "" })), 5000)
  }

  // ---- Add a marked-up copy as one more photo of the finding. The original photo is left exactly as it was.
  // If the copy cannot be added (offline, photo limit, upload or save refused) it is downloaded instead, so the marks are not lost.
  function downloadDataUrl(dataUrl: string) {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "marked-up-photo.jpg"
    a.click()
  }

  async function addMarkedUpCopy(dataUrl: string) {
    const target = annotateTarget
    const c = target ? captures.find((x) => x.id === target.captureId) : undefined
    if (!target || !c || c.localOnly || readOnly) {
      downloadDataUrl(dataUrl)
      return
    }
    const say = (text: string) => setCardMsg((prev) => ({ ...prev, [c.id]: text }))
    const existing = photoUrlsOf(c)
    if (existing.length >= MAX_PHOTOS) {
      downloadDataUrl(dataUrl)
      showNotice(`This finding already has ${MAX_PHOTOS} photos, so the marked-up copy was downloaded to this device instead.`)
      return
    }
    if (!navigator.onLine) {
      downloadDataUrl(dataUrl)
      showNotice("You are offline, so the marked-up copy was downloaded to this device instead of being added to the finding.")
      return
    }
    setCardBusy((prev) => ({ ...prev, [c.id]: true }))
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const { urls } = await uploadPhotosWithRetry([blob], 3)
      if (urls.length === 0) throw new Error("upload")
      const { urls: all, meta } = appendPhotos(existing, c.photo_metadata, urls, [{ markupOf: target.photoIndex }])
      const res = await supabase.from("captures").update({ image_url: all[0], image_urls: all, photo_metadata: meta }).eq("id", c.id).select("id")
      if (writeOutcome(res) !== "ok") {
        const notConfirmed = await cleanupOrphanedUploads(urls)
        if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The marked-up copy was not added")
        throw new Error("save")
      }
      setCaptures((prev) => prev.map((x) => (x.id === c.id ? { ...x, image_url: all[0], image_urls: all, photo_metadata: meta } : x)))
      say(`Marked-up copy added as photo ${all.length}. Photo ${target.photoIndex + 1} is unchanged.`)
      setTimeout(() => setCardMsg((prev) => ({ ...prev, [c.id]: "" })), 6000)
    } catch {
      downloadDataUrl(dataUrl)
      showNotice("The marked-up copy could not be added to the finding, so it was downloaded to this device instead.")
    } finally {
      setCardBusy((prev) => ({ ...prev, [c.id]: false }))
      setAnnotateTarget(null)
    }
  }

  function openAnnotator(c: Capture, url: string, photoIndex: number) {
    if (isFreeUser) { openUpgradeModal("annotate"); return }
    void signedPhotoUrl(url, selectedProject?.id).then((link) => {
      if (!link) { showNotice("The photo could not be loaded, so it cannot be marked up right now. Try again in a moment."); return }
      setAnnotateTarget({ captureId: c.id, photoIndex })
      setAnnotateUrl(link)
      setAnnotateOpen(true)
    })
  }

  // ---- Report order (needs supabase-migration-v16). Every position is saved before the screen changes; if any save
  // fails, the ones that did save are put back so the stored order is never half-changed.
  async function moveFinding(id: string, direction: -1 | 1) {
    if (reordering || readOnly) return
    const updates = moveInReport(reportCaptures, id, direction)
    if (updates.length === 0) return
    setReordering(true)
    const before = new Map(reportCaptures.map((c) => [c.id, c.report_order ?? null]))
    const done: string[] = []
    let failed = false
    for (const u of updates) {
      const ok = writeOutcome(await supabase.from("captures").update({ report_order: u.report_order }).eq("id", u.id).select("id")) === "ok"
      if (!ok) { failed = true; break }
      done.push(u.id)
    }
    if (failed) {
      for (const d of done) await supabase.from("captures").update({ report_order: before.get(d) ?? null }).eq("id", d).select("id")
      showNotice("The new order was not saved. Check your connection and try again.")
    } else {
      const next = new Map(updates.map((u) => [u.id, u.report_order]))
      setCaptures((prev) => prev.map((c) => (next.has(c.id) ? { ...c, report_order: next.get(c.id) } : c)))
    }
    setReordering(false)
  }

  // ---- Roof-diagram pin for one finding (needs supabase-migration-v16)
  async function saveDiagramPin(captureId: string, pin: Pin | null): Promise<string> {
    const outcome = writeOutcome(await supabase.from("captures").update({ diagram_pin: pin }).eq("id", captureId).select("id"))
    if (outcome !== "ok") return outcome === "refused" ? NOT_SAVED_NO_PERMISSION : "The pin was not saved. Check your connection and try again."
    setCaptures((prev) => prev.map((c) => (c.id === captureId ? { ...c, diagram_pin: pin } : c)))
    return ""
  }

  // ---- Shared capture switch for one project (owner only; needs supabase-migration-v17). The screen changes only once saved.
  async function saveTeamCapture(on: boolean) {
    if (!selectedProjectId || readOnly) return
    setSavingTeamCapture(true)
    const outcome = writeOutcome(await supabase.from("projects").update({ team_capture: on }).eq("id", selectedProjectId).select("id"))
    setSavingTeamCapture(false)
    if (outcome !== "ok") { showNotice(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : "Not saved. Check your connection and try again."); return }
    setProjects((prev) => prev.map((p) => (p.id === selectedProjectId ? { ...p, team_capture: on } : p)))
  }

  // ---- Requested/approved amounts and follow-up date, as typed by the person (needs supabase-migration-v16)
  async function saveTracking(patch: TrackingPatch): Promise<string> {
    if (!selectedProjectId) return "Choose a project first."
    const outcome = writeOutcome(await supabase.from("projects").update(patch).eq("id", selectedProjectId).select("id"))
    if (outcome !== "ok") return outcome === "refused" ? NOT_SAVED_NO_PERMISSION : "Not saved. Check your connection and try again."
    setProjects((prev) => prev.map((p) => (p.id === selectedProjectId ? { ...p, ...patch } : p)))
    return ""
  }

  // ---- Edit a saved finding (damage type, area, quantity, unit, note)
  function startEditCapture(c: Capture) {
    setEditingCaptureId(c.id)
    setEditForm({
      damage_type: c.damage_type,
      roof_area: c.roof_area,
      field_note: c.field_note || "",
      quantity: String(c.quantity ?? 1),
      unit: c.unit || "",
    })
  }

  async function saveEditCapture(c: Capture) {
    const say = (text: string) => setCardMsg((prev) => ({ ...prev, [c.id]: text }))
    if (!editForm.damage_type || !editForm.roof_area) { say("Choose a damage type and a roof area."); return }
    const qty = parseFloat(editForm.quantity)
    const patch = {
      damage_type: editForm.damage_type,
      roof_area: editForm.roof_area,
      field_note: editForm.field_note.trim(),
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      unit: editForm.unit || null,
    }
    setCardBusy((prev) => ({ ...prev, [c.id]: true }))
    const res = await supabase.from("captures").update(patch).eq("id", c.id).select("id")
    setCardBusy((prev) => ({ ...prev, [c.id]: false }))
    const outcome = writeOutcome(res)
    if (outcome !== "ok") { say(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : `Could not save: ${res.error?.message}`); return }
    setCaptures((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...patch } : x)))
    setEditingCaptureId(null)
    say(drafts[c.id] ? "Saved. Regenerate the draft so it matches your changes." : "Saved.")
    setTimeout(() => setCardMsg((prev) => ({ ...prev, [c.id]: "" })), 6000)
  }

  // ---- Edit the AI drafts by hand
  async function saveCaptureDraftEdit(c: Capture) {
    const text = cleanAi(editingDraftText)
    const res = await supabase.from("captures").update({ draft: text }).eq("id", c.id).select("id")
    const outcome = writeOutcome(res)
    if (outcome !== "ok") { setCardMsg((prev) => ({ ...prev, [c.id]: outcome === "refused" ? NOT_SAVED_NO_PERMISSION : `Could not save: ${res.error?.message}` })); return }
    setDrafts((prev) => ({ ...prev, [c.id]: text }))
    setEditingDraftId(null)
  }

  async function saveProjectDraftEdit() {
    if (!selectedProjectId) return
    const text = cleanAi(editingDraftText)
    const res = await supabase.from("projects").update({ last_draft: text }).eq("id", selectedProjectId).select("id")
    const outcome = writeOutcome(res)
    if (outcome !== "ok") { setProjectDraftError(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : `Could not save: ${res.error?.message}`); return }
    setProjectDraft(text)
    setSavedProjectDraft(text)
    setEditingDraftId(null)
  }

  // ---- Word (.docx) copy of the project draft, for people who want to edit it in Word
  async function downloadProjectDraftWord() {
    const project = projects.find((p) => p.id === selectedProjectId)
    if (!project || !projectDraft) return
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx")
    const body = cleanAi(projectDraft)
      .split(/\n{2,}/)
      .map((t) => new Paragraph({ children: [new TextRun(t.replace(/\n/g, " "))], spacing: { after: 200 } }))
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "Supplement Narrative", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun({ text: project.project_name, bold: true })] }),
            new Paragraph({ children: [new TextRun(project.property_address || "")], spacing: { after: 300 } }),
            ...body,
          ],
        },
      ],
    })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const safe = (project.project_name || "project").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")
    a.href = url
    a.download = `${safe}-Supplement-Draft.docx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  // A project that belongs to someone else (a team owner's) can be viewed, but only its owner can change it
  const readOnly = !!selectedProject && !!selectedProject.user_id && !!user && selectedProject.user_id !== user.id
  // A team member may add findings (only add) when the owner has switched shared capture on for this project.
  // The database decides for real (supabase-migration-v17); this only decides whether to show the capture form.
  const canContribute = readOnly && selectedProject?.team_capture === true
  const authorLabel = (c: Capture) => {
    if (!hasColumn(c, "created_by") || !c.created_by || !selectedProject) return ""
    if (c.created_by === user?.id) return readOnly ? "Added by you" : ""
    if (c.created_by === selectedProject.user_id) return "Added by the owner"
    return "Added by a team member"
  }
  const filteredProjects = filterProjects(projects, projectQuery, claimFilter)
  const listedProjects =
    selectedProject && !filteredProjects.some((p) => p.id === selectedProject.id) ? [selectedProject, ...filteredProjects] : filteredProjects

  if (authLoading || subscriptionLoading || !user) return null

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* App header */}
      <header className="mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            S
          </div>
          <div>
            <h1 className="whitespace-nowrap text-base font-bold tracking-tight sm:text-2xl">Supplement Snap</h1>
            <p className="hidden text-sm text-zinc-500 sm:block">
              Capture roof damage during tear-off and generate supplement drafts
            </p>
          </div>
        </Link>
        <div className="flex flex-none items-center gap-2 whitespace-nowrap sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden min-h-10 items-center px-1 text-xs font-medium text-zinc-600 hover:text-zinc-800 sm:inline-flex"
          >
            Dashboard
          </Link>
          <Link
            href="/account"
            className="inline-flex min-h-10 items-center px-1 text-xs font-medium text-zinc-600 hover:text-zinc-800"
          >
            Account
          </Link>
          <button
            onClick={async () => {
              // Findings still on this device stay here (they are the only copy) but are not uploaded while signed out
              if (pendingQueueCount > 0 && !confirm(`${pendingQueueCount} finding${pendingQueueCount !== 1 ? "s have" : " has"} not uploaded yet. ${pendingQueueCount !== 1 ? "They stay" : "It stays"} on this device and upload${pendingQueueCount !== 1 ? "" : "s"} when you sign in again here. Another account on this device will not see or upload ${pendingQueueCount !== 1 ? "them" : "it"}. If this browser's data is cleared first, ${pendingQueueCount !== 1 ? "they are" : "it is"} lost. Log out anyway?`)) return
              await signOut()
              router.push("/")
            }}
            className="inline-flex min-h-10 items-center px-1 text-xs font-medium text-zinc-600 hover:text-zinc-800"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Subtle save status */}
      {(saving || syncing || savedFlash) && (
        <p role="status" aria-live="polite" className="mb-2 text-right text-xs text-zinc-500">
          {saving ? "Saving..." : syncing ? "Syncing..." : "✓ Saved"}
        </p>
      )}

      {/* Offline / sync status banner */}
      {!isOnline && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728" />
          </svg>
          <span className="font-medium">You&apos;re offline.</span> Captures will be saved to your device and auto-sync when connection returns.
        </div>
      )}
      {syncing && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-700">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Syncing offline captures...
        </div>
      )}
      {refusedItems.length > 0 && (
        <div role="status" data-testid="refused-banner" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {refusedItems.length} finding{refusedItems.length !== 1 ? "s were" : " was"} not uploaded because your access to add findings to {refusedItems.length !== 1 ? "their project was" : "its project was"} removed. {refusedItems.length !== 1 ? "They are" : "It is"} kept only on this device and will not be uploaded anywhere else.
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => { if (confirm(`Discard ${refusedItems.length} finding${refusedItems.length !== 1 ? "s" : ""} and ${refusedItems.length !== 1 ? "their" : "its"} photos from this device? This cannot be undone.`)) void discardFromDevice(refusedItems.map((r) => r.id)) }}
          >
            Discard from this device
          </button>
        </div>
      )}
      {isOnline && !syncing && (
        <OfflineSyncBanner waiting={pendingQueueCount} stuck={cappedQueueCount} onSyncNow={() => window.dispatchEvent(new Event("ss-manual-sync"))} />
      )}

      {user && projects.length > 0 && (
        <StartHere key={user.id} userId={user.id} hiddenOnAccount={user.user_metadata?.ss_start_here_hidden === true} onlyDemoOrNone={isFirstRun(projects)} onCreateProject={() => setShowNewProject(true)} isFreeUser={isFreeUser} freeCaptureLimit={FREE_CAPTURE_LIMIT} />
      )}

      {/* Project selector */}
      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label htmlFor="project-select" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Project / Job
        </label>
        {projects.length >= 2 && (
          <ClaimsOverview projects={projects} query={projectQuery} onQuery={setProjectQuery} filter={claimFilter} onFilter={setClaimFilter} matchCount={filteredProjects.length} />
        )}
        <div className="flex gap-2">
          <select id="project-select"
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setShowNewProject(false)
            }}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select a project...</option>
            {listedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name} ({normalizeClaimStatus(p.claim_status)})
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
              <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="py-2 text-left hover:text-indigo-600 transition-colors"
                title="View on map"
              >
                {selectedProject.property_address || "No address"}
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {captures.length} capture{captures.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              {!editingClaim ? (
                <>
                  {readOnly && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">View only</span>}
                  <ClaimStatusSelect readOnly={readOnly} value={selectedProject.claim_status} onChange={(n) => updateClaimStatus(n)} saving={savingClaimStatus} error={claimStatusError} />
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
                  {!readOnly && <button
                    type="button"
                    onClick={() => {
                      setEditClaimData({
                        insurance_company: selectedProject.insurance_company || "",
                        claim_number: selectedProject.claim_number || "",
                        policy_number: selectedProject.policy_number || "",
                        adjuster_name: selectedProject.adjuster_name || "",
                        adjuster_email: selectedProject.adjuster_email || "",
                        date_of_loss: selectedProject.date_of_loss || "",
                      })
                      setEditingClaim(true)
                    }}
                    className="-my-2 px-2 py-2 font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {selectedProject.insurance_company || selectedProject.claim_number ? "Edit" : "+ Add Claim Info"}
                  </button>}
                </>
              ) : (
                <div className="w-full space-y-2 pt-1">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input value={editClaimData.insurance_company} onChange={(e) => setEditClaimData(d => ({ ...d, insurance_company: e.target.value }))} placeholder="Insurance company" className="rounded border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400" />
                    <input value={editClaimData.claim_number} onChange={(e) => setEditClaimData(d => ({ ...d, claim_number: e.target.value }))} placeholder="Claim number" className="rounded border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400" />
                    <input value={editClaimData.policy_number} onChange={(e) => setEditClaimData(d => ({ ...d, policy_number: e.target.value }))} placeholder="Policy number" className="rounded border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400" />
                    <input value={editClaimData.adjuster_name} onChange={(e) => setEditClaimData(d => ({ ...d, adjuster_name: e.target.value }))} placeholder="Adjuster name" className="rounded border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400" />
                    <input value={editClaimData.adjuster_email} onChange={(e) => setEditClaimData(d => ({ ...d, adjuster_email: e.target.value }))} placeholder="Adjuster email" className="rounded border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400" />
                  </div>
                  <input type="date" value={editClaimData.date_of_loss} onChange={(e) => setEditClaimData(d => ({ ...d, date_of_loss: e.target.value }))} className="rounded border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setClaimSaveError("")
                        const claimRes = await supabase.from("projects").update({
                          insurance_company: editClaimData.insurance_company || null,
                          claim_number: editClaimData.claim_number || null,
                          adjuster_name: editClaimData.adjuster_name || null,
                          policy_number: editClaimData.policy_number || null,
                          adjuster_email: editClaimData.adjuster_email || null,
                          date_of_loss: editClaimData.date_of_loss || null,
                        }).eq("id", selectedProject.id).select("id")
                        const claimOutcome = writeOutcome(claimRes)
                        if (claimOutcome !== "ok") {
                          setClaimSaveError(claimOutcome === "refused" ? NOT_SAVED_NO_PERMISSION : "Could not save the claim details. Check your connection and try again.")
                          return
                        }
                        setProjects((prev) => prev.map((p) => p.id === selectedProject.id ? { ...p, ...editClaimData } : p))
                        setEditingClaim(false)
                      }}
                      className="rounded bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Save
                    </button>
                    <button type="button" onClick={() => { setClaimSaveError(""); setEditingClaim(false) }} className="rounded border border-zinc-300 px-4 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                      Cancel
                    </button>
                  </div>
                  {claimSaveError && <p role="alert" className="text-xs text-red-600">{claimSaveError}</p>}
                </div>
              )}
            </div>
            {hasColumn(selectedProject, "amount_requested") && (
              <ClaimTracking key={selectedProject.id} project={selectedProject} readOnly={readOnly} onSave={saveTracking} remindersAvailable={process.env.NEXT_PUBLIC_FOLLOWUP_REMINDERS === "true" && hasColumn(selectedProject, "reminder_opt_in")} />
            )}
            {!readOnly && isProUser && hasColumn(selectedProject, "team_capture") && (
              <label className="mt-2 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400" data-testid="team-capture-toggle">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                  checked={selectedProject.team_capture === true}
                  disabled={savingTeamCapture}
                  onChange={(e) => void saveTeamCapture(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Team members can add findings to this project.</span> They can add findings and photos but not edit or delete any finding or change claim details. Off by default for every project.
                </span>
              </label>
            )}
            {/* Diagram upload */}
            <div className="flex items-center gap-2 pt-1">
              {selectedProject.diagram_url ? (
                <div className="flex items-center gap-2">
                  <a href={selectedProject.diagram_url} onClick={(e) => { e.preventDefault(); void openStoredFile(selectedProject.diagram_url as string, selectedProject.id).then((ok) => { if (!ok) showNotice("The diagram could not be opened. Try again in a moment.") }) }} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Roof Diagram
                  </a>
                  {!readOnly && <button
                    type="button"
                    onClick={async () => {
                      const pinned = reportCaptures.filter((c) => normalizePin(c.diagram_pin))
                      if (!confirm(pinned.length > 0 ? `Remove this diagram? The ${pinned.length} pin${pinned.length !== 1 ? "s" : ""} placed on it will be removed too, because they would not match a different diagram.` : "Remove this diagram?")) return
                      // Pins are positions on this diagram, so they go with it. They are cleared first: if that fails, the
                      // diagram stays, and nothing is left pointing at a diagram that is gone.
                      if (pinned.length > 0) {
                        const cleared = writeOutcome(await supabase.from("captures").update({ diagram_pin: null }).eq("project_id", selectedProject.id).not("diagram_pin", "is", null).select("id"))
                        if (cleared !== "ok") { showNotice(cleared === "refused" ? NOT_SAVED_NO_PERMISSION : "The diagram was not removed. Check your connection and try again."); return }
                        setCaptures((prev) => prev.map((c) => (c.project_id === selectedProject.id ? { ...c, diagram_pin: null } : c)))
                      }
                      const outcome = writeOutcome(await supabase.from("projects").update({ diagram_url: null }).eq("id", selectedProject.id).select("id"))
                      if (outcome !== "ok") { showNotice(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : "The diagram was not removed. Check your connection and try again."); return }
                      setProjects((prev) => prev.map((p) => p.id === selectedProject.id ? { ...p, diagram_url: undefined } : p))
                    }}
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-red-50 text-zinc-500 hover:text-red-500"
                    title="Remove diagram"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>}
                </div>
              ) : !readOnly ? (
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
                        const ext = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toLowerCase()
                        const fileName = `diagrams/${Date.now()}-${crypto.randomUUID()}.${ext}`
                        const { error: uploadError } = await supabase.storage.from("test-uploads").upload(fileName, file)
                        if (uploadError) throw uploadError
                        const { data: urlData } = supabase.storage.from("test-uploads").getPublicUrl(fileName)
                        const outcome = writeOutcome(await supabase.from("projects").update({ diagram_url: urlData.publicUrl }).eq("id", selectedProject.id).select("id"))
                        if (outcome !== "ok") {
                          // Remove only the diagram uploaded for this attempt, and say so if that could not be confirmed
                          const notConfirmed = await cleanupOrphanedUploads([urlData.publicUrl])
                          if (notConfirmed.length > 0) reportUnremovedFiles(notConfirmed, selectedProjectId, "The diagram was not saved")
                          else showNotice(outcome === "refused" ? NOT_SAVED_NO_PERMISSION : "The diagram was not saved. Check your connection and try again.")
                          return
                        }
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
                    className="inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-indigo-600 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    {diagramUploading ? "Uploading..." : "Upload Roof Diagram / EagleView"}
                  </button>
                </>
              ) : null}
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
                        className="inline-flex min-h-10 items-center px-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Open in Google Maps
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowMap(false); setAddressSuggestions([]); setAddressSearch("") }}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-600"
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
                      aria-label="Property address"
                      readOnly={readOnly}
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
                    {!readOnly && <button
                      type="button"
                      onClick={() => { if (addressSearch.trim()) selectAddress(addressSearch.trim()) }}
                      className="rounded bg-indigo-600 px-3 py-2.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Update
                    </button>}
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
                          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      {selectedProject && reportCaptures.length > 0 && (
        <section className="mb-8">
          {!projectDraft && !projectDraftLoading && (
            <button
              type="button"
              onClick={generateProjectDraft}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              {/* The draft is written from the findings saved to the account, so only those are counted */}
              Generate Project Draft ({reportCaptures.length} capture
              {reportCaptures.length !== 1 ? "s" : ""})
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
              <p className="text-sm text-red-700 dark:text-red-400">{projectDraftError}</p>
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
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {/* Collapsible header */}
              <button
                type="button"
                onClick={() => setDraftExpanded(!draftExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Project Supplement Draft
                  </p>
                  {projectDraft && projectDraft === savedProjectDraft
                    ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Saved</span>
                    : <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">Draft generated</span>}
                </div>
                <svg className={`h-4 w-4 text-zinc-500 transition-transform ${draftExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {draftExpanded && (
              <div className="px-5 pb-5">

              {/* Findings summary */}
              <div className="mb-4 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                <p className="mb-2 text-xs font-medium text-zinc-500">
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
                {editingDraftId === "project" ? (
                  <div>
                    <textarea
                      rows={16}
                      value={editingDraftText}
                      onChange={(e) => setEditingDraftText(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={saveProjectDraftEdit} className="rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-indigo-500">Save changes</button>
                      <button type="button" onClick={() => setEditingDraftId(null)} className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {projectDraft}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(projectDraft)
                    setProjectDraftCopied(true)
                    setTimeout(() => setProjectDraftCopied(false), 2000)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {projectDraftCopied ? "Copied!" : "Copy Draft"}
                </button>
                <button
                  type="button"
                  onClick={generateProjectDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                >
                  Regenerate
                </button>
                {editingDraftId !== "project" && !readOnly && (
                  <button
                    type="button"
                    onClick={() => { setEditingDraftId("project"); setEditingDraftText(projectDraft) }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { void downloadProjectDraftWord() }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Word (.docx)
                </button>
                <button
                  type="button"
                  onClick={() => openEmailModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Email to adjuster
                </button>
                <span className="inline-flex items-center gap-1 text-xs text-green-700">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-saved
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-500">Written by AI from your findings. Read it and edit anything before you send it to an adjuster.</p>
              </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Damage Checklist Reminder — subtle hint */}
      {selectedProject && captures.length > 0 && !showReport && (() => {
        const documented = new Set(captures.map(c => c.damage_type))
        const common = ["Decking", "Flashing", "Ice & Water", "Vent / Pipe Boot", "Drip Edge"]
        const unchecked = common.filter(d => !documented.has(d))
        if (unchecked.length === 0 || unchecked.length === common.length) return null
        return (
          <div className="mb-4 flex items-center gap-2 px-1 text-xs text-zinc-500">
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Not yet documented: {unchecked.join(", ")}</span>
          </div>
        )
      })()}

      {/* Generate Project Report button */}
      {selectedProject && reportCaptures.length > 0 && !showReport && (
        <section className="sticky bottom-3 z-20 mb-8">
          <button
            type="button"
            onClick={generateReport}
            disabled={reportLoading}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 shadow-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
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
                Generate Project Report ({reportCaptures.length} finding{reportCaptures.length !== 1 ? "s" : ""})
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
                className="text-xs text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
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

            {reportCaptures.length > 0 && (() => {
              const noPhoto = reportCaptures.filter((c) => photoUrlsOf(c).length === 0).length
              const noText = reportCaptures.filter((c) => !drafts[c.id]).length
              return (
                <div className="mt-3 space-y-1" data-testid="report-review-summary">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {reportCaptures.length} finding{reportCaptures.length !== 1 ? "s" : ""} in this report
                  </p>
                  {(noPhoto > 0 || noText > 0) && (
                    <p className="text-xs text-zinc-500">
                      {[noPhoto > 0 && `${noPhoto} without a photo`, noText > 0 && `${noText} without a supplement explanation`].filter(Boolean).join(", ")}.
                      {" "}Review them below; you can still send the report as it is.
                    </p>
                  )}
                </div>
              )
            })()}
            {localOnlyCount > 0 && (
              <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" data-testid="report-local-only">
                {localOnlyCount} finding{localOnlyCount !== 1 ? "s are" : " is"} saved on this device only and {localOnlyCount !== 1 ? "are" : "is"} not in this report, the PDF, the CSV or the email. {localOnlyCount !== 1 ? "They are" : "It is"} added once uploaded; press Sync Now, then Regenerate.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(buildReportText())
                  setReportCopied(true)
                  setTimeout(() => setReportCopied(false), 2000)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-indigo-500"
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
              >
                {reportLoading ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                type="button"
                onClick={() => openEmailModal()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Send Report
              </button>
              <button
                type="button"
                onClick={exportXactimate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Xactimate-style CSV
              </button>
            </div>
            <p className="mt-1.5 max-w-xs text-[11px] leading-snug text-zinc-500" data-testid="csv-note">
              A starting list: item codes and prices are left blank, and the Category value (RFG) is unverified. Complete and check them against your own price list. Not tested for Xactimate import.
            </p>
          </div>

          {/* Findings */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reportCaptures.map((c, i) => {
              const urls = photoUrlsOf(c)
              const meta = alignMetadata(c.photo_metadata, urls.length)
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
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {canPin && normalizePin(c.diagram_pin) && <span className="ml-2 text-indigo-600">Pinned on diagram</span>}
                      </p>
                    </div>
                    {!readOnly && (canReorder || (canPin && diagramIsImage(selectedProject.diagram_url))) && (
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {canPin && diagramIsImage(selectedProject.diagram_url) && (
                          <button type="button" onClick={() => setPinFor(c.id)} className="min-h-[40px] rounded-md border border-zinc-200 px-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50">
                            {normalizePin(c.diagram_pin) ? "Move pin" : "Pin on diagram"}
                          </button>
                        )}
                        {canReorder && (
                          <>
                            <button type="button" disabled={reordering || i === 0} onClick={() => moveFinding(c.id, -1)} aria-label={`Move finding ${i + 1} up`} className="h-10 w-10 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30">↑</button>
                            <button type="button" disabled={reordering || i === reportCaptures.length - 1} onClick={() => moveFinding(c.id, 1)} aria-label={`Move finding ${i + 1} down`} className="h-10 w-10 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30">↓</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field note */}
                  {c.field_note && (
                    <div className="mt-3 ml-9">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Field Note</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {c.field_note}
                      </p>
                    </div>
                  )}

                  {/* Supplement draft */}
                  {drafts[c.id] && (
                    <div className="mt-3 ml-9 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Supplement Explanation</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {drafts[c.id]}
                      </p>
                    </div>
                  )}

                  {!drafts[c.id] && (
                    <div className="mt-3 ml-9">
                      <p className="text-xs italic text-zinc-500">Draft not available for this finding.</p>
                    </div>
                  )}

                  {urls.length === 0 && (
                    <p className="mt-3 ml-9 text-xs italic text-zinc-500">No photo attached to this finding.</p>
                  )}

                  {/* Photos */}
                  <div className="mt-3 ml-9 flex gap-2 overflow-x-auto">
                    {urls.map((url, j) => (
                      <figure key={j} className="relative flex-shrink-0 group">
                        <SignedImg
                          projectId={selectedProject?.id}
                          src={url}
                          alt={`Finding ${i + 1} photo ${j + 1}`}
                          className="h-24 w-auto rounded-lg border border-zinc-200 object-cover dark:border-zinc-700 cursor-pointer"
                          onClick={() => openViewer(urls, j)}
                        />
                        {photoLabel(meta[j]) && (
                          <figcaption className="mt-0.5 max-w-[8rem] truncate text-[10px] text-zinc-500">{photoLabel(meta[j])}</figcaption>
                        )}
                        {!readOnly && <button
                          type="button"
                          onClick={() => openAnnotator(c, url, j)}
                          aria-label={`Mark up finding ${i + 1} photo ${j + 1}`}
                          className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-1.5 text-[11px] font-medium text-white transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100"
                        >
                          Mark up
                        </button>}
                      </figure>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Capture form — only show when a project is selected */}
      {canContribute && (
        <div data-testid="contributor-notice" role="note" className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
          The owner lets the team add findings to this project. Findings you save are marked as added by you. After saving, only the owner can edit or delete them, and only the owner can change claim details.
        </div>
      )}
      {selectedProjectId && readOnly && !canContribute ? (
        <div data-testid="read-only-notice" role="note" className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">You can view this project, but only its owner can change it</h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            You have team access to this project. You can open its findings and photos, build the PDF report, email it, and export the CSV on plans that include it. Adding or editing findings, notes, photos and claim details is done by the owner. Drafts you generate here are used for your report and are not saved to the project.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            Projects you create yourself belong to you and are not visible to the team owner.
          </p>
        </div>
      ) : selectedProjectId ? (
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
                <span className={`text-xs ${previews.length >= MAX_PHOTOS ? "text-amber-500 font-medium" : "text-zinc-500"}`}>
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
                  <div key={i}>
                  <div className="group relative aspect-square">
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
                  {/* Optional: what this photo shows. Nothing is required or blocked. */}
                  <div className="mt-1 grid grid-cols-2 gap-1" role="group" aria-label={`Photo ${i + 1} type (optional)`}>
                    {(["wide", "closeup"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleShot(i, s)}
                        aria-pressed={shots[i] === s}
                        className={`min-h-[36px] rounded-md text-[11px] font-medium ${shots[i] === s ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"}`}
                      >
                        {s === "wide" ? "Wide" : "Close-up"}
                      </button>
                    ))}
                  </div>
                  </div>
                ))}
              </div>
            )}
            {previews.length > 0 && (() => {
              const cov = shotCoverage(shots.map((s) => (s ? { shot: s } : null)))
              return (
                <p className="mb-3 text-xs text-zinc-500" data-testid="shot-hint">
                  Optional: a wide shot shows where the damage is, a close-up shows what it is.{" "}
                  <span className={cov.wide ? "text-green-700" : ""}>{cov.wide ? "✓" : "○"} Wide</span>{" "}
                  <span className={cov.closeup ? "text-green-700" : ""}>{cov.closeup ? "✓" : "○"} Close-up</span>
                </p>
              )
            })()}

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
                <span className="hidden sm:inline-flex items-center text-xs text-zinc-500">or drag & drop</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Damage Type
            </label>
            <select
              value={damageType}
              onChange={(e) => { setDamageType(e.target.value); if (status.startsWith("Please select")) setStatus("") }}
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
              onChange={(e) => { setRoofArea(e.target.value); if (status.startsWith("Please select")) setStatus("") }}
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
                inputMode="decimal"
                min="0"
                step="any"
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
              <label className="mt-3 block text-xs font-medium text-zinc-500">
                Voice language
                <select
                  value={speechLang}
                  onChange={(e) => { setSpeechLang(e.target.value); saveSpeechLang(e.target.value) }}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {SPEECH_LANGS.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
                </select>
              </label>
            )}
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
              <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
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
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : status.includes("saved")
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
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
                  className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
                    statusFilter === s
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {s}
                  <span className={`${statusFilter === s ? "text-indigo-200" : "text-zinc-500"}`}>
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
                {c.localOnly && (
                  <div role="status" data-testid="local-only-card" className={`border-b px-4 py-2.5 text-xs font-medium ${c.localOnly.status === "failed" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    {c.localOnly.status === "refused"
                      ? "Not uploaded: your access to add findings to this project was removed. It is kept only on this device."
                      : c.localOnly.status === "uploading"
                      ? "Uploading to your account..."
                      : c.localOnly.status === "failed"
                        ? c.localOnly.retryCount >= RETRY_CAP
                          ? "Saved on this device only. Uploading failed several times; press Sync Now to try again."
                          : "Saved on this device only. The last upload attempt failed; it will be tried again automatically."
                        : "Saved on this device only, not to your account yet. It uploads automatically when there is a connection."}
                    <span className="mt-0.5 block font-normal">Not included in reports until it is uploaded.</span>
                  </div>
                )}
                {(() => {
                const urls = photoUrlsOf(c)
                if (urls.length === 0) {
                  if (readOnly || c.localOnly) return <div className="border-b border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-500">No photos added</div>
                  return (
                    <label className="flex cursor-pointer flex-col items-center gap-2 border-b border-dashed border-zinc-200 bg-zinc-50 py-10 text-zinc-500 hover:bg-zinc-100">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      <span className="text-sm font-medium">{cardBusy[c.id] ? "Uploading..." : "No photos added"}</span>
                      <span className="text-xs">{cardBusy[c.id] ? "Please wait" : "Tap to upload damage photos"}</span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        className="hidden"
                        disabled={!!cardBusy[c.id]}
                        onChange={(e) => {
                          const picked = e.target.files
                          void addPhotosToCapture(c, picked).finally(() => { e.target.value = "" })
                        }}
                      />
                    </label>
                  )
                }
                return urls.length === 1 ? (
                  <div className="relative">
                    <SignedImg
                      projectId={selectedProject?.id}
                      src={urls[0]}
                      alt={`${c.damage_type} - ${c.roof_area}`}
                      className="w-full object-cover cursor-pointer"
                      style={{ maxHeight: "280px" }}
                      onClick={() => openViewer(urls, 0)}
                    />
                    {!readOnly && !c.localOnly && <button type="button" onClick={() => removePhotoFromCapture(c, urls[0])} aria-label="Remove this photo" title="Remove this photo" className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white hover:bg-red-600">&times;</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {urls.map((url, i) => (
                      <div key={i} className="relative">
                        <SignedImg
                          projectId={selectedProject?.id}
                          src={url}
                          alt={`${c.damage_type} - ${c.roof_area} (${i + 1})`}
                          className="aspect-square w-full rounded-lg object-cover cursor-pointer"
                          onClick={() => openViewer(urls, i)}
                        />
                        {!readOnly && !c.localOnly && <button type="button" onClick={() => removePhotoFromCapture(c, url)} aria-label="Remove this photo" title="Remove this photo" className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white hover:bg-red-600">&times;</button>}
                      </div>
                    ))}
                  </div>
                )
              })()}
                <div className="p-4 space-y-3">
                  {/* Status + tags row */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {readOnly || c.localOnly ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status as CaptureStatus || "Captured"]}`}>{c.status || "Captured"}</span>
                      ) : (
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
                      )}
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {c.damage_type}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        {c.roof_area}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {authorLabel(c) && <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400" data-testid="author-label">{authorLabel(c)}</p>}

                  {/* Quantity */}
                  {c.quantity ? (
                    <p className="text-xs text-zinc-500">Quantity: {c.quantity}{c.unit ? " " + c.unit : ""}</p>
                  ) : null}

                  {/* Field note or edit form */}
                  {editingCaptureId === c.id ? (
                    <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Damage type
                          <select
                            value={editForm.damage_type}
                            onChange={(e) => setEditForm((p) => ({ ...p, damage_type: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          >
                            {DAMAGE_TYPES.map((d) => (<option key={d} value={d}>{d}</option>))}
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Roof area
                          <select
                            value={editForm.roof_area}
                            onChange={(e) => setEditForm((p) => ({ ...p, roof_area: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          >
                            {ROOF_AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Quantity
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </label>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Unit
                          <select
                            value={editForm.unit}
                            onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          >
                            <option value="">Auto-detect</option>
                            <option value="SF">SF (sq ft)</option>
                            <option value="LF">LF (linear ft)</option>
                            <option value="SQ">SQ (squares)</option>
                            <option value="EA">EA (each)</option>
                          </select>
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Field note
                        <textarea
                          rows={4}
                          value={editForm.field_note}
                          onChange={(e) => setEditForm((p) => ({ ...p, field_note: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!!cardBusy[c.id]}
                          onClick={() => saveEditCapture(c)}
                          className="rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {cardBusy[c.id] ? "Saving..." : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCaptureId(null)}
                          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    c.field_note && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{c.field_note}</p>
                    )
                  )}

                  {cardMsg[c.id] && (
                    <p className="text-xs text-indigo-700 dark:text-indigo-400" role="status">{cardMsg[c.id]}</p>
                  )}

                  {/* Generate draft button */}
                  {!drafts[c.id] && !draftLoading[c.id] && !c.localOnly && (
                    <button
                      type="button"
                      onClick={() => generateDraft(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950"
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
                      <p className="text-xs text-red-700 dark:text-red-400">
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
                      <p className="mb-2 text-[11px] text-zinc-500">AI-written from your notes. Review and edit before you send it to an adjuster.</p>
                      {editingDraftId === c.id ? (
                        <div>
                          <textarea
                            rows={8}
                            value={editingDraftText}
                            onChange={(e) => setEditingDraftText(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={() => saveCaptureDraftEdit(c)} className="rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-medium text-white hover:bg-indigo-500">Save</button>
                            <button type="button" onClick={() => setEditingDraftId(null)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{drafts[c.id]}</p>
                      )}
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
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copied[c.id] ? "Copied!" : "Copy Draft"}
                      </button>
                      {editingDraftId !== c.id && !readOnly && (
                        <button
                          type="button"
                          onClick={() => { setEditingDraftId(c.id); setEditingDraftText(drafts[c.id]) }}
                          className="mt-3 ml-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}

                  {/* Delete */}
                  {!c.localOnly && <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {editingCaptureId !== c.id && !readOnly && (
                      <button
                        type="button"
                        onClick={() => startEditCapture(c)}
                        className="inline-flex min-h-10 items-center px-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit Capture
                      </button>
                    )}
                    {!readOnly && ((c.image_urls && c.image_urls.length > 0 ? c.image_urls : c.image_url ? [c.image_url] : []).filter(Boolean).length > 0) && (
                      <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-500">
                        {cardBusy[c.id] ? "Uploading..." : "Add Photos"}
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          multiple
                          className="hidden"
                          disabled={!!cardBusy[c.id]}
                          onChange={(e) => {
                            const picked = e.target.files
                            void addPhotosToCapture(c, picked).finally(() => { e.target.value = "" })
                          }}
                        />
                      </label>
                    )}
                    {!readOnly && <button
                      type="button"
                      onClick={() => deleteCapture(c)}
                      className="rounded px-3 py-3 text-xs font-medium text-zinc-600 hover:text-red-600"
                    >
                      Delete Capture
                    </button>}
                  </div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="mb-8 mt-10 text-center">
        <Link href="/dashboard" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="mx-auto mb-8 max-w-xl px-4">
        <FeedbackBox page="capture" />
      </div>

      {notice && (
        <div role="alert" className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl bg-red-700 px-4 py-3 text-sm text-white shadow-lg">
          {notice}
        </div>
      )}
      {undoCapture && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg">
          <span>Capture deleted</span>
          <button type="button" onClick={undoDelete} className="rounded-lg bg-white/15 px-3 py-2.5 text-xs font-semibold hover:bg-white/25">Undo</button>
        </div>
      )}
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            {emailStatus === "sent" ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                    className="text-zinc-500 hover:text-zinc-600"
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

                  <p className="text-xs text-zinc-500">
                    Automatic follow-up emails are temporarily unavailable. Sending this report will not schedule an automatic follow-up.
                  </p>

                  {emailStatus === "error" && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
            <SignedImg
              projectId={selectedProject?.id}
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
        saveLabel="Add to finding"
        onSave={(dataUrl) => { void addMarkedUpCopy(dataUrl) }}
      />

      {pinFor && selectedProject?.diagram_url && (() => {
        const idx = reportCaptures.findIndex((c) => c.id === pinFor)
        if (idx < 0) return null
        return (
          <DiagramPinDialog
            diagramUrl={selectedProject.diagram_url}
            projectId={selectedProject.id}
            number={idx + 1}
            current={reportCaptures[idx].diagram_pin}
            others={numberedPins(reportCaptures)}
            onSave={(pin) => saveDiagramPin(pinFor, pin)}
            onClose={() => setPinFor(null)}
          />
        )
      })()}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 text-center">Upgrade to unlock</h2>
            <p className="mt-2 text-sm text-zinc-500 text-center leading-relaxed">
              You&apos;ve seen what Supplement Snap can do. Upgrade to get unlimited projects, PDF downloads, email reports to adjusters, and an Xactimate-style CSV export.
            </p>
            <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
              <p className="text-xs font-medium text-green-700">Cancel anytime from your account page.</p>
            </div>
            <div className="mt-5 flex gap-3">
              <Link
                href="/pricing"
                className="flex-1 rounded-lg bg-indigo-600 px-4 min-h-[48px] flex items-center justify-center text-sm font-semibold text-white hover:bg-indigo-500"
              >
                See Plans
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 min-h-[48px] text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
