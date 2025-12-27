/**
 * Lens Options Configuration
 * Defines lens types, thickness options, and coatings with pricing
 */

export interface LensOption {
  label: string;
  priceDelta: number; // Additional cost in GBP
}

export interface LensType extends LensOption {
  id: string;
}

export interface LensThickness extends LensOption {
  id: string;
}

export interface LensCoating extends LensOption {
  id: string;
}

export const LENS_TYPES: LensType[] = [
  { id: 'singleVision', label: 'Single Vision', priceDelta: 0 },
  { id: 'varifocal', label: 'Varifocal', priceDelta: 50 },
  { id: 'bifocal', label: 'Bifocal', priceDelta: 30 },
];

export const LENS_THICKNESS: LensThickness[] = [
  { id: 'standard', label: 'Standard', priceDelta: 0 },
  { id: 'thin', label: 'Thin', priceDelta: 25 },
  { id: 'ultraThin', label: 'Ultra Thin', priceDelta: 50 },
];

export const LENS_COATINGS: LensCoating[] = [
  { id: 'none', label: 'No Coating', priceDelta: 0 },
  { id: 'ar', label: 'Anti-Reflective (AR)', priceDelta: 30 },
  { id: 'blueLight', label: 'Blue Light Filter', priceDelta: 40 },
  { id: 'transitions', label: 'Transitions (Photochromic)', priceDelta: 60 },
  { id: 'arBlueLight', label: 'AR + Blue Light', priceDelta: 65 },
];

export interface PrescriptionFields {
  // Right Eye
  rightSph?: string;
  rightCyl?: string;
  rightAxis?: string;
  // Left Eye
  leftSph?: string;
  leftCyl?: string;
  leftAxis?: string;
  // Additional
  pd?: string; // Pupillary Distance
  add?: string; // Addition (for varifocal/bifocal)
  notes?: string;
}

export interface SelectedLensOptions {
  lensType: string;
  thickness: string;
  coatings: string[];
  prescription: PrescriptionFields;
}

export function calculateLensPrice(options: SelectedLensOptions): number {
  let total = 0;

  // Add lens type price
  const lensType = LENS_TYPES.find((lt) => lt.id === options.lensType);
  if (lensType) total += lensType.priceDelta;

  // Add thickness price
  const thickness = LENS_THICKNESS.find((t) => t.id === options.thickness);
  if (thickness) total += thickness.priceDelta;

  // Add coating prices
  options.coatings.forEach((coatingId) => {
    const coating = LENS_COATINGS.find((c) => c.id === coatingId);
    if (coating) total += coating.priceDelta;
  });

  return total;
}

export function formatLensOptionsForAttributes(
  options: SelectedLensOptions
): Array<{ key: string; value: string }> {
  const attributes: Array<{ key: string; value: string }> = [];

  // Lens configuration
  const lensType = LENS_TYPES.find((lt) => lt.id === options.lensType);
  if (lensType) {
    attributes.push({ key: 'Lens Type', value: lensType.label });
  }

  const thickness = LENS_THICKNESS.find((t) => t.id === options.thickness);
  if (thickness) {
    attributes.push({ key: 'Lens Thickness', value: thickness.label });
  }

  if (options.coatings.length > 0) {
    const coatingLabels = options.coatings
      .map((id) => LENS_COATINGS.find((c) => c.id === id)?.label)
      .filter(Boolean);
    attributes.push({ key: 'Coatings', value: coatingLabels.join(', ') });
  }

  // Prescription fields
  if (options.prescription.rightSph || options.prescription.rightCyl) {
    const rightRx = [
      options.prescription.rightSph,
      options.prescription.rightCyl,
      options.prescription.rightAxis,
    ]
      .filter(Boolean)
      .join(' / ');
    if (rightRx) attributes.push({ key: 'Right Eye (OD)', value: rightRx });
  }

  if (options.prescription.leftSph || options.prescription.leftCyl) {
    const leftRx = [
      options.prescription.leftSph,
      options.prescription.leftCyl,
      options.prescription.leftAxis,
    ]
      .filter(Boolean)
      .join(' / ');
    if (leftRx) attributes.push({ key: 'Left Eye (OS)', value: leftRx });
  }

  if (options.prescription.pd) {
    attributes.push({ key: 'PD (Pupillary Distance)', value: options.prescription.pd });
  }

  if (options.prescription.add) {
    attributes.push({ key: 'ADD', value: options.prescription.add });
  }

  if (options.prescription.notes) {
    attributes.push({ key: 'Prescription Notes', value: options.prescription.notes });
  }

  return attributes;
}

