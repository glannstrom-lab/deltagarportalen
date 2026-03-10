/**
 * PDF Types
 * Separata typer för PDF-export för att undvika cirkulära beroenden
 * ANPASSAD för att matcha CVData från mockApi/supabaseApi
 */

// Types for CV data - MATCHAR mockApi.ts struktur
export interface CVData {
  id?: string;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  linkedIn?: string;
  portfolio?: string;
  summary?: string;
  workExperience: Array<{
    id?: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  education: Array<{
    id?: string;
    degree: string;
    school: string;
    field?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  skills: Array<{
    id?: string;
    name: string;
    level?: string | number;
    category?: 'technical' | 'soft' | 'language' | 'other' | string;
  }>;
  languages?: Array<{
    id?: string;
    language: string;
    level: string;
  }>;
  certificates?: Array<{
    id?: string;
    name: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
  }>;
  links?: Array<{
    id?: string;
    type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other';
    url: string;
    label?: string;
  }>;
  references?: Array<{
    id?: string;
    name: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
  }>;
  // UI settings
  template?: string;
  colorScheme?: string;
  font?: string;
  profileImage?: string | null;
}

// Types for job data - MATCHAR PlatsbankenJob struktur
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
