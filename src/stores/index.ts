import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createConfigurationSlice, type ConfigurationSlice } from './slices/configuration-slice';
import { createMaterialSlice, type MaterialSlice } from './slices/material-slice';
import { createSceneSlice, type SceneSlice } from './slices/scene-slice';
import { createUiSlice, type UiSlice } from './slices/ui-slice';
import { createCartSlice, type CartSlice } from './slices/cart-slice';
import { createDragSlice, type DragSlice } from './slices/drag-slice';

export type StoreState = ConfigurationSlice & MaterialSlice & SceneSlice & UiSlice & CartSlice & DragSlice;

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createConfigurationSlice(...a),
      ...createMaterialSlice(...a),
      ...createSceneSlice(...a),
      ...createUiSlice(...a),
      ...createCartSlice(...a),
      ...createDragSlice(...a),
    }),
    { name: 'vetsak-configurator' }
  )
);