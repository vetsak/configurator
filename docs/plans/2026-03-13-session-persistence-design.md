# Session Persistence — Auto-Save & Welcome Back Modal

## Summary

Auto-save the user's configuration to localStorage on every change (debounced 500ms). When returning to the page with a saved config, show a "Welcome back" modal with a 2D schematic preview of their sofa. User can continue or start fresh by picking a preset layout.

## Design Decisions

1. **Auto-save on every change** — debounced 500ms, silent, no user action needed. Skip saving when modules array is empty.
2. **Two-step modal** — step 1: "Continue" vs "Start fresh" with saved sofa preview. Step 2: preset selection grid (6 presets with SVG schematics).
3. **2D SVG schematic** for saved config preview — lightweight, renders from module positions/dimensions, no 3D rendering needed.
4. **Static SVG icons** for preset cards — same visual style as saved config schematic, generated from preset definitions.
5. **Always require a preset** — no "from scratch" empty canvas option. "Single" is the minimal starting point.
6. **Load saved config first, then show modal** — sofa appears in 3D viewer behind modal. "Continue" just dismisses. "Start fresh" swaps the config.

## Auto-Save

- Hook: `useAutoSave()` in `providers.tsx`
- Subscribes to `modules`, `presetId`, `selectedMaterial` in Zustand store
- On change: debounce 500ms, call `saveConfigToLocal()`
- Skip when `modules.length === 0`
- Storage key: `vetsak-config` (existing)
- Existing `SaveConfigModal` with email stays as separate explicit share action

## Welcome Back Modal

### Step 1: Continue or Start Fresh

Appears when `loadConfigFromLocal()` returns a saved config on page load. Saved config is loaded into store silently (sofa visible in viewer behind modal).

Content:
- "Welcome back" heading
- 2D SVG schematic of saved sofa (~200x120px)
- Text summary: module count by type, fabric + colour, "Saved X ago"
- "Continue configuration" button (primary) — closes modal
- "Start fresh" button (secondary) — transitions to step 2
- Close (x) = same as Continue

### Step 2: Preset Selection

3x2 grid of preset cards:
- Single, Double, Triple, L-Shape Right, L-Shape Left, U-Shape
- Each card: top-down SVG schematic + preset name
- On select: clear localStorage, apply preset + autoPlaceSides, close modal
- Close (x) = back to step 1 (prevent accidental data loss)

### ConfigSchematic Component

Shared SVG component for both steps:
- Input: `PlacedModule[]` array
- Computes bounding box from module positions + dimensions
- Scales and centers modules to fit viewport
- Draws each module as a rectangle
- Color-coded: seats in one shade, sides in another

## Files

### New files

| File | Purpose |
|------|---------|
| `src/hooks/use-auto-save.ts` | Debounced localStorage save on store changes |
| `src/components/configurator/config-schematic.tsx` | SVG top-down module schematic, shared by both modal steps |
| `src/components/configurator/welcome-back-modal.tsx` | Two-step modal: continue/fresh + preset grid |

### Modified files

| File | Changes |
|------|---------|
| `src/app/providers.tsx` | Call `useAutoSave()`. On mount: load saved config, set `welcomeBackOpen: true`. Skip default preset when saved config loaded. |
| `src/stores/slices/ui-slice.ts` | Add `welcomeBackOpen: boolean` + `setWelcomeBackOpen()` |
| `src/components/configurator/configurator-shell.tsx` | Render `<WelcomeBackModal>` |

### Unchanged files

- `src/lib/persistence.ts` — existing save/load/clear functions are sufficient
- `src/lib/snapping/layout-solver.ts` — existing applyPreset + autoPlaceSides handle preset loading
- `src/components/configurator/save-config-modal.tsx` — stays as separate email-share feature

## Implementation Order

1. `useAutoSave` hook (debounced save)
2. `ConfigSchematic` SVG component
3. `WelcomeBackModal` (both steps)
4. Wire into providers + UI slice + shell
5. Test: make changes, reload page, verify modal appears with correct preview
6. Test: "Continue" restores config, "Start fresh" applies selected preset
