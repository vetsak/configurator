import type { StateCreator } from 'zustand';
import type { PlacedModule } from '@/types/configurator';
import type { SnapTarget } from './drag-slice';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { createPlacedModule, connectModules } from '@/lib/snapping/engine';

export interface ConfigurationSlice {
  modules: PlacedModule[];
  presetId: string | null;
  addModule: (module: PlacedModule) => void;
  removeModule: (instanceId: string) => void;
  updateModule: (instanceId: string, updates: Partial<PlacedModule>) => void;
  setModules: (modules: PlacedModule[]) => void;
  setPresetId: (presetId: string | null) => void;
  clearConfiguration: () => void;
  /** Disconnect a module from all its neighbors, freeing anchors on both sides. */
  disconnectModule: (instanceId: string) => void;
  /** Place a new module from catalog at the snap target position, connecting anchors. */
  placeSnappedModule: (catalogId: string, snap: SnapTarget) => void;
  /** Reposition an existing module to a new snap target. */
  repositionModule: (instanceId: string, snap: SnapTarget) => void;
}

export const createConfigurationSlice: StateCreator<ConfigurationSlice, [], [], ConfigurationSlice> = (set, get) => ({
  modules: [],
  presetId: null,

  addModule: (module) =>
    set((state) => ({ modules: [...state.modules, module] })),

  removeModule: (instanceId) => {
    // Disconnect first, then remove
    get().disconnectModule(instanceId);
    set((state) => ({
      modules: state.modules.filter((m) => m.instanceId !== instanceId),
    }));
  },

  updateModule: (instanceId, updates) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.instanceId === instanceId ? { ...m, ...updates } : m
      ),
    })),

  setModules: (modules) => set({ modules }),

  setPresetId: (presetId) => set({ presetId }),

  clearConfiguration: () => set({ modules: [], presetId: null }),

  disconnectModule: (instanceId) =>
    set((state) => {
      const modules = state.modules.map((m) => ({ ...m, anchors: m.anchors.map((a) => ({ ...a })), connectedTo: [...m.connectedTo] }));
      const target = modules.find((m) => m.instanceId === instanceId);
      if (!target) return state;

      // For each connection on the target module, free the neighbor's anchor too
      for (const conn of target.connectedTo) {
        const neighbor = modules.find((m) => m.instanceId === conn.targetInstanceId);
        if (neighbor) {
          // Free the neighbor's anchor that was connected to us
          const neighborAnchor = neighbor.anchors.find((a) => a.id === conn.targetAnchorId);
          if (neighborAnchor) neighborAnchor.occupied = false;

          // Remove the connection entry from the neighbor
          neighbor.connectedTo = neighbor.connectedTo.filter(
            (c) => c.targetInstanceId !== instanceId
          );
        }
      }

      // Free all anchors on the target module and clear its connections
      for (const anchor of target.anchors) {
        anchor.occupied = false;
      }
      target.connectedTo = [];

      return { modules };
    }),

  placeSnappedModule: (catalogId, snap) =>
    set((state) => {
      const modules = state.modules.map((m) => ({ ...m, anchors: m.anchors.map((a) => ({ ...a })), connectedTo: [...m.connectedTo] }));
      const host = modules.find((m) => m.instanceId === snap.hostInstanceId);
      if (!host) return state;

      const newModule = createPlacedModule(catalogId, snap.position, snap.rotation);
      connectModules(host, snap.hostAnchorId, newModule, snap.guestAnchorId);
      modules.push(newModule);

      return { modules };
    }),

  repositionModule: (instanceId, snap) =>
    set((state) => {
      const modules = state.modules.map((m) => ({ ...m, anchors: m.anchors.map((a) => ({ ...a })), connectedTo: [...m.connectedTo] }));
      const mod = modules.find((m) => m.instanceId === instanceId);
      const host = modules.find((m) => m.instanceId === snap.hostInstanceId);
      if (!mod || !host) return state;

      // Update position and rotation
      mod.position = snap.position;
      mod.rotation = snap.rotation;

      // Connect to new host
      connectModules(host, snap.hostAnchorId, mod, snap.guestAnchorId);

      return { modules };
    }),
});
