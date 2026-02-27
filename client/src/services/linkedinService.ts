/**
 * LinkedIn Integration Service
 * Hanterar import av profildata från LinkedIn
 * 
 * Notering: Full LinkedIn-integration kräver OAuth2 och LinkedIn API-v1/v2.
 * Detta är en struktur som kan byggas ut när API-åtkomst finns.
 */

import type { CVData } from '@/types/pdf.types';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  summary?: string;
  location?: {
    city?: string;
    country?: string;
  };
  industry?: string;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: { month?: number; year: number };
    endDate?: { month?: number; year: number };
    current: boolean;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate: { year: number };
    endDate?: { year: number };
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    proficiency?: string;
  }>;
  certifications?: Array<{
    name: string;
    authority?: string;
    date?: { month: number; year: number };
  }>;
  projects?: Array<{
    title: string;
    description?: string;
    url?: string;
  }>;
}

/**
 * Konvertera LinkedIn-profil till CV-format
 */
export function convertLinkedInToCV(profile: LinkedInProfile): Partial<CVData> {
  return {
    personalInfo: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      city: profile.location?.city,
    },
    summary: profile.summary || profile.headline,
    experience: profile.experience.map(exp => ({
      title: exp.title,
      company: exp.company,
      location: exp.location,
      startDate: `${exp.startDate.year}-${String(exp.startDate.month || 1).padStart(2, '0')}`,
      endDate: exp.current ? undefined : exp.endDate 
        ? `${exp.endDate.year}-${String(exp.endDate.month || 1).padStart(2, '0')}`
        : undefined,
      current: exp.current,
      description: exp.description || '',
    })),
    education: profile.education.map(edu => ({
      degree: edu.degree || '',
      school: edu.school,
      startDate: String(edu.startDate.year),
      endDate: edu.endDate ? String(edu.endDate.year) : undefined,
      description: edu.fieldOfStudy,
    })),
    skills: profile.skills,
    languages: profile.languages.map(lang => ({
      language: lang.language,
      level: lang.proficiency || 'Grundläggande',
    })),
    certifications: profile.certifications?.map(cert => ({
      name: cert.name,
      issuer: cert.authority || '',
      date: cert.date 
        ? `${cert.date.year}-${String(cert.date.month).padStart(2, '0')}`
        : '',
    })),
  };
}

/**
 * Simulerad LinkedIn-profil för demo
 * (Ersätts med faktiskt API-anrop när åtkomst finns)
 */
export function getMockLinkedInProfile(): LinkedInProfile {
  return {
    id: 'mock-profile',
    firstName: 'Anna',
    lastName: 'Andersson',
    email: 'anna.andersson@email.com',
    headline: 'Erfaren projektledare inom IT',
    summary: 'Driven projektledare med 5 års erfarenhet av agila metoder och teamledning. Brinner för att skapa effektiva team och leverera framgångsrika projekt.',
    location: { city: 'Stockholm', country: 'Sverige' },
    industry: 'Informationsteknik',
    experience: [
      {
        title: 'Projektledare',
        company: 'Tech Solutions AB',
        location: 'Stockholm',
        startDate: { month: 3, year: 2021 },
        current: true,
        description: 'Leder utvecklingsteam och koordinerar projekt från start till mål. Ansvarig för budget, tidsplan och kundkontakt.',
      },
      {
        title: 'Systemutvecklare',
        company: 'Digitalbyrån Sverige',
        location: 'Göteborg',
        startDate: { month: 6, year: 2018 },
        endDate: { month: 2, year: 2021 },
        current: false,
        description: 'Fullstack-utveckling med fokus på React och Node.js. Arbetade med kundprojekt för stora företag.',
      },
    ],
    education: [
      {
        school: 'KTH Royal Institute of Technology',
        degree: 'Civilingenjör',
        fieldOfStudy: 'Datateknik',
        startDate: { year: 2013 },
        endDate: { year: 2018 },
      },
    ],
    skills: [
      'Projektledning',
      'Agila metoder',
      'Scrum',
      'React',
      'Node.js',
      'Kommunikation',
      'Teamledning',
      'Budgetering',
    ],
    languages: [
      { language: 'Svenska', proficiency: 'Modersmål' },
      { language: 'Engelska', proficiency: 'Flytande' },
      { language: 'Tyska', proficiency: 'Grundläggande' },
    ],
    certifications: [
      {
        name: 'Certified Scrum Master',
        authority: 'Scrum Alliance',
        date: { month: 5, year: 2022 },
      },
    ],
  };
}

/**
 * Initiera LinkedIn OAuth-inloggning
 * (Struktur för framtida implementation)
 */
export function initiateLinkedInAuth(): void {
  // Konfiguration för LinkedIn OAuth
  const CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/linkedin/callback`;
  const SCOPE = 'r_liteprofile r_emailaddress r_basicprofile';
  const STATE = generateRandomState();

  // Spara state för validering
  sessionStorage.setItem('linkedin_oauth_state', STATE);

  // Bygg OAuth-URL
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SCOPE)}&` +
    `state=${STATE}`;

  // Omdirigera till LinkedIn
  window.location.href = authUrl;
}

/**
 * Hantera OAuth callback från LinkedIn
 */
export async function handleLinkedInCallback(
  code: string,
  state: string
): Promise<LinkedInProfile | null> {
  // Validera state
  const savedState = sessionStorage.getItem('linkedin_oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }

  // Rensa state
  sessionStorage.removeItem('linkedin_oauth_state');

  // I en verklig implementation: Byta code mot access token
  // och sedan hämta profildata
  
  // För demo: Returnera mock-profil
  console.log('LinkedIn auth successful (mock)');
  return getMockLinkedInProfile();
}

/**
 * Generera slumpmässig state-parameter för OAuth
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Koppla samman LinkedIn-profil med befintligt CV
 * (Slår samman data utan att skriva över manuellt inmatad info)
 */
export function mergeLinkedInWithCV(
  linkedInProfile: LinkedInProfile,
  existingCV: Partial<CVData>
): CVData {
  const linkedInCV = convertLinkedInToCV(linkedInProfile);

  return {
    personalInfo: {
      ...linkedInCV.personalInfo!,
      ...existingCV.personalInfo,
    },
    summary: existingCV.summary || linkedInCV.summary,
    experience: linkedInCV.experience || existingCV.experience || [],
    education: linkedInCV.education || existingCV.education || [],
    skills: [...new Set([...(linkedInCV.skills || []), ...(existingCV.skills || [])])],
    languages: linkedInCV.languages || existingCV.languages || [],
    certifications: [
      ...(linkedInCV.certifications || []),
      ...(existingCV.certifications || []),
    ],
  } as CVData;
}

/**
 * Kolla om LinkedIn-integration är tillgänglig
 */
export function isLinkedInIntegrationAvailable(): boolean {
  return !!import.meta.env.VITE_LINKEDIN_CLIENT_ID;
}

/**
 * Dela jobb på LinkedIn
 * (Öppnar delningsdialog)
 */
export function shareJobOnLinkedIn(jobTitle: string, jobUrl: string): void {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
  window.open(shareUrl, '_blank', 'width=600,height=400');
}

/**
 * Uppdatera LinkedIn-status
 * (Om vi har API-åtkomst för detta i framtiden)
 */
export async function updateLinkedInStatus(message: string): Promise<boolean> {
  // Detta kräver w_member_social scope
  console.log('Would update LinkedIn status:', message);
  return true;
}
