# Edge-Aligned Snap Zones for Mixed-Size Seats

## Summary

When two seats of different depths connect side-by-side (e.g., seat-xs 63cm + seat-xl 105cm), they currently center-align, leaving backs and fronts misaligned. This feature adds 3 snap zones per edge — back-aligned, center, front-aligned — activated only when the perpendicular dimensions differ. Cursor position along the edge picks the zone, with back-alignment as the sticky default.

## Design Decisions

1. **All 4 edges** get multi-snap, but only when perpendicular dimensions differ. Same-size seats keep single center snap (no change).
2. **Cursor position** along the host edge determines which zone is active. The ghost module previews the alignment in real-time.
3. **Sticky back-aligned** with hysteresis — back zone ~50%, center ~30%, front ~20%. Prevents flickering near boundaries.
4. **Front/back edges** (L/U shapes): sticky default = outer-edge alignment. Detected by checking which of the host's left/right anchors is free (free = outer edge).
5. **No alignment memory** — always cursor-driven, stateless. Every drag is fresh.

## Grid Compatibility

All depth/width differences are multiples of 21cm (2 x 10.5cm grid units):
- 105 - 84 = 21cm (2 grid units)
- 105 - 63 = 42cm (4 grid units)
- 84 - 63 = 21cm (2 grid units)

Every alignment position lands exactly on the 10.5cm grid.

## Snap Zone Calculation

### Left/Right Edges (different depths)

When a guest anchor matches a host anchor (e.g., guest `left` -> host `right`):

```
hostDepth  = hostCatalog.dimensions.depth    // e.g., 1.05 (seat-xl)
guestDepth = dragCatalog.dimensions.depth    // e.g., 0.63 (seat-xs)
depthDiff  = hostDepth - guestDepth          // 0.42m = 42cm
```

If `depthDiff === 0` -> single center snap (current behavior).

If `depthDiff !== 0` -> 3 candidate positions by shifting the guest along the host edge:

```
backOffset   = -depthDiff / 2   // shift guest toward back
centerOffset = 0                // current center behavior
frontOffset  = +depthDiff / 2   // shift guest toward front
```

### Cursor Zone Detection

Project cursor position onto the host edge axis (Z for left/right edges, X for front/back edges). Normalize relative to host edge center into `[-1, +1]`:

- `[-1.0, -0.1]` -> back zone (sticky default)
- `[-0.1, +0.3]` -> center zone
- `[+0.3, +1.0]` -> front zone

### Hysteresis

Track `snapZone` in drag slice. Only switch zones when cursor crosses boundary + 5cm buffer. Prevents ghost from jumping between positions near zone edges. Reset to `null` on drag end.

### Front/Back Edges (L/U Shapes)

Same principle rotated 90 deg. Perpendicular axis is width:

```
hostWidth  = hostCatalog.dimensions.width
guestWidth = dragCatalog.dimensions.width
widthDiff  = hostWidth - guestWidth
```

Sticky default = outer-edge alignment. Detected by checking host's free anchors:

- `hostHasFreeRight` -> default = right-aligned (wing extends right)
- `hostHasFreeLeft`  -> default = left-aligned (wing extends left)
- Both free          -> default = right-aligned
- Neither free       -> default = center

## Files to Modify

### `src/lib/snapping/snap-detector-2d.ts`
- New helper: `computeAlignmentOffset(hostCatalog, guestCatalog, hostAnchorId, cursorWorldPos, hostWorldPos, hostRotY, hostModule, allModules)` -> returns perpendicular offset
  - Calculates dimension difference on perpendicular axis
  - Returns 0 if dimensions match
  - Projects cursor onto host edge for zone detection
  - Applies hysteresis via `snapZone` from drag slice
  - For front/back anchors: checks host's free left/right anchors for sticky default
- In `findBestSnap()`, seat-to-seat branch: add alignment offset to perpendicular component of `snapPos`

### `src/stores/slices/drag-slice.ts`
- Add `snapZone: 'back' | 'center' | 'front' | null` for hysteresis
- Reset to `null` in `cancelDrag` and `confirmDrop`

### Files unchanged
- `modules.ts` — no new anchors, offset computed dynamically
- `drop-zone.tsx` — already passes `cursorWorldPos` to `findBestSnap`
- `layout-solver.ts` — presets use same-size seats, center alignment applies automatically
- `SnapResult` type — offset baked into `position`, no new fields

## Implementation Order

1. Add `snapZone` to drag slice (2 lines)
2. Implement `computeAlignmentOffset()` helper in snap-detector-2d.ts
3. Integrate offset into `findBestSnap()` seat-to-seat branch
4. Test: drag seat-xs next to seat-xl, verify 3 zones with ghost preview
5. Test: L-shape with mixed widths, verify outer-edge default
6. Test: same-size seats unchanged (center only)
