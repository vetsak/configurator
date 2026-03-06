import type { StateCreator } from 'zustand';
import type { MaterialSelection } from '@/types/materials';

export interface MaterialSlice {
  selectedMaterial: MaterialSelection;
  setMaterial: (material: MaterialSelection) => void;
}

export const createMaterialSlice: StateCreator<MaterialSlice, [], [], MaterialSlice> = (set) => ({
  selectedMaterial: {
    fabricId: 'cord',
    colourId: 'platinum',
  },

  setMaterial: (material) => set({ selectedMaterial: material }),
});
