/**
 * CV Template Types
 */

import type { CVData } from '@/services/supabaseApi'

export interface TemplateProps {
  data: CVData
  fullName: string
}
