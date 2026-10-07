import prisma from '../config/prisma';
import { EmbeddingService } from './embeddingService';

export interface KnowledgeChunkInput {
  section: string;
  subsection?: string;
  page?: number;
  topic: string;
  content: string;
}

export interface DocumentToIngest {
  title: string;
  source: string;
  sourceUrl?: string;
  documentVersion?: string;
  category?: string;
  chunks: KnowledgeChunkInput[];
}

export const KnowledgeIngestionService = {
  /**
   * Ingests a new document with clean semantic chunking and embedding generation.
   */
  async ingestDocument(doc: DocumentToIngest): Promise<string> {
    const document = await prisma.knowledgeDocument.create({
      data: {
        title: doc.title,
        source: doc.source,
        sourceUrl: doc.sourceUrl || null,
        documentVersion: doc.documentVersion || '1.0',
        category: doc.category || 'General Medicine',
        status: 'TRUSTED',
      },
    });

    for (const chunk of doc.chunks) {
      const embedding = await EmbeddingService.generateEmbedding(
        `${doc.title} - ${chunk.topic} - ${chunk.section}: ${chunk.content}`
      );

      await prisma.knowledgeChunk.create({
        data: {
          documentId: document.id,
          section: chunk.section,
          subsection: chunk.subsection || null,
          page: chunk.page || null,
          topic: chunk.topic,
          content: chunk.content,
          embedding: JSON.stringify(embedding),
          metadata: JSON.stringify({
            title: doc.title,
            source: doc.source,
            sourceUrl: doc.sourceUrl,
            category: doc.category,
          }),
        },
      });
    }

    return document.id;
  },

  /**
   * Ensures the foundational, authoritative medical knowledge corpus is seeded in PostgreSQL.
   */
  async ensureCorpusSeeded(): Promise<void> {
    const count = await prisma.knowledgeDocument.count();
    if (count > 0) {
      return; // Corpus already initialized
    }

    console.log('[KnowledgeIngestion] Seeding foundational medical knowledge corpus (WHO/CDC/NIH/MedlinePlus)...');

    const foundationalCorpus: DocumentToIngest[] = [
      // 1. HYPERTENSION CLINICAL GUIDELINE
      {
        title: 'Clinical Practice Guideline for High Blood Pressure in Adults',
        source: 'WHO / American Heart Association',
        sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hypertension',
        documentVersion: '2024-Update',
        category: 'Cardiovascular',
        chunks: [
          {
            section: 'Classification and Diagnostic Thresholds',
            topic: 'Hypertension Diagnostic Stages',
            content: `Blood pressure is categorized into four primary clinical stages based on seated resting measurements:
1. Normal Blood Pressure: Systolic less than 120 mmHg AND Diastolic less than 80 mmHg.
2. Elevated Blood Pressure: Systolic 120–129 mmHg AND Diastolic less than 80 mmHg.
3. Stage 1 Hypertension: Systolic 130–139 mmHg OR Diastolic 80–89 mmHg.
4. Stage 2 Hypertension: Systolic 140 mmHg or higher OR Diastolic 90 mmHg or higher.
5. Hypertensive Crisis: Systolic exceeding 180 mmHg and/or Diastolic exceeding 120 mmHg, requiring immediate clinical evaluation.`,
          },
          {
            section: 'Symptoms and Complications',
            topic: 'Hypertension Symptoms and End-Organ Damage',
            content: `Hypertension is frequently termed the 'silent killer' because the vast majority of hypertensive individuals exhibit no overt symptoms. When severe, patients may experience early morning headaches, dizziness, epistaxis (nosebleeds), visual disturbances, and dyspnea. Untreated chronic hypertension causes accelerated atherosclerosis, coronary heart disease, congestive heart failure, stroke, chronic kidney disease (CKD), and retinopathy.`,
          },
          {
            section: 'Lifestyle and Clinical Interventions',
            topic: 'Hypertension Management and Dietary Protocols',
            content: `First-line management for elevated blood pressure and Stage 1 hypertension emphasizes lifestyle modifications:
- Dietary Approaches to Stop Hypertension (DASH diet): high in vegetables, fruits, whole grains, and low-fat dairy.
- Sodium restriction: limit daily dietary sodium intake to less than 2,000 mg/day (ideally <1,500 mg/day).
- Physical activity: at least 150 minutes of moderate-intensity aerobic exercise per week.
- Weight reduction: maintaining a target BMI of 18.5 to 24.9 kg/m².
- Pharmacological management: ACE inhibitors, Angiotensin Receptor Blockers (ARBs), Calcium Channel Blockers (CCBs), or thiazide diuretics as directed by a clinician.`,
          },
        ],
      },

      // 2. HBA1C & DIABETES MANAGEMENT
      {
        title: 'Standards of Medical Care in Diabetes: Glycemic Targets and Classification',
        source: 'American Diabetes Association / CDC',
        sourceUrl: 'https://medlineplus.gov/a1c.html',
        documentVersion: '2024-ADA-CDC',
        category: 'Metabolic',
        chunks: [
          {
            section: 'Hemoglobin A1c (HbA1c) Definition and Reference Ranges',
            topic: 'HbA1c Test Interpretation',
            content: `The Hemoglobin A1c (HbA1c or glycated hemoglobin) test quantifies the average percentage of blood glucose bound to hemoglobin over the preceding 2 to 3 months, reflecting the approximate 120-day lifespan of red blood cells.
Standard diagnostic interpretation:
- Normal (Non-diabetic): HbA1c less than 5.7% (<39 mmol/mol).
- Prediabetes: HbA1c between 5.7% and 6.4% (39–47 mmol/mol), indicating elevated risk for progression to diabetes and cardiovascular disease.
- Diabetes Mellitus: HbA1c of 6.5% or higher (>=48 mmol/mol) confirmed on repeated testing.
- Glycemic Target: For most non-pregnant adults with diagnosed diabetes, an HbA1c target of less than 7.0% (<53 mmol/mol) is recommended to minimize microvascular complications.`,
          },
          {
            section: 'Differentiation Between Type 1 and Type 2 Diabetes',
            topic: 'Type 1 vs Type 2 Diabetes Mellitus',
            content: `Diabetes Mellitus comprises distinct metabolic disorders:
- Type 1 Diabetes: Characterized by autoimmune destruction of insulin-producing pancreatic beta cells, typically diagnosed in children or young adults, resulting in absolute insulin deficiency. Patients require lifelong exogenous insulin therapy and daily glucose monitoring to prevent diabetic ketoacidosis (DKA).
- Type 2 Diabetes: Accounts for approximately 90-95% of diabetes cases. It stems from progressive peripheral insulin resistance coupled with relative secretory beta-cell failure. Frequently linked to excess adiposity, sedentary lifestyle, and genetic predisposition. First-line therapies include medical nutrition therapy, regular exercise, metformin, SGLT2 inhibitors, GLP-1 receptor agonists, and insulin when required.`,
          },
          {
            section: 'Complications and Chronic Monitoring',
            topic: 'Diabetes Long-Term Complications',
            content: `Persistent hyperglycemia induces systemic microvascular and macrovascular damage:
- Microvascular: Diabetic retinopathy (leading cause of adult blindness), diabetic nephropathy (leading cause of end-stage renal disease), and peripheral/autonomic neuropathy (numbness, tingling, gastroparesis).
- Macrovascular: Accelerated peripheral arterial disease, myocardial infarction, and ischemic stroke. Regular foot examinations, annual dilated eye exams, and urinary albumin-to-creatinine ratio (uACR) screening are essential preventive standards.`,
          },
        ],
      },

      // 3. LIPID PROFILE & CHOLESTEROL
      {
        title: 'Clinical Guide to Serum Cholesterol and Lipid Management',
        source: 'National Institutes of Health (NIH) / MedlinePlus',
        sourceUrl: 'https://medlineplus.gov/cholesterol.html',
        documentVersion: 'NIH-NHLBI-2024',
        category: 'Cardiovascular',
        chunks: [
          {
            section: 'Lipid Profile Components and Normal Ranges',
            topic: 'Cholesterol and Lipid Fractions',
            content: `A complete fasting lipid panel measures four major serum biomarkers:
1. Total Cholesterol: Desirable less than 200 mg/dL; Borderline high 200–239 mg/dL; High 240 mg/dL or greater.
2. Low-Density Lipoprotein (LDL-C): Often termed 'bad cholesterol' because it deposits cholesterol into arterial walls forming atheromatous plaques. Optimal: <100 mg/dL; Near optimal: 100–129 mg/dL; Borderline: 130–159 mg/dL; High: 160–189 mg/dL; Very high: >=190 mg/dL.
3. High-Density Lipoprotein (HDL-C): Termed 'good/protective cholesterol' as it transports peripheral cholesterol back to the liver for excretion (reverse cholesterol transport). Desirable: >=40 mg/dL for men, >=50 mg/dL for women; Protective against cardiovascular disease: >=60 mg/dL.
4. Serum Triglycerides: Normal: <150 mg/dL; Borderline high: 150–199 mg/dL; High: 200–499 mg/dL; Very high: >=500 mg/dL (heightened risk of acute pancreatitis).`,
          },
          {
            section: 'Etiology and Therapeutic Interventions',
            topic: 'Dyslipidemia Management and Atherosclerosis Prevention',
            content: `Elevated LDL cholesterol and hypertriglyceridemia are major modifiable risk factors for ischemic heart disease and atherosclerotic cardiovascular events. Therapeutic lifestyle changes include substituting saturated and trans-fats with monounsaturated/polyunsaturated fats (Mediterranean diet), increasing soluble dietary fiber, smoking cessation, and weight management. When 10-year cardiovascular risk is elevated, HMG-CoA reductase inhibitors (statins) are the evidence-based medical standard.`,
          },
        ],
      },

      // 4. ANEMIA & COMPLETE BLOOD COUNT (CBC)
      {
        title: 'Nutritional and Hematologic Guidelines on Anemia and Hemoglobin',
        source: 'WHO / MedlinePlus',
        sourceUrl: 'https://medlineplus.gov/anemia.html',
        documentVersion: 'WHO-Anemia-2024',
        category: 'Hematology',
        chunks: [
          {
            section: 'Definition, Diagnostic Cut-offs, and Hemoglobin',
            topic: 'Hemoglobin Norms and Anemia Diagnosis',
            content: `Anemia is defined as a reduction in the total circulating red blood cell (RBC) mass or a decline in blood hemoglobin concentration below age- and sex-adjusted physiological thresholds:
- Adult Males: Hemoglobin normal range is 13.5 to 17.5 g/dL (anemia defined as <13.0 g/dL).
- Adult Non-pregnant Females: Hemoglobin normal range is 12.0 to 15.5 g/dL (anemia defined as <12.0 g/dL).
- Pregnant Females: Anemia defined as Hemoglobin <11.0 g/dL.
Hematocrit (Hct) represents the volume percentage of red blood cells in blood: normal ranges are 41-50% for men and 36-44% for women.`,
          },
          {
            section: 'Etiologies and Clinical Presentation',
            topic: 'Anemia Types and Symptoms',
            content: `Common clinical manifestations of anemia include generalized fatigue, pallor (pale skin, conjunctiva, nailbeds), exertional dyspnea, postural dizziness, cold extremities, and palpitations.
Major subtypes:
- Iron Deficiency Anemia (Microcytic, hypochromic): Most common global cause, caused by chronic blood loss (e.g. gastrointestinal, menorrhagia) or inadequate dietary iron absorption.
- Vitamin B12 and Folate Deficiency (Macrocytic / Megaloblastic): Pernicious anemia or dietary insufficiency leading to enlarged red cells and possible peripheral neuropathy.
- Anemia of Chronic Disease: Associated with chronic inflammatory states, infections, or renal impairment.`,
          },
        ],
      },

      // 5. VECTOR-BORNE CONTAGIOUS DISEASES (MALARIA & DENGUE)
      {
        title: 'Public Health Surveillance and Clinical Management of Malaria and Dengue',
        source: 'WHO / CDC',
        sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/malaria',
        documentVersion: 'WHO-VBD-2024',
        category: 'Infectious Disease',
        chunks: [
          {
            section: 'Malaria Transmission, Symptoms, and Diagnostics',
            topic: 'Malaria Clinical Overview',
            content: `Malaria is a life-threatening protozoan infection caused by Plasmodium parasites (P. falciparum, P. vivax, P. malariae, P. ovale) transmitted through the nocturnal bites of infected female Anopheles mosquitoes.
- Symptoms: Classical paroxysms of shaking chills, high-spiking intermittent fever, profuse diaphoresis (sweating), headache, malaise, vomiting, and hepatosplenomegaly. Incubation period ranges from 7 to 30 days.
- Diagnostics: Rapid Diagnostic Tests (RDT) detecting parasite antigen, and Giemsa-stained peripheral blood smear microscopy.
- Treatment: Artemisinin-based Combination Therapies (ACT) are first-line. Prompt clinical management is essential to avert severe cerebral malaria, acute respiratory distress, and severe hemolytic anemia.`,
          },
          {
            section: 'Dengue Fever and Warning Signs',
            topic: 'Dengue Fever and Severe Dengue',
            content: `Dengue is an acute febrile arboviral illness caused by four dengue virus serotypes (DENV 1-4) transmitted primarily by diurnal female Aedes aegypti mosquitoes.
- Symptoms: Abrupt onset of high fever, severe retro-orbital (behind the eye) headache, intense arthralgia and myalgia ('breakbone fever'), nausea, and maculopapular rash appearing 3-5 days post-onset.
- Critical Phase & Warning Signs: Severe dengue (dengue hemorrhagic fever) occurs around the time fever drops (days 3-7). Warning signs requiring emergent hospitalization include persistent vomiting, severe abdominal pain, mucosal bleeding (gums, epistaxis), lethargy, and clinical fluid accumulation.`,
          },
        ],
      },
    ];

    for (const doc of foundationalCorpus) {
      await this.ingestDocument(doc);
    }

    console.log(`[KnowledgeIngestion] Successfully seeded ${foundationalCorpus.length} authoritative medical documents.`);
  },

  /**
   * Retrieves list of knowledge documents with chunk counts.
   */
  async listDocuments() {
    return prisma.knowledgeDocument.findMany({
      include: {
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Retrieves single document with all its chunks.
   */
  async getDocument(id: string) {
    return prisma.knowledgeDocument.findUnique({
      where: { id },
      include: {
        chunks: true,
      },
    });
  },

  /**
   * Toggles document status (TRUSTED, UNVERIFIED, DISABLED)
   */
  async updateDocumentStatus(id: string, status: 'TRUSTED' | 'UNVERIFIED' | 'DISABLED') {
    return prisma.knowledgeDocument.update({
      where: { id },
      data: { status },
    });
  },

  /**
   * Recomputes embeddings for all chunks in the knowledge base.
   */
  async reindexCorpus(): Promise<{ totalReindexed: number }> {
    const chunks = await prisma.knowledgeChunk.findMany({
      include: { document: true },
    });

    let count = 0;
    for (const chunk of chunks) {
      const textToEmbed = `${chunk.document.title} - ${chunk.topic} - ${chunk.section}: ${chunk.content}`;
      const newEmbedding = await EmbeddingService.generateEmbedding(textToEmbed);
      await prisma.knowledgeChunk.update({
        where: { id: chunk.id },
        data: { embedding: JSON.stringify(newEmbedding) },
      });
      count++;
    }

    return { totalReindexed: count };
  },
};
