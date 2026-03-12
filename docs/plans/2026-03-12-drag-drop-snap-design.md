# Drag-and-Drop Module Placement with Snap Toggle

## Summary

Replace click-to-place with proper drag-and-drop for module placement and repositioning. Add a snap toggle (magnet icon) in the viewer toolbar. When snap is ON, modules snap to anchor points on existing modules or to an invisible 10.5cm grid. When snap is OFF, modules move freely with soft-connect (auto-link edges within 5cm).

## Platform Behavior

| Platform | Catalog → Viewer | Reposition existing module |
|----------|-----------------|--------------------------|
| Desktop | Drag card onto 3D canvas | Click-and-drag directly on module |
| Mobile | Tap card → tap viewer (current) | Tap → drag on viewer (current) |

## Snap Toggle

- Magnet icon in viewer toolbar (always visible)
- Default: ON
- Store: `snapEnabled: boolean` + `toggleSnap()` in scene-slice

### Snap ON behavior
1. **Near an anchor** (within 0.5m): snap to anchor (existing behavior)
2. **Open space**: snap to invisible 10.5cm grid
   ```
   snappedX = Math.round(worldX / 0.105) * 0.105
   snappedZ = Math.round(worldZ / 0.105) * 0.105
   ```

### Snap OFF behavior
- Module follows cursor freely on ground plane
- **Soft-connect**: after drop, scan all modules — if edge-to-edge distance ≤ 5cm, create anchor connection in data model (for pricing/export/shape detection)

## Desktop Drag from Catalog

**step-modules.tsx:**
- Add `draggable` + `onDragStart` to module cards
- `onDragStart`: set drag image, call `startCatalogDrag(moduleId)`
- Keep existing `onClick` for mobile tap-to-place

**drop-zone.tsx:**
- Add `dragover` listener: compute ground point → run snap logic → update ghost
- Add `drop` listener: confirm placement at snap/free position
- `dragover` must call `e.preventDefault()` to allow drop

## Direct Drag Reposition

**glb-module.tsx:**
- `onPointerDown`: record pointer position + instanceId
- `onPointerMove`: if moved > 5px from down position → start drag (distinguishes click-to-select from drag-to-move)
- During drag: disconnect module from anchors, module follows cursor with snap logic
- `onPointerUp`: confirm placement, run soft-connect if snap OFF

**module-actions.tsx:**
- Remove "Move" button — direct drag replaces it
- Keep "Remove" and "Deselect" buttons

## Soft-Connect Logic

After dropping a module with snap OFF:
1. For each pair of (dropped module edge, other module edge):
   - Compute edge-to-edge distance
   - If ≤ 0.05m (5cm), create anchor connection
2. Uses existing `connectModules()` from engine
3. Edge detection: compare world positions of anchors on both modules

## Files to Modify

| File | Changes |
|------|---------|
| `step-modules.tsx` | Fix typo "sites"→"sides". Add `draggable`+`onDragStart` (desktop). |
| `drop-zone.tsx` | Add `dragover`/`drop` listeners. Grid snap. Direct-drag reposition. |
| `glb-module.tsx` | `onPointerDown` for direct drag with 5px dead zone. |
| `module-actions.tsx` | Remove "Move" button. |
| `viewer-toolbar.tsx` | Add magnet snap toggle button. |
| `snap-detector-2d.ts` | Grid-snap fallback. Soft-connect scan function. |
| `scene-slice.ts` | `snapEnabled` + `toggleSnap`. |
| `drag-slice.ts` | `dragOrigin` for dead zone detection. |

## Implementation Order

1. Typo fix ("sites" → "sides")
2. Store additions (snapEnabled, dragOrigin)
3. Snap toggle in toolbar
4. Grid snap logic in snap-detector-2d
5. Desktop drag-and-drop from catalog
6. Direct drag on 3D modules (reposition)
7. Remove "Move" button
8. Soft-connect logic

## Key Technical Notes

- **OrbitControls**: disabled during drag via existing `isDragging` flag
- **5px dead zone**: prevents accidental drags when user wants to select or orbit
- **HTML5 drag events**: `dragover` provides `clientX/clientY` — existing `getGroundPoint` works directly. Browser suppresses `pointermove` during drag, so `dragover` must handle ghost updates.
- **10.5cm grid**: all vetsak module widths are multiples of 10.5cm (63=6×10.5, 84=8×10.5, 105=10×10.5) — grid alignment ensures modules can always connect cleanly
- **No visible grid**: grid is invisible to avoid visual clutter. Modules just land on clean positions.
