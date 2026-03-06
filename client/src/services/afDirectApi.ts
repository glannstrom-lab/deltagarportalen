/**
 * Direkta API-anrop till Arbetsförmedlingen (CORS tillåtet)
 * Ingen proxy eller edge functions behövs!
 */

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';
const CACHE_TTL = 2 * 60 * 1000; // 2 minuter

const cache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache(url: string): Promise<any> {
  const now = Date.now();
  const cached = cache.get(url);
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'JobIn/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  cache.set(url, { data, timestamp: now });
  return data;
}

/**
 * Hämta lönestatistik från jobbannonser
 * Parsar löneinformation från AF JobSearch API
 */
export interface SalaryStats {
  occupation: string;
  median_salary: number;
  percentile_25: number;
  percentile_75: number;
  by_region: Array<{
    region: string;
    median_salary: number;
    job_count: number;
  }>;
  by_experience: Array<{
    experience_years: string;
    median_salary: number;
  }>;
  sample_size: number;
  source: string;
}

export async function getSalaryStats(occupation: string): Promise<SalaryStats | null> {
  try {
    // Sök efter jobb med löneinformation
    const searchUrl = `${AF_JOBSEARCH_BASE}/search?q=${encodeURIComponent(occupation)}&limit=100`;
    const data = await fetchWithCache(searchUrl);
    
    const jobs = data.hits || [];
    const salaries: number[] = [];
    const regionMap = new Map<string, number[]>();
    const experienceMap = new Map<string, number[]>();
    
    jobs.forEach((job: any) => {
      // Extrahera lön från salary_description eller wage_type
      const salaryText = job.salary_description || '';
      const wageType = job.wage_type?.label || '';
      
      const parsedSalary = parseSalaryFromText(salaryText, wageType);
      
      if (parsedSalary && parsedSalary > 20000 && parsedSalary < 150000) {
        salaries.push(parsedSalary);
        
        // Gruppera per region
        const region = job.workplace_address?.region || 'Okänd region';
        if (!regionMap.has(region)) regionMap.set(region, []);
        regionMap.get(region)!.push(parsedSalary);
        
        // Gruppera efter erfarenhet (baserat på text)
        const exp = estimateExperienceLevel(job.description?.text || '', job.headline || '');
        if (!experienceMap.has(exp)) experienceMap.set(exp, []);
        experienceMap.get(exp)!.push(parsedSalary);
      }
    });
    
    if (salaries.length === 0) {
      return null;
    }
    
    // Beräkna percentiler
    salaries.sort((a, b) => a - b);
    const median = calculatePercentile(salaries, 0.5);
    const p25 = calculatePercentile(salaries, 0.25);
    const p75 = calculatePercentile(salaries, 0.75);
    
    // Beräkna per region
    const byRegion = Array.from(regionMap.entries())
      .map(([region, regionSalaries]) => ({
        region,
        median_salary: calculatePercentile(regionSalaries.sort((a, b) => a - b), 0.5),
        job_count: regionSalaries.length
      }))
      .sort((a, b) => b.job_count - a.job_count)
      .slice(0, 10); // Topp 10 regioner
    
    // Beräkna per erfarenhet
    const experienceOrder = ['0-2 år', '3-5 år', '6-8 år', '9+ år'];
    const byExperience = experienceOrder
      .filter(exp => experienceMap.has(exp))
      .map(exp => {
        const expSalaries = experienceMap.get(exp)!;
        return {
          experience_years: exp,
          median_salary: calculatePercentile(expSalaries.sort((a, b) => a - b), 0.5)
        };
      });
    
    return {
      occupation,
      median_salary: Math.round(median),
      percentile_25: Math.round(p25),
      percentile_75: Math.round(p75),
      by_region: byRegion,
      by_experience: byExperience.length > 0 ? byExperience : [
        { experience_years: '0-2 år', median_salary: Math.round(median * 0.85) },
        { experience_years: '3-5 år', median_salary: Math.round(median) },
        { experience_years: '6+ år', median_salary: Math.round(median * 1.15) }
      ],
      sample_size: salaries.length,
      source: 'Arbetsförmedlingen JobSearch API'
    };
  } catch (error) {
    console.error('Fel vid hämtning av lönestatistik:', error);
    return null;
  }
}

