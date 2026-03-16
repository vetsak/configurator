export interface ReferenceObject {
  id: string;
  label: string;
  widthCm: number | null;
  heightCm: number | null;
  cocoClass: string;
  icon: string;
  requiresInput: boolean;
  inputLabel?: string;
}

export const REFERENCE_OBJECTS: ReferenceObject[] = [
  {
    id: 'credit-card',
    label: 'Credit card',
    widthCm: 8.56,
    heightCm: 5.4,
    cocoClass: 'cell phone',
    icon: 'CreditCard',
    requiresInput: false,
  },
  {
    id: 'a4-paper',
    label: 'A4 paper',
    widthCm: 29.7,
    heightCm: 21.0,
    cocoClass: 'book',
    icon: 'FileText',
    requiresInput: false,
  },
  {
    id: 'magazine',
    label: 'Magazine',
    widthCm: 27.6,
    heightCm: 21.0,
    cocoClass: 'book',
    icon: 'BookOpen',
    requiresInput: false,
  },
  {
    id: 'shoe',
    label: 'Shoe',
    widthCm: null,
    heightCm: null,
    cocoClass: 'shoe',
    icon: 'Footprints',
    requiresInput: true,
    inputLabel: 'Shoe length (cm)',
  },
];
