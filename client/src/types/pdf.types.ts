/**
 * PDF Types
 * Separata typer för PDF-export för att undvika cirkulära beroenden
 */

// Types for CV data
export interface CVData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  summary?: string;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

// Types for job data
export interface JobData {
  headline: string;
  description: {
    text: string;
  };
  employer: {
    name: string;
    workplace?: string;
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
  };
  application_details?: {
    reference?: string;
    email?: string;
    url?: string;
  };
  publication_date: string;
  last_publication_date?: string;
}
