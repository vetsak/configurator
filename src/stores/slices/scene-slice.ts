import type { StateCreator } from 'zustand';

export interface SceneSlice {
  selectedModuleId: string | null;
  hoveredModuleId: string | null;
  isSceneReady: boolean;
  /** Target zoom distance for programmatic zoom; null = no active zoom transition */
  zoomTarget: number | null;
  /** When true, camera-rig lerps back to default position/target */
  resetCameraFlag: number; // incremented to trigger reset
  /** HQ render state */
  isRenderingHQ: boolean;
  hqRenderResult: string | null; // data URL
  hqRenderModalOpen: boolean;
  setSelectedModuleId: (id: string | null) => void;
  setHoveredModuleId: (id: string | null) => void;
  setSceneReady: (ready: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  clearZoomTarget: () => void;
  setRenderingHQ: (rendering: boolean) => void;
  setHqRenderResult: (result: string | null) => void;
  setHqRenderModalOpen: (open: boolean) => void;
}

const ZOOM_STEP = 0.8; // multiplier for zoom in (closer)
const ZOOM_OUT_STEP = 1.25; // multiplier for zoom out (farther)
const MIN_ZOOM_DIST = 1.0;
const MAX_ZOOM_DIST = 10;

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (set, get) => ({
  selectedModuleId: null,
  hoveredModuleId: null,
  isSceneReady: false,
  zoomTarget: null,
  resetCameraFlag: 0,
  isRenderingHQ: false,
  hqRenderResult: null,
  hqRenderModalOpen: false,

  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setHoveredModuleId: (id) => set({ hoveredModuleId: id }),
  setSceneReady: (ready) => set({ isSceneReady: ready }),

  zoomIn: () => {
    const current = get().zoomTarget;
    // If no active target, camera-rig will read current distance and set it
    // We pass a negative delta signal; camera-rig handles the actual distance
    const next = current !== null ? current * ZOOM_STEP : -1; // -1 = signal to use current * step
    set({ zoomTarget: Math.max(MIN_ZOOM_DIST, next) });
  },

  zoomOut: () => {
    const current = get().zoomTarget;
    const next = current !== null ? current * ZOOM_OUT_STEP : -2; // -2 = signal to use current * step
    set({ zoomTarget: Math.min(MAX_ZOOM_DIST, next) });
  },

  resetCamera: () => {
    set({ resetCameraFlag: get().resetCameraFlag + 1, zoomTarget: null });
  },

  clearZoomTarget: () => set({ zoomTarget: null }),

  setRenderingHQ: (rendering) => set({ isRenderingHQ: rendering }),
  setHqRenderResult: (result) => set({ hqRenderResult: result }),
  setHqRenderModalOpen: (open) => {
    if (!open) {
      // Clear result when closing modal to free memory
      set({ hqRenderModalOpen: false, hqRenderResult: null });
    } else {
      set({ hqRenderModalOpen: true });
    }
  },
});
