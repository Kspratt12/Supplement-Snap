import exifr from "exifr"

export interface PhotoMetadata {
  latitude: number | null
  longitude: number | null
  timestamp: string | null
  make: string | null
  model: string | null
  orientation: number | null
}

const EMPTY_METADATA: PhotoMetadata = {
  latitude: null,
  longitude: null,
  timestamp: null,
  make: null,
  model: null,
  orientation: null,
}

/**
 * Extract EXIF metadata (GPS, timestamp, camera info) from a photo file.
 * Must be called BEFORE canvas-based compression, which strips EXIF data.
 */
export async function extractExifData(file: File): Promise<PhotoMetadata> {
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "Make",
        "Model",
        "Orientation",
        "GPSLatitude",
        "GPSLongitude",
      ],
    })

    if (!exif) return EMPTY_METADATA

    return {
      latitude: exif.latitude ?? null,
      longitude: exif.longitude ?? null,
      timestamp: exif.DateTimeOriginal?.toISOString?.()
        ?? exif.CreateDate?.toISOString?.()
        ?? null,
      make: exif.Make ?? null,
      model: exif.Model ?? null,
      orientation: exif.Orientation ?? null,
    }
  } catch {
    return EMPTY_METADATA
  }
}

/**
 * Extract EXIF from multiple files in parallel.
 */
export async function extractAllExifData(files: File[]): Promise<PhotoMetadata[]> {
  return Promise.all(files.map((f) => extractExifData(f)))
}
