# Configurator Improvements Plan — 2026-03-12

## Task 1: Fix width slider flicker during drag
**Priority**: High | **Effort**: Small

The width slider in `step-size.tsx` flickers during drag because `displayWidth` alternates between `dragWidth` (snapped preview) and `totalWidthCm` (computed from current modules). The computed width differs from the snapped target because modules haven't been rebuilt yet.

**Fix**:
- During drag, use only `dragWidth` for display and thumb position
- Don't recompute `totalWidthCm` from modules until drag ends
- Audit preset/depth change paths to ensure width doesn't reset unexpectedly

**Files**: `src/components/configurator/steps/step-size.tsx`

---

## Task 2: Fix preset module overlaps
**Priority**: High | **Effort**: Small

Armrest side modules were shifted backward for back-alignment, but side modules aren't wide enough to cover seat depth + back depth. This caused visual gaps and overlaps.

**Fix**:
- Align armrests with seat's back edge (not backrest's outer edge)
- Armrest stays flush with both front and back of the seat
- Backrest extends slightly further back (matches real sofa proportions)
- Validate all 6 presets for zero AABB overlaps with 1cm tolerance

**Files**: `src/lib/snapping/side-placement.ts`, `src/lib/snapping/layout-solver.ts`

---

## Task 3: Save configuration modal + persistence
**Priority**: Medium | **Effort**: Medium

### UI Design
Modal popup (matches vetsak design language):
- Rounded corners, warm cream/white background
- Heading: "a little closer to comfort..."
- Subtext: "we'll save your configuration until you return to reconfigure and customize your vetsak sofa."
- Fields: Name, Email Address, Friends & Family Email Addresses (comma-separated)
- Button: "Save configuration" (black, full-width, rounded pill)

### Persistence (Hybrid)
1. **localStorage**: Immediately serialize `modules`, `presetId`, selected material/colour under a unique config ID
2. **Serverless function**: POST config JSON + user info to a Cloudflare Worker / Vercel edge function
   - Store config in KV/D1/Supabase
   - Send email to user (and optionally friends/family) with shareable link `?config=abc123`
3. **On return**: Check URL param first, then localStorage. Show "Continue previous / Start new" prompt

### Trigger
Existing save button in the configurator opens this modal.

**Files**: New `src/components/configurator/save-config-modal.tsx`, new `src/lib/persistence.ts`, API route/worker for backend

---

## Task 4: Redesign layout popup
**Priority**: Medium | **Effort**: Medium

Update `preset-modal.tsx` to match new design.

### New Design
- Title: "Start a new sofa configuration"
- Subtitle: "choose a preset to get started quickly, or begin entirely from scratch."
- **Grid of preset cards** (2-3 columns):
  - Rounded border card
  - Graphical shape indicator (existing SVG shapes, scaled up — NOT product photos)
  - "+" icon top-right
  - Label below (e.g. "2-Seat Sofa", "L-Shape Right")
- **"Start from scratch" button** at bottom (black, full-width, rounded pill)
  - Clears all modules, closes modal

### Behaviour
- Selecting a preset calls `applyPreset()` + `autoPlaceSides()` (same as current)
- "Start from scratch" clears modules and closes modal

**Files**: `src/components/configurator/preset-modal.tsx`

---

## Task 5: Update feature copy (AR preview + AI render)
**Priority**: Low | **Effort**: Small

### AR Preview Banner
- Heading: **"Place your sofa at home"**
- Body: "Use your phone's camera to see exactly how your vetsak sofa fits in your space — before you order."

### AI Render Banner
- Heading: **"Picture it in your room"**
- Body: "Snap a photo of your living room and we'll place your configured sofa right into the scene."

**Files**: `src/components/configurator/ar-preview-banner.tsx`, AI render CTA component

---

## Implementation Order
1. Task 2 — Fix overlaps (already in progress locally)
2. Task 1 — Fix width slider
3. Task 5 — Update copy (quick win)
4. Task 4 — Redesign layout popup
5. Task 3 — Save configuration (largest scope)
