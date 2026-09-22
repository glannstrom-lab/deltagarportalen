/**
 * Workflow-komponenter.
 *
 * - CreateApplicationModal: "Skapa ansökan"-flödet (JobSearch, SlumpjobbetTab)
 * - ContextualKnowledgeWidget: kontextuella artiklar (CVBuilder)
 *
 * NextStepWidget, QuickActionBanner (med JobTrackerActions, FloatingBackButton)
 * och SmartContextWidget raderade 2026-09-22 — noll anropare i src/. Barreln
 * höll dem "nåbara" för dödkodsskriptet, som följer re-exporter men inte
 * vilka namn som faktiskt importeras.
 */

export { CreateApplicationModal } from './CreateApplicationModal'
export { ContextualKnowledgeWidget } from './ContextualKnowledgeWidget'
