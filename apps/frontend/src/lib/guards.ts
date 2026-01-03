import type { GeomanPM } from '@/types/leaflet.types';

export function isGeoman(pm: unknown): pm is GeomanPM {
  return (
    !!pm &&
    typeof pm === 'object' &&
    ('setLang' in pm || 'addControls' in pm || 'disableDraw' in pm || 'disableGlobalEditMode' in pm)
  );
}
