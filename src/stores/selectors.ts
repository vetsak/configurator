import type { StoreState } from './index';
import type { PlacedModule } from '@/types/configurator';

export const selectModules = (state: StoreState): PlacedModule[] => state.modules;
export const selectPresetId = (state: StoreState) => state.presetId;
export const selectSelectedMaterial = (state: StoreState) => state.selectedMaterial;
export const selectSelectedModuleId = (state: StoreState) => state.selectedModuleId;
export const selectCurrentStep = (state: StoreState) => state.currentStep;
export const selectIsSceneReady = (state: StoreState) => state.isSceneReady;
export const selectIsLoading = (state: StoreState) => state.isLoading;

export const selectModuleCount = (state: StoreState) => state.modules.length;

export const selectTotalPrice = (state: StoreState) =>
  state.modules.reduce((total, m) => total, 0); // Will be computed from catalog prices

export const selectDragModuleId = (state: StoreState) => state.dragModuleId;
export const selectDragInstanceId = (state: StoreState) => state.dragInstanceId;
export const selectDragSource = (state: StoreState) => state.dragSource;
export const selectIsSnapped = (state: StoreState) => state.isSnapped;
export const selectIsDragging = (state: StoreState) => state.dragModuleId !== null;
