/**
 * Prescription Validation Logic
 * Implements the prescription selection and validation specification
 */

/**
 * Calculate effective SPH based on usage type
 */
function calculateEffectiveSPH(sph, usageType, intermediateAdd, nearAdd) {
  const sphValue = parseFloat(sph) || 0;
  
  switch (usageType) {
    case 'Distance':
      return sphValue;
    case 'Intermediate':
      const interAdd = parseFloat(intermediateAdd) || 0;
      return sphValue + interAdd;
    case 'Reading':
      const nearAddValue = parseFloat(nearAdd) || 0;
      return sphValue + nearAddValue;
    default:
      return sphValue;
  }
}

/**
 * Calculate meridians for an eye
 * Returns: { m1: number, m2: number, highestMeridian: number }
 */
function calculateMeridians(sph, cyl, usageType, intermediateAdd, nearAdd) {
  const sphUsed = calculateEffectiveSPH(sph, usageType, intermediateAdd, nearAdd);
  const cylValue = parseFloat(cyl) || 0;
  
  const m1 = sphUsed;
  const m2 = sphUsed + cylValue;
  
  // Find highest meridian (greatest absolute value)
  const absM1 = Math.abs(m1);
  const absM2 = Math.abs(m2);
  const highestMeridian = absM1 > absM2 ? m1 : m2;
  
  return { m1, m2, highestMeridian };
}

/**
 * Validate prescription for a single eye
 * Returns: { valid: boolean, error: string }
 */
function validateEyePrescription(sph, cyl, axis, usageType, intermediateAdd, nearAdd, eyeLabel) {
  // Check if SPH is provided
  if (!sph || sph === '') {
    return { valid: false, error: `${eyeLabel}: SPH is required` };
  }
  
  // Check if CYL is provided and not 0, then AXIS is required
  if (cyl && cyl !== '' && cyl !== '0.00' && parseFloat(cyl) !== 0) {
    if (!axis || axis === '') {
      return { valid: false, error: `${eyeLabel}: AXIS is required when CYL is not zero` };
    }
    const axisValue = parseInt(axis);
    if (isNaN(axisValue) || axisValue < 1 || axisValue > 180) {
      return { valid: false, error: `${eyeLabel}: AXIS must be between 1 and 180` };
    }
  }
  
  // Calculate meridians
  const { highestMeridian } = calculateMeridians(sph, cyl, usageType, intermediateAdd, nearAdd);
  
  // Validate power limit: highest meridian must be ≤ ±5.00
  const absHighest = Math.abs(highestMeridian);
  if (absHighest > 5.00) {
    return {
      valid: false,
      error: `${eyeLabel}: This prescription exceeds our manufacturing limits (maximum ±5.00 in any meridian). The highest meridian is ${highestMeridian.toFixed(2)}.`
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate complete prescription
 * Returns: { valid: boolean, errors: string[] }
 */
function validatePrescription(prescription, usageType) {
  const errors = [];
  
  // Validate right eye
  const rightValidation = validateEyePrescription(
    prescription.r_sph,
    prescription.r_cyl,
    prescription.r_axis,
    usageType,
    prescription.intermediate_add,
    prescription.near_add,
    'Right Eye'
  );
  if (!rightValidation.valid) {
    errors.push(rightValidation.error);
  }
  
  // Validate left eye
  const leftValidation = validateEyePrescription(
    prescription.l_sph,
    prescription.l_cyl,
    prescription.l_axis,
    usageType,
    prescription.intermediate_add,
    prescription.near_add,
    'Left Eye'
  );
  if (!leftValidation.valid) {
    errors.push(leftValidation.error);
  }
  
  // Validate CYL signs match
  const rightCyl = prescription.r_cyl ? parseFloat(prescription.r_cyl) : 0;
  const leftCyl = prescription.l_cyl ? parseFloat(prescription.l_cyl) : 0;
  
  // Both CYL values must have the same sign (both positive, both negative, or both zero)
  if (rightCyl !== 0 && leftCyl !== 0) {
    const rightSign = rightCyl > 0 ? 'positive' : 'negative';
    const leftSign = leftCyl > 0 ? 'positive' : 'negative';
    
    if (rightSign !== leftSign) {
      errors.push('Both eyes must have the same CYL sign (both positive or both negative).');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

