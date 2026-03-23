import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Supplement Snap — Roofing Supplement Software"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            S
          </div>
          <span style={{ fontSize: "28px", fontWeight: 700, color: "#18181b" }}>
            Supplement Snap
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#18181b",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Roofing Supplement
            <br />
            Software
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#71717a",
              margin: 0,
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            Capture hidden damage during tear-off. Generate adjuster-ready
            reports in minutes.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 600,
              padding: "14px 32px",
            }}
          >
            Try Free — No Credit Card
          </div>
          <span style={{ fontSize: "18px", color: "#a1a1aa" }}>
            supplementsnap.io
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