/**
 * Parsa lön från text
 */
function parseSalaryFromText(salaryText: string, wageType: string): number | null {
  if (!salaryText && !wageType) return null;
  
  const text = `${salaryText} ${wageType}`.toLowerCase();
  
  // Matcha mönster som "45 000 kr", "45000", "45.000", "45 000-50 000"
  const patterns = [
    /(\d{2})\s*[\s.]\s*(\d{3})/, // 45 000 eller 45.000
    /(\d{5})/, // 45000
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const salary = parseInt(match[0].replace(/[\s.]/g, ''));
      if (salary >= 20000 && salary <= 150000) {
        return salary;
      }
    }
  }
  
  return null;
}

/**
 * Beräkna percentil
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  const index = (sortedArray.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sortedArray.length) return sortedArray[lower];
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Uppskatta erfarenhetsnivå från jobbtext
 */
function estimateExperienceLevel(description: string, headline: string): string {
  const text = `${headline} ${description}`.toLowerCase();
  
  // Sök efter erfarenhetsmönster
  if (text.includes('senior') || text.includes('erfaren') || text.includes('5+') || text.includes('minst 5')) {
    return '6-8 år';
  }
  if (text.includes('junior') || text.includes('junior') || text.includes('nyexaminerad') || text.includes('0-2')) {
    return '0-2 år';
  }
  if (text.includes('3-5') || text.includes('3 år') || text.includes('4 år') || text.includes('5 år')) {
    return '3-5 år';
  }
  if (text.includes('8+') || text.includes('10+') || text.includes('lång erfarenhet')) {
    return '9+ år';
  }
  
  // Default
  return '3-5 år';
}

/**
 * Hämta kompetenser som efterfrågas för ett yrke
 */
export interface CompetencyStat {
  name: string;
  category: 'technical' | 'soft' | 'certification' | 'language';
  frequency: number;
  top_employers: string[];
}

