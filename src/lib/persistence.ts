import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';

const STORAGE_KEY = 'vetsak-config';

export interface SavedConfiguration {
  id: string;
  modules: PlacedModule[];
  presetId: string | null;
  material: MaterialSelection;
  savedAt: string;
  userName?: string;
  userEmail?: string;
}

/** Generate a short unique config ID */
function generateConfigId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** Save configuration to localStorage */
export function saveConfigToLocal(
  modules: PlacedModule[],
  presetId: string | null,
  material: MaterialSelection,
  userName?: string,
  userEmail?: string
): SavedConfiguration {
  const config: SavedConfiguration = {
    id: generateConfigId(),
    modules,
    presetId,
    material,
    savedAt: new Date().toISOString(),
    userName,
    userEmail,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage full or unavailable — fail silently
  }

  return config;
}

/** Load configuration from localStorage */
export function loadConfigFromLocal(): SavedConfiguration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedConfiguration;
  } catch {
    return null;
  }
}

/** Clear saved configuration from localStorage */
export function clearSavedConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Check if a saved config exists (localStorage or URL param) */
export function hasSavedConfig(): boolean {
  if (typeof window === 'undefined') return false;

  // Check URL param
  const params = new URLSearchParams(window.location.search);
  if (params.has('config')) return true;

  // Check localStorage
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/** Get config ID from URL param */
export function getConfigIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('config');
}
