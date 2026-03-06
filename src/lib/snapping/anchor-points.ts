import type { AnchorPoint, ModuleType } from '@/types/configurator';

export function createAnchorTemplate(
  id: string,
  position: [number, number, number],
  direction: [number, number, number],
  compatible: ModuleType[]
): AnchorPoint {
  return { id, position, direction, compatible, occupied: false };
}

export function cloneAnchors(anchors: AnchorPoint[]): AnchorPoint[] {
  return anchors.map((a) => ({ ...a, position: [...a.position], direction: [...a.direction], compatible: [...a.compatible], occupied: false }));
}

export function findFreeAnchor(anchors: AnchorPoint[], targetType: ModuleType): AnchorPoint | undefined {
  return anchors.find((a) => !a.occupied && a.compatible.includes(targetType));
}

export function findAnchorById(anchors: AnchorPoint[], anchorId: string): AnchorPoint | undefined {
  return anchors.find((a) => a.id === anchorId);
}
