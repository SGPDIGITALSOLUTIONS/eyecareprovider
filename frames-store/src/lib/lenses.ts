/**
 * Lens Options Configuration
 * Defines lens types, thickness options, and coatings with pricing
 * Based on LensExtra pricing spreadsheet
 */

export interface LensOption {
  label: string;
  code: string;
}

export interface LensType extends LensOption {
  id: string;
}

export interface LensThickness extends LensOption {
  id: string;
  code: string; // e.g., '1.50', '1.60', '1.67', '1.74'
}

export interface LensCoating extends LensOption {
  id: string;
  code: string; // e.g., 'HC', 'AR', 'BLUE AR', 'PHOTO'
}

// Lens Types
export const LENS_TYPES: LensType[] = [
  { id: 'sv', code: 'SV', label: 'Single Vision' },
  { id: 'bif', code: 'BIF', label: 'Bifocal' },
  { id: 'stdVari', code: 'STD VARI', label: 'Standard Varifocal' },
  { id: 'eltVari', code: 'ELT VARI', label: 'Elite Varifocal' },
  { id: 'tmVari', code: 'TM VARI', label: 'Tailor-Made Varifocal' },
];

// Lens Index/Thickness Options
export const LENS_THICKNESS: LensThickness[] = [
  { id: '1.50', code: '1.50', label: 'Standard (1.50)' },
  { id: '1.60', code: '1.60', label: 'Thin (1.60)' },
  { id: '1.67', code: '1.67', label: 'Ultra-thin (1.67)' },
  { id: '1.74', code: '1.74', label: 'Extra Ultra-thin (1.74)' },
];

// Lens Coatings
export const LENS_COATINGS: LensCoating[] = [
  { id: 'hc', code: 'HC', label: 'Hard Coat' },
  { id: 'ar', code: 'AR', label: 'Anti-Reflective' },
  { id: 'blueAr', code: 'BLUE AR', label: 'Blue Light Anti-Reflective' },
  { id: 'photo', code: 'PHOTO', label: 'Photochromic (Transitions)' },
];

/**
 * Pricing lookup table based on LensExtra pricing spreadsheet
 * Format: 'LENS_TYPE INDEX COATING' => price in GBP
 */
const LENS_PRICE_LOOKUP: Record<string, number> = {
  // Single Vision (SV)
  'SV 1.5 HC': 0,
  'SV 1.5 AR': 40,
  'SV 1.5 BLUE AR': 50,
  'SV 1.6 AR': 60,
  'SV 1.67 AR': 100,
  'SV 1.74 AR': 140,
  'SV PHOTO 1.5 HC': 79,
  'SV PHOTO 1.5 AR': 119,
  'SV PHOTO 1.6 AR': 139,
  'SV PHOTO 1.67 AR': 179,

  // Bifocal (BIF)
  'BIF HC': 50,
  'BIF AR': 90,
  'BIF 1.6 AR': 100,
  'BIF PHOTO HC': 129,
  'BIF PHOTO 1.6 AR': 179,
  'BIF 1.67 AR': 150,
  'BIF 1.74 AR': 190,

  // Standard Varifocal (STD VARI)
  'STD VARI HC': 90,
  'STD VARI AR': 130,
  'STD VARI 1.6 AR': 150,
  'STD VARI 1.67 AR': 190,
  'STD VARI 1.74 AR': 230,
  'STD VARI PHOTO HC': 169,
  'STD VARI PHOTO AR': 209,
  'STD VARI PHOTO 1.6 AR': 229,
  'STD VARI PHOTO 1.67 AR': 269,

  // Elite Varifocal (ELT VARI)
  'ELT VARI HC': 145,
  'ELT VARI AR': 185,
  'ELT VARI 1.6 AR': 205,
  'ELT VARI 1.67 AR': 245,
  'ELT VARI 1.74 AR': 285,
  'ELT VARI PHOTO HC': 224,
  'ELT VARI PHOTO AR': 264,
  'ELT VARI PHOTO 1.6 AR': 284,
  'ELT VARI PHOTO 1.67 AR': 324,

  // Tailor-Made Varifocal (TM VARI)
  'TM VARI HC': 190,
  'TM VARI AR': 230,
  'TM VARI 1.6 AR': 250,
  'TM VARI 1.67 AR': 290,
  'TM VARI 1.74 AR': 330,
  'TM VARI PHOTO HC': 269,
  'TM VARI PHOTO AR': 309,
  'TM VARI PHOTO 1.6 AR': 329,
  'TM VARI PHOTO 1.67 AR': 369,
};

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
  lensType: string; // id from LENS_TYPES
  thickness: string; // id from LENS_THICKNESS (e.g., '1.50', '1.60')
  coatings: string[]; // array of ids from LENS_COATINGS
  prescription: PrescriptionFields;
}

/**
 * Calculate lens price based on type, thickness, and coatings
 * Pricing structure:
 * - SV (Single Vision): Base £0, only pays for index upgrades (>1.5) and coatings
 * - BIF/VARI types: Have base prices even at 1.5 index, plus index upgrades and coatings
 * Uses the pricing lookup table to match exact combinations from spreadsheet
 */
