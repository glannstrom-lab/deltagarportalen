/**
 * Workflow Components - Fas 1 & 2 Integration
 * 
 * Komponenter för smidigare deltagarresa:
 * 
 * FAS 1:
 * - CreateApplicationModal: "Skapa Ansökan"-flöde
 * - NextStepWidget: Dashboard widget för nästa steg
 * - QuickActionBanner: Kontextuella snabbåtgärder
 * 
 * FAS 2:
 * - ContextualKnowledgeWidget: Kontextuella artiklar
 * - SmartContextWidget: Smarta rekommendationer baserat på status
 */

export { CreateApplicationModal } from './CreateApplicationModal'
export { NextStepWidget } from './NextStepWidget'
export { 
  QuickActionBanner, 
  JobTrackerActions,
  FloatingBackButton 
} from './QuickActionBanner'
export { 
  ContextualKnowledgeWidget,
  SmartContextWidget 
} from './ContextualKnowledgeWidget'
