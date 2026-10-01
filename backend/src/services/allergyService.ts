/**
 * Clinical Allergy Safety Engine
 * Cross-references medication names and active ingredient classes
 * against patient allergies to prevent adverse drug reactions.
 */

interface AllergyConflictResult {
  hasConflict: boolean;
  allergen?: string;
  matchedMedication?: string;
  warningMessage?: string;
}

// Medication allergy classes mapping
const ALLERGY_MAP: Record<string, string[]> = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'piperacillin', 'cloxacillin'],
  sulfa: ['sulfamethoxazole', 'bactrim', 'septra', 'sulfadiazine', 'sulfasalazine'],
  nsaid: ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'indomethacin'],
  cephalosporin: ['cephalexin', 'ceftriaxone', 'cefuroxime', 'cefazolin', 'cefixime'],
  macrolide: ['azithromycin', 'clarithromycin', 'erythromycin'],
  fluoroquinolone: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'norfloxacin'],
  tetracycline: ['doxycycline', 'tetracycline', 'minocycline'],
  paracetamol: ['paracetamol', 'acetaminophen', 'tylenol', 'crocin'],
  opioid: ['tramadol', 'codeine', 'morphine', 'oxycodone', 'fentanyl'],
};

export function checkAllergyConflict(patientAllergiesStr: string, medicineName: string): AllergyConflictResult {
  if (!patientAllergiesStr || !medicineName) {
    return { hasConflict: false };
  }

  const patientAllergies = patientAllergiesStr
    .toLowerCase()
    .split(/[,;\/]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const medLower = medicineName.toLowerCase().trim();

  for (const allergy of patientAllergies) {
    // Direct substring match
    if (medLower.includes(allergy) || allergy.includes(medLower)) {
      return {
        hasConflict: true,
        allergen: allergy,
        matchedMedication: medicineName,
        warningMessage: `CRITICAL ALLERGY ALERT: Patient has documented allergy to "${allergy}". Prescribed medication "${medicineName}" poses potential adverse reaction risk. Clinical review & explicit confirmation required.`,
      };
    }

    // Class-based lookup
    for (const [allergyClass, drugList] of Object.entries(ALLERGY_MAP)) {
      const allergyMatchesClass = allergy.includes(allergyClass) || allergyClass.includes(allergy);
      const drugMatchesList = drugList.some((drug) => medLower.includes(drug));

      if (allergyMatchesClass && drugMatchesList) {
        return {
          hasConflict: true,
          allergen: allergy,
          matchedMedication: medicineName,
          warningMessage: `ALLERGY CLASS CONFLICT: Patient is allergic to "${allergy}" (${allergyClass.toUpperCase()} class). "${medicineName}" is in this cross-reactive drug class. Doctor review required.`,
        };
      }
    }
  }

  return { hasConflict: false };
}
