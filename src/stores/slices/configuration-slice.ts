import type { StateCreator } from 'zustand';
import type { PlacedModule } from '@/types/configurator';
import type { SnapTarget } from './drag-slice';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { createPlacedModule, connectModules } from '@/lib/snapping/engine';
import { computeAccessoryPlacement } from '@/lib/snapping/accessory-placement';

export interface ConfigurationSlice {
  modules: PlacedModule[];
  presetId: string | null;
  sidesUserRemoved: boolean;
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
  /** Place an accessory (pillow/noodle) on top of the best available seat. */
  placeAccessory: (catalogId: string) => void;
  /** Remove an accessory by instance ID (no anchor disconnection needed). */
  removeAccessory: (instanceId: string) => void;
  /** Rotate all modules by 180 degrees (PI) around the Y axis. */
  rotateSofa: () => void;
  setSidesUserRemoved: (val: boolean) => void;
}

export const createConfigurationSlice: StateCreator<ConfigurationSlice, [], [], ConfigurationSlice> = (set, get) => ({
  modules: [],
  presetId: null,
  sidesUserRemoved: false,

  addModule: (module) =>
    set((state) => ({ modules: [...state.modules, module] })),

  removeModule: (instanceId) => {
    const mod = get().modules.find((m) => m.instanceId === instanceId);
    // Disconnect first, then remove
    get().disconnectModule(instanceId);
    set((state) => {
      const updates: Partial<ConfigurationSlice> = {
        modules: state.modules.filter((m) => m.instanceId !== instanceId),
      };
      // Track user intent when manually removing a side module
      if (mod) {
        const catalog = MODULE_CATALOG[mod.moduleId];
        if (catalog?.type === 'side') {
          updates.sidesUserRemoved = true;
        }
      }
      return updates;
    });
  },

  updateModule: (instanceId, updates) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.instanceId === instanceId ? { ...m, ...updates } : m
      ),
    })),

  setModules: (modules) => set({ modules }),

  setPresetId: (presetId) => set({ presetId, sidesUserRemoved: false }),

  clearConfiguration: () => set({ modules: [], presetId: null, sidesUserRemoved: false }),

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

      // Reset sidesUserRemoved when user manually adds a side back
      const catalog = MODULE_CATALOG[catalogId];
      const updates: Partial<ConfigurationSlice> = { modules };
      if (catalog?.type === 'side') {
        updates.sidesUserRemoved = false;
      }
      return updates;
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

  placeAccessory: (catalogId) => {
    const state = get();
    const selectedModuleId = (state as unknown as { selectedModuleId: string | null }).selectedModuleId ?? null;
    const placement = computeAccessoryPlacement(catalogId, state.modules, selectedModuleId);
    if (!placement) return;

    const accessory = createPlacedModule(catalogId, placement.position, placement.rotation);
    set({ modules: [...state.modules, accessory] });
  },

  removeAccessory: (instanceId) =>
    set((state) => ({
      modules: state.modules.filter((m) => m.instanceId !== instanceId),
    })),

  rotateSofa: () => {
    const { modules } = get();
    if (modules.length === 0) return;
    const rotated = modules.map((m) => ({
      ...m,
      position: [-m.position[0], m.position[1], -m.position[2]] as [number, number, number],
      rotation: [m.rotation[0], m.rotation[1] + Math.PI, m.rotation[2]] as [number, number, number],
    }));
    set({ modules: rotated });
  },

  setSidesUserRemoved: (val) => set({ sidesUserRemoved: val }),
});
