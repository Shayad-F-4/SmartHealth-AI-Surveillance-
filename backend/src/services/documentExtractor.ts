const pdfParse = require('pdf-parse');

export interface ExtractedLabTest {
  testName: string;
  measuredValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  normalRangeMin: number | null;
  normalRangeMax: number | null;
  status: 'NORMAL' | 'ABNORMAL' | 'UNKNOWN';
}

export interface ExtractedDocumentData {
  documentType: 'LAB_REPORT' | 'PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'GENERAL_RECORD';
  extractedText: string;
  summary: string;
  diagnosis?: string | null;
  doctorName?: string | null;
  facilityName?: string | null;
  labTests: ExtractedLabTest[];
}

// Known common medical lab patterns
const COMMON_TEST_PATTERNS = [
  { name: 'Hemoglobin', regex: /hemoglobin\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 12.0, defaultMax: 17.5, unit: 'g/dL' },
  { name: 'WBC Count', regex: /(?:wbc|white blood cell count)\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 4000, defaultMax: 11000, unit: 'cells/mcL' },
  { name: 'RBC Count', regex: /(?:rbc|red blood cell count)\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 4.2, defaultMax: 6.1, unit: 'm/mcL' },
  { name: 'Platelets', regex: /platelets?\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 150000, defaultMax: 450000, unit: '/mcL' },
  { name: 'Fasting Blood Sugar', regex: /(?:fasting blood sugar|fasting glucose|fbs)\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 70, defaultMax: 99, unit: 'mg/dL' },
  { name: 'HbA1c', regex: /(?:hba1c|glycated hemoglobin)\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 4.0, defaultMax: 5.6, unit: '%' },
  { name: 'Total Cholesterol', regex: /(?:total cholesterol|cholesterol)\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 125, defaultMax: 200, unit: 'mg/dL' },
  { name: 'Triglycerides', regex: /triglycerides\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 35, defaultMax: 150, unit: 'mg/dL' },
  { name: 'Creatinine', regex: /creatinine\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 0.7, defaultMax: 1.3, unit: 'mg/dL' },
  { name: 'BUN (Blood Urea Nitrogen)', regex: /(?:bun|blood urea nitrogen)\s*[:\-]?\s*([\d\.]+)\s*([a-zA-Z\/%]+)?\s*(?:\(([\d\.\-\s]+)\))?/i, defaultMin: 7, defaultMax: 20, unit: 'mg/dL' },
];

export async function extractDocumentData(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<ExtractedDocumentData> {
  let text = '';

  if (mimeType === 'application/pdf') {
    try {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || '';
    } catch (e) {
      console.warn('PDF text extraction error:', e);
      text = '';
    }
  } else if (mimeType.startsWith('image/')) {
    // For images without external heavy Tesseract OCR binary, perform metadata/filename & text fallback string extraction if available
    text = `Scanned Medical Image Document: ${originalName}`;
  }

  // Detect document type
  let documentType: ExtractedDocumentData['documentType'] = 'GENERAL_RECORD';
  const lowerText = (text + ' ' + originalName).toLowerCase();

  if (lowerText.includes('lab') || lowerText.includes('report') || lowerText.includes('test') || lowerText.includes('blood') || lowerText.includes('panel')) {
    documentType = 'LAB_REPORT';
  } else if (lowerText.includes('prescription') || lowerText.includes('rx') || lowerText.includes('dosage') || lowerText.includes('medicine')) {
    documentType = 'PRESCRIPTION';
  } else if (lowerText.includes('discharge') || lowerText.includes('summary') || lowerText.includes('hospital')) {
    documentType = 'DISCHARGE_SUMMARY';
  }

  // Parse lab tests deterministically from text
  const labTests: ExtractedLabTest[] = [];

  for (const pattern of COMMON_TEST_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      const val = parseFloat(match[1]);
      const measuredValue = isNaN(val) ? null : val;
      const unit = match[2] ? match[2].trim() : pattern.unit;

      let min = pattern.defaultMin;
      let max = pattern.defaultMax;
      let refRangeStr = `${min} - ${max} ${unit}`;

      if (match[3]) {
        const rangeParts = match[3].split('-').map((s) => parseFloat(s.trim()));
        if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
          min = rangeParts[0];
          max = rangeParts[1];
          refRangeStr = match[3];
        }
      }

      let status: 'NORMAL' | 'ABNORMAL' | 'UNKNOWN' = 'UNKNOWN';
      if (measuredValue !== null) {
        if (measuredValue < min || measuredValue > max) {
          status = 'ABNORMAL';
        } else {
          status = 'NORMAL';
        }
      }

      labTests.push({
        testName: pattern.name,
        measuredValue,
        unit,
        referenceRange: refRangeStr,
        normalRangeMin: min,
        normalRangeMax: max,
        status,
      });
    }
  }

  // Generic key-value fallback parser for lines matching "TestName : 12.3 unit (min - max)"
  if (labTests.length === 0 && text.length > 0) {
    const genericLineRegex = /([a-zA-Z\s]{3,30})\s*:\s*([\d\.]+)\s*([a-zA-Z\/%]*)\s*(?:\(([\d\.]+)\s*-\s*([\d\.]+)\))?/g;
    let lineMatch;
    while ((lineMatch = genericLineRegex.exec(text)) !== null) {
      const name = lineMatch[1].trim();
      const val = parseFloat(lineMatch[2]);
      const unit = lineMatch[3]?.trim() || null;
      const min = lineMatch[4] ? parseFloat(lineMatch[4]) : null;
      const max = lineMatch[5] ? parseFloat(lineMatch[5]) : null;

      if (name && !isNaN(val)) {
        let status: 'NORMAL' | 'ABNORMAL' | 'UNKNOWN' = 'UNKNOWN';
        if (min !== null && max !== null) {
          status = val < min || val > max ? 'ABNORMAL' : 'NORMAL';
        }
        labTests.push({
          testName: name,
          measuredValue: val,
          unit,
          referenceRange: min !== null && max !== null ? `${min} - ${max} ${unit || ''}` : null,
          normalRangeMin: min,
          normalRangeMax: max,
          status,
        });
      }
    }
  }

  // Construct structured human-readable summary
  let summary = `Analyzed ${originalName}. Document classified as ${documentType.replace('_', ' ')}.`;
  if (labTests.length > 0) {
    const abnormalCount = labTests.filter((t) => t.status === 'ABNORMAL').length;
    summary += ` Extracted ${labTests.length} structured lab parameters (${abnormalCount} out-of-range).`;
  } else {
    summary += ` Document uploaded and stored successfully. No structured lab parameters automatically extracted.`;
  }

  // Extract optional metadata fields
  const doctorMatch = text.match(/(?:dr\.|doctor|physician)\s*([a-zA-Z\s\.]+)/i);
  const doctorName = doctorMatch ? doctorMatch[1].trim() : null;

  const facilityMatch = text.match(/(?:hospital|clinic|lab|center)\s*([a-zA-Z\s\.]+)/i);
  const facilityName = facilityMatch ? facilityMatch[1].trim() : null;

  return {
    documentType,
    extractedText: text.substring(0, 2000), // capped length
    summary,
    doctorName,
    facilityName,
    labTests,
  };
}
