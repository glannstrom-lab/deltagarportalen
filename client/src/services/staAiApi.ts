/**
 * STA AI-utkast — wrappar /api/ai med STA-specifika funktioner
 *
 * Modell låst på openai/gpt-oss-120b enligt projektregel.
 */

import { callAI } from './aiApi'
import { fetchEnrollmentBundle, type DocumentType, type StaPart } from './staApi'

export interface DocumentDraftSections {
  [sectionKey: string]: {
    title: string
    content: string
  }
}

/**
 * Generera AI-utkast för ett specifikt dokument.
 * Tar `enrollmentId` + `docType` och returnerar strukturerade sektioner.
 */
export async function generateDocumentDraft(
  enrollmentId: string,
  docType: DocumentType,
): Promise<DocumentDraftSections | null> {
  const bundle = await fetchEnrollmentBundle(enrollmentId)
  if (!bundle) return null

  const response = await callAI<DocumentDraftSections>('sta-document-draft', {
    docType,
    bundle,
  })

  if (!response.success) {
    throw new Error(response.error ?? 'Kunde inte generera utkast')
  }

  return response.sections as DocumentDraftSections
}

/**
 * Generera veckosammanställning för en deltagare.
 */
export async function generateWeekSummary(enrollmentId: string): Promise<string | null> {
  const bundle = await fetchEnrollmentBundle(enrollmentId)
  if (!bundle) return null

  const response = await callAI<string>('sta-week-summary', { bundle })

  if (!response.success) {
    throw new Error(response.error ?? 'Kunde inte generera sammanställning')
  }

  return response.summary as string
}

/**
 * Mappa dokumenttyp → vilken del + svensk titel (för UI).
 */
export const DOC_TYPE_META: Record<
  DocumentType,
  { title: string; part: StaPart | null; afBlankett?: string }
> = {
  initial_planering: { title: 'Initial planering', part: 1 },
  delredovisning_1: { title: 'Delredovisning Del 1', part: 1, afBlankett: 'Af 00825 3.0' },
  delredovisning_2: { title: 'Delredovisning Del 2', part: 2, afBlankett: 'Af 00826 3.0' },
  delredovisning_3: { title: 'Delredovisning Del 3', part: 3, afBlankett: 'Af 00827 3.0' },
  delredovisning_4: { title: 'Slutredovisning Del 4', part: 4, afBlankett: 'Af 00828 3.0' },
  anmalan_arbetsprovning: { title: 'Anmälan arbetsprövning', part: null },
  information_arbetsprovning: { title: 'Information från arbetsprövningsplats', part: null },
  atgardsplan_utebliven_ap: { title: 'Åtgärdsplan vid utebliven arbetsprövning', part: 3 },
  informativ_rapport_hjalpmedel: { title: 'Informativ rapport om hjälpmedel', part: null },
}