export function calculateLensPrice(options: SelectedLensOptions): number {
  const lensType = LENS_TYPES.find((lt) => lt.id === options.lensType);
  const thickness = LENS_THICKNESS.find((t) => t.id === options.thickness);
  
  if (!lensType || !thickness) {
    return 0;
  }

  // Determine coating combination
  // PHOTO can be combined with HC or AR
  // BLUE AR is standalone
  // AR is standalone
  // HC is default/base
  const hasPhoto = options.coatings.includes('photo');
  const hasAr = options.coatings.includes('ar');
  const hasBlueAr = options.coatings.includes('blueAr');
  
  // Build lookup key matching spreadsheet format
  let lookupKey = '';
  
  if (lensType.code === 'SV') {
    // SV format: "SV INDEX COATING" or "SV PHOTO INDEX COATING"
    // Note: SV 1.5 HC = £0 (included), but SV 1.6+ or SV with coatings cost money
    if (hasPhoto) {
      // SV PHOTO 1.5 HC, SV PHOTO 1.5 AR, SV PHOTO 1.6 AR, SV PHOTO 1.67 AR
      const photoCoating = hasAr ? 'AR' : 'HC';
      lookupKey = `SV PHOTO ${thickness.code} ${photoCoating}`;
    } else if (hasBlueAr) {
      // SV 1.5 BLUE AR
      lookupKey = `SV ${thickness.code} BLUE AR`;
    } else if (hasAr) {
      // SV 1.5 AR, SV 1.6 AR, SV 1.67 AR, SV 1.74 AR
      lookupKey = `SV ${thickness.code} AR`;
    } else {
      // SV 1.5 HC (included), SV 1.6 HC, SV 1.67 HC, SV 1.74 HC
      // Note: Higher indexes without coatings aren't in spreadsheet, but SV 1.5 HC = £0
      if (thickness.code === '1.50') {
        lookupKey = 'SV 1.5 HC';
      } else {
        // For SV with higher index but no coating, try to find closest match
        // This case isn't in spreadsheet, so we'll use AR pricing as fallback
        lookupKey = `SV ${thickness.code} AR`;
      }
    }
  } else if (lensType.code === 'BIF') {
    // BIF format: "BIF COATING" (for 1.5) or "BIF INDEX COATING" (for >1.5)
    // Note: BIF has base price even at 1.5 index
    if (hasPhoto) {
      // BIF PHOTO HC, BIF PHOTO 1.6 AR
      if (thickness.code === '1.50') {
        lookupKey = 'BIF PHOTO HC';
      } else {
        lookupKey = `BIF PHOTO ${thickness.code} AR`;
      }
    } else {
      // BIF HC, BIF AR, BIF 1.6 AR, BIF 1.67 AR, BIF 1.74 AR
      if (thickness.code === '1.50') {
        const coating = hasAr ? 'AR' : 'HC';
        lookupKey = `BIF ${coating}`;
      } else {
        // Higher indexes always use AR in spreadsheet
        lookupKey = `BIF ${thickness.code} AR`;
      }
    }
  } else {
    // STD VARI, ELT VARI, TM VARI
    // Format: "TYPE COATING" (for 1.5) or "TYPE INDEX COATING" (for >1.5)
    // Note: VARI types have base prices even at 1.5 index
    if (hasPhoto) {
      // TYPE PHOTO HC, TYPE PHOTO AR, TYPE PHOTO 1.6 AR, TYPE PHOTO 1.67 AR
      if (thickness.code === '1.50') {
        const photoCoating = hasAr ? 'AR' : 'HC';
        lookupKey = `${lensType.code} PHOTO ${photoCoating}`;
      } else {
        lookupKey = `${lensType.code} PHOTO ${thickness.code} AR`;
      }
    } else {
      // TYPE HC, TYPE AR, TYPE 1.6 AR, TYPE 1.67 AR, TYPE 1.74 AR
      if (thickness.code === '1.50') {
        const coating = hasAr ? 'AR' : 'HC';
        lookupKey = `${lensType.code} ${coating}`;
      } else {
        // Higher indexes always use AR in spreadsheet
        lookupKey = `${lensType.code} ${thickness.code} AR`;
      }
    }
  }

  // Look up price from table
  let price = LENS_PRICE_LOOKUP[lookupKey];
  
  // If exact match not found, try fallback logic
  if (price === undefined) {
    // For SV with higher index but no coating, calculate from base
    if (lensType.code === 'SV' && thickness.code !== '1.50' && !hasAr && !hasBlueAr && !hasPhoto) {
      // SV 1.5 HC = £0, so higher indexes should add index premium
      const indexPremium: Record<string, number> = {
        '1.60': 20,  // SV 1.6 AR (£60) - SV 1.5 AR (£40) = £20
        '1.67': 60,  // SV 1.67 AR (£100) - SV 1.5 AR (£40) = £60
        '1.74': 100, // SV 1.74 AR (£140) - SV 1.5 AR (£40) = £100
      };
      price = indexPremium[thickness.code] || 0;
    } else {
      // Try to find base price and add premiums
      const baseKey = thickness.code === '1.50' 
        ? `${lensType.code} ${hasAr ? 'AR' : 'HC'}`
        : `${lensType.code} ${thickness.code} AR`;
      const basePrice = LENS_PRICE_LOOKUP[baseKey];
      
      if (basePrice !== undefined) {
        price = basePrice;
      } else {
        // Final fallback: return 0 for SV, or estimate for others
        price = lensType.code === 'SV' ? 0 : 0;
      }
    }
  }

  return price;
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
    if (coatingLabels.length > 0) {
      attributes.push({ key: 'Coatings', value: coatingLabels.join(', ') });
    }
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
