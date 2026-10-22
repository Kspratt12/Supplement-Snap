-- SupplementSnap Migration v5: EXIF Metadata Preservation
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)
--
-- This migration adds a photo_metadata column to the captures table
-- to store GPS coordinates, timestamps, and camera info extracted
-- from photos BEFORE compression (which strips EXIF data).
--
-- Insurance adjusters use this data to verify photo authenticity —
-- without it, supplements can be denied.

-- STEP 1: Add photo_metadata JSONB column to captures
ALTER TABLE captures
ADD COLUMN IF NOT EXISTS photo_metadata JSONB DEFAULT '[]';

-- STEP 2: Add a comment explaining the column format
COMMENT ON COLUMN captures.photo_metadata IS 'Array of EXIF metadata objects extracted before compression. Each entry maps to the corresponding image in image_urls. Format: [{ latitude, longitude, timestamp, make, model, orientation }]';

-- STEP 3: Create an index for GPS-based queries (e.g., finding all captures near an address)
CREATE INDEX IF NOT EXISTS idx_captures_photo_metadata_gin ON captures USING gin (photo_metadata);

-- Done! The photo_metadata column is now available.
-- The app will automatically populate it for all new captures.
