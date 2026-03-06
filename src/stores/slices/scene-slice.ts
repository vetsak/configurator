import type { StateCreator } from 'zustand';

export interface SceneSlice {
  selectedModuleId: string | null;
  hoveredModuleId: string | null;
  isSceneReady: boolean;
  setSelectedModuleId: (id: string | null) => void;
  setHoveredModuleId: (id: string | null) => void;
  setSceneReady: (ready: boolean) => void;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (set) => ({
  selectedModuleId: null,
  hoveredModuleId: null,
  isSceneReady: false,

  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setHoveredModuleId: (id) => set({ hoveredModuleId: id }),
  setSceneReady: (ready) => set({ isSceneReady: ready }),
});
