import type { CVData as CanonicalCVData } from '@/types/cv';
/**
 * PDF Types
 * MATCHAR EXAKT mockApi.ts struktur för CV-data
 */

// Skill can be either an object or a string (for backward compatibility)
export interface Skill {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  category: 'technical' | 'soft' | 'tool' | 'language' | 'other' | string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  field: string;
  location?: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Language {
  id: string;
  language: string;
  name?: string;  // For backward compatibility (old data used 'name')
  level: 'Grundläggande' | 'Medel' | 'Flytande' | 'Modersmål' | string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
}

export interface Link {
  id: string;
  type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other';
  url: string;
  label?: string;
}

export interface Reference {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
}

// KA4 (2026-09-12): PDF-lagrets CVData är en DERIVATION av den kanoniska
// `@/types/cv`, inte en egen definition. PDF-generatorn kräver att fälten
// finns (tomma strängar hellre än undefined), därför `-?` + `NonNullable`.
// `skills` tillåter strängform: äldre `cv_versions.data` kan bära den, och
// `utils/skillText.skillNamn` läser båda.
export type CVData = {
  [K in keyof Pick<
    CanonicalCVData,
    | 'firstName' | 'lastName' | 'title' | 'email' | 'phone' | 'location' | 'summary'
    | 'workExperience' | 'education' | 'languages' | 'certificates' | 'links' | 'references'
    | 'template' | 'colorScheme' | 'font'
  >]-?: NonNullable<CanonicalCVData[K]>
} & {
  id?: string;
  address?: string;
  profileImage: string | null;
  skills: (Skill | string)[];  // Can be objects or strings
};

// Types for job data - MATCHAR PlatsbankenJob
export interface JobData {
  id: string;
  headline: string;
  description?: {
    text: string;
    text_formatted?: string;
  };
  employer?: {
    name: string;
    workplace?: string;
    url?: string;
  };
  workplace_address?: {
    municipality: string;
    region: string;
    country?: string;
  };
  employment_type?: {
    label: string;
  };
  occupation?: {
    label: string;
    concept_id?: string;
  };
  application_details?: {
    reference?: string;
    email?: string;
    url?: string;
    information?: string;
  };
  publication_date: string;
  last_publication_date?: string;
  salary_description?: string;
  scope_of_work?: {
    min?: number;
    max?: number;
  };
}
