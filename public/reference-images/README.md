# Reference Images for Vision AI

## Warning Lights Legend

**File:** `warning-lights-legend.jpg`

**Purpose:** Visual reference guide showing common dashboard warning light symbols. Used by GPT-4o Vision to identify which warning lights are illuminated on user dashboards.

**How to add:**
1. Save the Google screenshot showing all warning light symbols
2. Rename it to `warning-lights-legend.jpg`
3. Place it in this directory

**Current status:**
- [ ] Image needs to be added (save your Google screenshot here!)

**Alternative:**
Upload to Supabase Storage:
- Bucket: `reference-images`
- Path: `warning-lights-legend.jpg`
- Then update `REFERENCE_LEGEND_URL` in `/lib/vision/config.ts`

## Usage

The legend is shown to GPT-4o BEFORE the user's dashboard as a visual dictionary:
1. "Here are the symbols you need to recognize"
2. "Now tell me which ones are lit on THIS dashboard"

## A/B Testing

Controlled by `useReferenceLegend` flag in pipeline options.
Track accuracy improvement vs cost increase.
