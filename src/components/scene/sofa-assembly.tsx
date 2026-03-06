'use client';

import { useStore } from '@/stores';
import { selectModules, selectSelectedMaterial, selectSelectedModuleId } from '@/stores/selectors';
import { GlbModule } from './modules/glb-module';
import { MODULE_CATALOG } from '@/lib/config/modules';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';

function ModuleRenderer({
  module,
  material,
  isSelected,
  onSelect,
}: {
  module: PlacedModule;
  material: MaterialSelection;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const catalog = MODULE_CATALOG[module.moduleId];
  if (!catalog) return null;

  return (
    <GlbModule
      module={module}
      material={material}
      modelPath={catalog.modelPath}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  );
}

export function SofaAssembly() {
  const modules = useStore(selectModules);
  const material = useStore(selectSelectedMaterial);
  const selectedModuleId = useStore(selectSelectedModuleId);
  const setSelectedModuleId = useStore((s) => s.setSelectedModuleId);
  const dragInstanceId = useStore((s) => s.dragInstanceId);

  return (
    <group>
      {modules.map((module) => {
        // Hide the module being repositioned (ghost replaces it)
        if (dragInstanceId && module.instanceId === dragInstanceId) return null;

        return (
          <ModuleRenderer
            key={module.instanceId}
            module={module}
            material={material}
            isSelected={module.instanceId === selectedModuleId}
            onSelect={setSelectedModuleId}
          />
        );
      })}
    </group>
  );
}
