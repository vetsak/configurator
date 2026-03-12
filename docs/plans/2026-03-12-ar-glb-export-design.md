# AR & GLB Export — Full Platform Support

## Summary

Replace the iOS-only AR export with full platform support:
- **iOS**: USDZ export → AR Quick Look (existing, unchanged)
- **Android**: GLB export with embedded textures → direct download
- **Desktop**: QR code modal → user scans with phone → loads config → AR on mobile

The exported file contains the **full configured sofa** (all modules, correct positions, selected fabric with tileable diffuse + normal textures embedded).

## Platform Detection & Button Labels

| Platform | Button label | Action |
|----------|-------------|--------|
| iOS Safari (AR supported) | "View in your room" | Export USDZ, open AR Quick Look |
| Android | "Download 3D model" | Export GLB, trigger download |
| Desktop | "View in your room" | POST config → show QR code modal |

Detection logic in `use-ar-export.ts`:
- iOS: existing `<a rel="ar">` support check
- Android: `navigator.userAgent` includes "Android"
- Desktop: everything else

## GLB Export

**File:** `src/lib/three/glb-exporter.ts`

Uses `THREE.GLTFExporter` with `binary: true`. The exporter reads materials already applied by `buildExportScene()` and embeds diffuse + normal map textures directly into the GLB binary.

Key requirement: textures load asynchronously in `getMaterialForSlot`. Before export, a `waitForTextures()` helper must ensure all `.map` and `.normalMap` properties are populated. This avoids exporting flat-colored materials.

Estimated GLB size: ~5-8MB (module geometries + 2 embedded WebP textures per material).

## Config Sharing (Desktop QR)

### Backend: Cloudflare Worker + KV

**Worker:** `workers/config-share/src/index.ts`

Two routes:
- `POST /config` — stores config JSON in KV, returns `{ id: "abc12345" }`
- `GET /config/:id` — returns stored config JSON

KV key: `config:{id}`, TTL: 30 days. ID: random 8-char alphanumeric.

Config payload:
```json
{
  "modules": [{ "moduleId": "seat-l", "position": [0, 0, 0], "rotation": [0, 0, 0] }],
  "material": { "fabricId": "cord_velour", "colourId": "platinum" },
  "presetId": "double"
}
```

### QR Modal

**File:** `src/components/configurator/ar-qr-modal.tsx`

Dialog modal showing:
- QR code (generated client-side via `qrcode` npm package)
- Text: "Scan with your phone to view in AR"
- The QR encodes: `https://{configurator-url}/?config=abc12345`

### Config Restore on Mobile

On app mount (in `Providers` or a dedicated hook):
1. Check URL for `?config=` param
2. Fetch config from Worker: `GET /config/:id`
3. Call `setModules()` + `setMaterial()` to restore the sofa
4. If on mobile, auto-trigger AR export after a short delay

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/three/glb-exporter.ts` | GLB export with embedded textures |
| `src/components/configurator/ar-qr-modal.tsx` | Desktop QR code modal |
| `workers/config-share/src/index.ts` | Cloudflare Worker for config storage |
| `workers/config-share/wrangler.toml` | Worker config with KV binding |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/use-ar-export.ts` | Platform detection, GLB path, QR modal trigger |
| `src/components/configurator/ar-preview-banner.tsx` | Dynamic button label |
| `src/lib/three/scene-builder.ts` | Add `waitForTextures()` before export |
| `src/stores/slices/ui-slice.ts` | Add `arQrModalOpen` + `arQrUrl` state |
| `package.json` | Add `qrcode` + `@types/qrcode` |

## Implementation Order

1. GLB exporter (`glb-exporter.ts`) + texture waiting
2. Platform detection + routing in `use-ar-export.ts`
3. Dynamic button label in `ar-preview-banner.tsx`
4. Cloudflare Worker for config sharing
5. QR modal component
6. Config restore hook (read `?config=` param on mount)
7. Test on iOS / Android / desktop
