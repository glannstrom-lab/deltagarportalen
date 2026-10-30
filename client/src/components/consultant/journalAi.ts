/**
 * AIX11: märkningen som följer med en AI-formulerad journalpost. Journaltabellen har
 * inget fält för det (consultant_journal: category, consultant_id, contact_form, content,
 * created_at, id, occurred_at, participant_id, updated_at, updated_by — schema-snapshot
 * 2026-10-30, ingen migration gjord), så märkningen står i texten, där deltagaren som
 * läser journalen också ser den.
 */
export const AI_MARKERING = 'AI-formulerad, granskad'

export const medAiMarkering = (text: string): string => `${text.trim()}\n\n(${AI_MARKERING} av konsulenten)`
