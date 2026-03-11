import type { StateCreator } from 'zustand';

export type ConfigStep = 'shape' | 'size' | 'modules' | 'material' | 'pillows' | 'accessories' | 'summary';

export interface Notification {
  message: string;
  type: 'info' | 'success';
}

export interface UiSlice {
  currentStep: ConfigStep;
  isLoading: boolean;
  notification: Notification | null;
  showDimensions: boolean;
  inlinePriceVisible: boolean;
  /** When true, sides/armrests are auto-placed on exposed edges after every seat change */
  autoSides: boolean;
  setCurrentStep: (step: ConfigStep) => void;
  setLoading: (loading: boolean) => void;
  showNotification: (message: string, type?: 'info' | 'success') => void;
  clearNotification: () => void;
  toggleDimensions: () => void;
  setInlinePriceVisible: (visible: boolean) => void;
  toggleAutoSides: () => void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  currentStep: 'shape',
  isLoading: false,
  notification: null,
  showDimensions: false,
  inlinePriceVisible: false,
  autoSides: true,

  setCurrentStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ isLoading: loading }),
  showNotification: (message, type = 'info') => set({ notification: { message, type } }),
  clearNotification: () => set({ notification: null }),
  toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),
  setInlinePriceVisible: (visible) => set({ inlinePriceVisible: visible }),
  toggleAutoSides: () => set((s) => ({ autoSides: !s.autoSides })),
});