export async function getCompetencyStats(occupation: string): Promise<CompetencyStat[]> {
  try {
    const searchUrl = `${AF_JOBSEARCH_BASE}/search?q=${encodeURIComponent(occupation)}&limit=100`;
    const data = await fetchWithCache(searchUrl);
    
    const jobs = data.hits || [];
    const skillMap = new Map<string, { count: number; employers: Set<string>; category: CompetencyStat['category'] }>();
    
    // Vanliga kompetenser att söka efter
    const skillPatterns: Record<string, { category: CompetencyStat['category']; patterns: string[] }> = {
      'JavaScript': { category: 'technical', patterns: ['javascript', 'js', 'es6', 'typescript', 'ts'] },
      'Python': { category: 'technical', patterns: ['python'] },
      'React': { category: 'technical', patterns: ['react', 'reactjs', 'react.js'] },
      'Node.js': { category: 'technical', patterns: ['node.js', 'nodejs', 'node'] },
      'SQL': { category: 'technical', patterns: ['sql', 'mysql', 'postgresql', 'database'] },
      'Git': { category: 'technical', patterns: ['git', 'github', 'gitlab', 'versionshantering'] },
      'Docker': { category: 'technical', patterns: ['docker', 'kubernetes', 'container'] },
      'AWS': { category: 'technical', patterns: ['aws', 'amazon web services', 'cloud'] },
      'Azure': { category: 'technical', patterns: ['azure', 'microsoft azure'] },
      'Java': { category: 'technical', patterns: ['java', 'j2ee', 'spring'] },
      'C#': { category: 'technical', patterns: ['c#', '.net', 'dotnet'] },
      'PHP': { category: 'technical', patterns: ['php', 'laravel'] },
      'HTML/CSS': { category: 'technical', patterns: ['html', 'css', 'scss', 'sass'] },
      'Agile/Scrum': { category: 'soft', patterns: ['agile', 'scrum', 'kanban', 'agil'] },
      'Projektledning': { category: 'soft', patterns: ['projektledning', 'project management', 'ledarskap'] },
      'Kommunikation': { category: 'soft', patterns: ['kommunikation', 'kommunikativ', 'kommunikationsförmåga'] },
      'Samarbete': { category: 'soft', patterns: ['samarbete', 'teamwork', 'team player'] },
      'Svenska': { category: 'language', patterns: ['svenska', 'svenska språket'] },
      'Engelska': { category: 'language', patterns: ['engelska', 'english', 'engelska språket'] },
      'B-körkort': { category: 'certification', patterns: ['b-körkort', 'körkort', 'bil'] },
      'Yrkesbevis': { category: 'certification', patterns: ['yrkesbevis', 'certifiering', 'certified'] },
    };
    
    jobs.forEach((job: any) => {
      const text = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase();
      const employer = job.employer?.name || 'Okänd';
      
      Object.entries(skillPatterns).forEach(([skillName, config]) => {
        const found = config.patterns.some(pattern => text.includes(pattern));
        
        if (found) {
          if (!skillMap.has(skillName)) {
            skillMap.set(skillName, { count: 0, employers: new Set(), category: config.category });
          }
          const stat = skillMap.get(skillName)!;
          stat.count++;
          stat.employers.add(employer);
        }
      });
    });
    
    return Array.from(skillMap.entries())
      .map(([name, data]) => ({
        name,
        category: data.category,
        frequency: data.count,
        top_employers: Array.from(data.employers).slice(0, 3)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  } catch (error) {
    console.error('Fel vid hämtning av kompetensstatistik:', error);
    return [];
  }
}

/**
 * Hämta utbildningar relaterade till yrke
 * Använder sökning på nyckelord
 */
export interface EducationInfo {
  code: string;
  title: string;
  type: string;
  description?: string;
  duration_months?: number;
  provider?: string;
  url?: string;
}

export async function searchEducations(occupation: string): Promise<EducationInfo[]> {
  // Eftersom AF inte har ett öppet utbildnings-API, returnerar vi relevanta utbildningstyper
  // baserat på yrkeskategori
  
  const normalizedOccupation = occupation.toLowerCase();
  
  // Tech-utbildningar
  if (normalizedOccupation.includes('utvecklare') || normalizedOccupation.includes('programmerare') || 
      normalizedOccupation.includes('system') || normalizedOccupation.includes('it-')) {
    return [
      { code: 'YH001', title: 'Systemutvecklare .NET', type: 'Yrkeshögskola', duration_months: 24, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'YH002', title: 'Systemutvecklare Java', type: 'Yrkeshögskola', duration_months: 24, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'YH003', title: 'Webbutvecklare Fullstack', type: 'Yrkeshögskola', duration_months: 18, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'UNI001', title: 'Datavetenskap', type: 'Universitet', duration_months: 36, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'UNI002', title: 'Systemvetenskap', type: 'Universitet', duration_months: 36, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'AMU001', title: 'Programmering grundkurs', type: 'Arbetsmarknadsutbildning', duration_months: 3, provider: 'Arbetsförmedlingen', url: 'https://www.arbetsformedlingen.se' },
    ];
  }
  
  // Vård-utbildningar
  if (normalizedOccupation.includes('sjuksköterska') || normalizedOccupation.includes('undersköterska') ||
      normalizedOccupation.includes('vård') || normalizedOccupation.includes('sköterska')) {
    return [
      { code: 'UNI003', title: 'Sjuksköterskeprogrammet', type: 'Universitet', duration_months: 36, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'YH004', title: 'Specialistsjuksköterska intensivvård', type: 'Yrkeshögskola', duration_months: 18, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'KOM001', title: 'Undersköterska', type: 'Komvux', duration_months: 18, provider: 'Komvux', url: 'https://www.komvux.se' },
      { code: 'AMU002', title: 'Vårdbiträde', type: 'Arbetsmarknadsutbildning', duration_months: 4, provider: 'Arbetsförmedlingen', url: 'https://www.arbetsformedlingen.se' },
    ];
  }
  
  // Ekonomi-utbildningar
  if (normalizedOccupation.includes('ekonom') || normalizedOccupation.includes('redovisning') ||
      normalizedOccupation.includes('finans') || normalizedOccupation.includes('budget')) {
    return [
      { code: 'UNI004', title: 'Civilekonomprogrammet', type: 'Universitet', duration_months: 48, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'YH005', title: 'Redovisningsekonom', type: 'Yrkeshögskola', duration_months: 18, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'YH006', title: 'Löneadministratör', type: 'Yrkeshögskola', duration_months: 12, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'KOM002', title: 'Företagsekonomi', type: 'Komvux', duration_months: 12, provider: 'Komvux', url: 'https://www.komvux.se' },
    ];
  }
  
  // Lärar-utbildningar
  if (normalizedOccupation.includes('lärare') || normalizedOccupation.includes('pedagog') ||
      normalizedOccupation.includes('förskole')) {
    return [
      { code: 'UNI005', title: 'Grundlärarprogrammet', type: 'Universitet', duration_months: 48, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'UNI006', title: 'Ämneslärarprogrammet', type: 'Universitet', duration_months: 60, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'UNI007', title: 'Förskollärarprogrammet', type: 'Universitet', duration_months: 42, provider: 'Universitet', url: 'https://www.antagning.se' },
      { code: 'YH007', title: 'Fritidspedagog', type: 'Yrkeshögskola', duration_months: 18, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
    ];
  }
  
  // Bygg/Industri-utbildningar
  if (normalizedOccupation.includes('bygg') || normalizedOccupation.includes('snickare') ||
      normalizedOccupation.includes('elektriker') || normalizedOccupation.includes('svetsare')) {
    return [
      { code: 'YH008', title: 'Byggproduktionsledare', type: 'Yrkeshögskola', duration_months: 24, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'AMU003', title: 'Svetsare', type: 'Arbetsmarknadsutbildning', duration_months: 6, provider: 'Arbetsförmedlingen', url: 'https://www.arbetsformedlingen.se' },
      { code: 'AMU004', title: 'Industrielektriker', type: 'Arbetsmarknadsutbildning', duration_months: 9, provider: 'Arbetsförmedlingen', url: 'https://www.arbetsformedlingen.se' },
      { code: 'KOM003', title: 'Bygg och anläggning', type: 'Komvux', duration_months: 18, provider: 'Komvux', url: 'https://www.komvux.se' },
    ];
  }
  
  // Kundtjänst/Administration
  if (normalizedOccupation.includes('kundtjänst') || normalizedOccupation.includes('admin') ||
      normalizedOccupation.includes('reception') || normalizedOccupation.includes('kontor')) {
    return [
      { code: 'YH009', title: 'Kundservice med e-handel', type: 'Yrkeshögskola', duration_months: 12, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
      { code: 'KOM004', title: 'Administration', type: 'Komvux', duration_months: 12, provider: 'Komvux', url: 'https://www.komvux.se' },
      { code: 'AMU005', title: 'Kundservice och kommunikation', type: 'Arbetsmarknadsutbildning', duration_months: 3, provider: 'Arbetsförmedlingen', url: 'https://www.arbetsformedlingen.se' },
    ];
  }
  
  // Default-utbildningar
  return [
    { code: 'YH010', title: `${occupation} - Yrkeshögskola`, type: 'Yrkeshögskola', duration_months: 18, provider: 'Yrkeshögskolan', url: 'https://www.yrkeshogskolan.se' },
    { code: 'KOM005', title: 'Allmän kurs - Komvux', type: 'Komvux', duration_months: 12, provider: 'Komvux', url: 'https://www.komvux.se' },
    { code: 'AMU006', title: 'Yrkesintroduktion', type: 'Arbetsmarknadsutbildning', duration_months: 3, provider: 'Arbetsförmedlingen', url: 'https://www.arbetsformedlingen.se' },
  ];
}

// Exporta API-objekt
export const afDirectApi = {
  getSalaryStats,
  getCompetencyStats,
  searchEducations,
};

export default afDirectApi;
