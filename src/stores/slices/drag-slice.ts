import type { StateCreator } from 'zustand';
import type { PlacedModule } from '@/types/configurator';

export interface SnapTarget {
  /** Instance ID of the host module being snapped to */
  hostInstanceId: string;
  /** Anchor ID on the host module */
  hostAnchorId: string;
  /** Anchor ID on the guest (dragged) module */
  guestAnchorId: string;
  /** World position to place the new module */
  position: [number, number, number];
  /** Rotation for the new module */
  rotation: [number, number, number];
}

export interface DragSlice {
  /** Module catalog ID being dragged (e.g. 'seat-m') */
  dragModuleId: string | null;
  /** Instance ID when repositioning an existing module */
  dragInstanceId: string | null;
  /** Source of the drag: catalog (new) or reposition (existing) */
  dragSource: 'catalog' | 'reposition' | null;
  /** Snapshot of modules before reposition (for cancel-revert) */
  dragSnapshot: PlacedModule[] | null;
  /** Current ghost position in world space */
  ghostPosition: [number, number, number] | null;
  /** Current ghost rotation */
  ghostRotation: [number, number, number];
  /** Active snap target (null = no snap) */
  snapTarget: SnapTarget | null;
  /** Whether the ghost is in a valid snap position */
  isSnapped: boolean;
  /** Instance ID of the most recently placed module (for animation) */
  justPlacedId: string | null;
  /** Screen-space origin where the drag started */
  dragOrigin: { x: number; y: number } | null;

  startCatalogDrag: (moduleId: string) => void;
  startRepositionDrag: (instanceId: string) => void;
  updateGhost: (position: [number, number, number]) => void;
  setSnapTarget: (target: SnapTarget | null) => void;
  setDragOrigin: (origin: { x: number; y: number } | null) => void;
  confirmDrop: () => void;
  cancelDrag: () => void;
}

export const createDragSlice: StateCreator<DragSlice, [], [], DragSlice> = (set, get) => ({
  dragModuleId: null,
  dragInstanceId: null,
  dragSource: null,
  dragSnapshot: null,
  ghostPosition: null,
  ghostRotation: [0, 0, 0],
  snapTarget: null,
  isSnapped: false,
  justPlacedId: null,
  dragOrigin: null,

  startCatalogDrag: (moduleId) =>
    set({
      dragModuleId: moduleId,
      dragInstanceId: null,
      dragSource: 'catalog',
      dragSnapshot: null,
      ghostPosition: null,
      ghostRotation: [0, 0, 0],
      snapTarget: null,
      isSnapped: false,
    }),

  startRepositionDrag: (instanceId) => {
    // Access modules from the combined store via get() — works because slices are merged
    const state = get() as DragSlice & { modules: PlacedModule[]; disconnectModule: (id: string) => void };
    const mod = state.modules.find((m: PlacedModule) => m.instanceId === instanceId);
    if (!mod) return;

    // Save snapshot for cancel-revert
    const snapshot = structuredClone(state.modules);

    // Disconnect the module from its neighbors
    state.disconnectModule(instanceId);

    set({
      dragModuleId: mod.moduleId,
      dragInstanceId: instanceId,
      dragSource: 'reposition',
      dragSnapshot: snapshot,
      ghostPosition: mod.position,
      ghostRotation: mod.rotation,
      snapTarget: null,
      isSnapped: false,
    });
  },

  updateGhost: (position) =>
    set({ ghostPosition: position }),

  setDragOrigin: (origin) => set({ dragOrigin: origin }),

  setSnapTarget: (target) =>
    set({
      snapTarget: target,
      isSnapped: target !== null,
      ghostPosition: target?.position ?? get().ghostPosition,
      ghostRotation: target?.rotation ?? [0, 0, 0],
    }),

  confirmDrop: () =>
    set({
      dragModuleId: null,
      dragInstanceId: null,
      dragSource: null,
      dragSnapshot: null,
      ghostPosition: null,
      ghostRotation: [0, 0, 0],
      snapTarget: null,
      isSnapped: false,
      dragOrigin: null,
    }),

  cancelDrag: () => {
    const { dragSource, dragSnapshot } = get();

    // If repositioning, restore snapshot
    if (dragSource === 'reposition' && dragSnapshot) {
      const state = get() as DragSlice & { setModules: (modules: PlacedModule[]) => void };
      state.setModules(dragSnapshot);
    }

    set({
      dragModuleId: null,
      dragInstanceId: null,
      dragSource: null,
      dragSnapshot: null,
      ghostPosition: null,
      ghostRotation: [0, 0, 0],
      snapTarget: null,
      isSnapped: false,
      dragOrigin: null,
    });
  },
});
