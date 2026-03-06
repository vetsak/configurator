export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface SceneConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  shadowMapSize: number;
  groundSize: number;
  backgroundColor: string;
}

export interface InteractionState {
  hoveredModuleId: string | null;
  selectedModuleId: string | null;
  isDragging: boolean;
}
