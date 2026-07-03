/**
 * jobMatchingData - Statisk matchningsdata för jobbmatchning.
 *
 * Utbruten ur components/jobs/MatchesTab.tsx (2026-07-03) — rena
 * konstantobjekt som bara används av matchningslogiken i
 * services/jobMatching.ts. Ingen logik, bara data.
 */

// ============================================
// SKILL & JOB TITLE SYNONYMS
// ============================================

export const SKILL_SYNONYMS: Record<string, string[]> = {
  // Programming languages
  'javascript': ['js', 'ecmascript', 'node', 'nodejs', 'node.js'],
  'typescript': ['ts'],
  'python': ['py', 'django', 'flask', 'pandas'],
  'java': ['jvm', 'spring', 'spring boot', 'jakarta'],
  'c#': ['csharp', 'c-sharp', '.net', 'dotnet', 'asp.net'],
  'c++': ['cpp', 'c plus plus'],
  'php': ['laravel', 'symfony', 'wordpress'],
  'ruby': ['rails', 'ruby on rails'],
  'go': ['golang'],
  'rust': ['rustlang'],
  'swift': ['ios', 'xcode'],
  'kotlin': ['android'],

  // Frontend
  'react': ['react.js', 'reactjs', 'react native', 'redux'],
  'vue': ['vue.js', 'vuejs', 'nuxt'],
  'angular': ['angularjs', 'angular.js'],
  'html': ['html5', 'markup'],
  'css': ['css3', 'sass', 'scss', 'less', 'tailwind', 'bootstrap'],
  'frontend': ['front-end', 'front end', 'ui', 'användargränssnitt'],
  'backend': ['back-end', 'back end', 'server-side', 'serversidan'],
  'fullstack': ['full-stack', 'full stack'],

  // Databases
  'sql': ['mysql', 'postgresql', 'postgres', 'mssql', 'oracle', 'mariadb', 'sqlite'],
  'nosql': ['mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb'],
  'databas': ['database', 'db', 'datalagring'],

  // DevOps & Cloud
  'devops': ['ci/cd', 'continuous integration', 'deployment'],
  'docker': ['container', 'kubernetes', 'k8s'],
  'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
  'azure': ['microsoft azure', 'azure devops'],
  'gcp': ['google cloud', 'google cloud platform'],
  'linux': ['unix', 'ubuntu', 'debian', 'centos'],

  // Office & General IT
  'excel': ['spreadsheet', 'kalkylark', 'kalkylblad', 'vba'],
  'word': ['ordbehandling', 'dokument'],
  'powerpoint': ['presentation', 'presentationer'],
  'office': ['microsoft office', 'ms office', 'office 365', 'm365'],
  'it': ['informationsteknik', 'data', 'system', 'teknik'],
  'support': ['helpdesk', 'servicedesk', 'kundsupport', 'teknisk support'],

  // Project & Management
  'projektledning': ['projektledare', 'project management', 'pm', 'projektkoordinator'],
  'scrum': ['agile', 'agil', 'sprint', 'kanban', 'scrum master'],
  'ledarskap': ['chef', 'ledare', 'teamlead', 'team lead', 'teamledare', 'manager'],
  'strategi': ['strategisk', 'affärsutveckling', 'business development'],

  // Communication & Sales
  'kommunikation': ['kommunikativ', 'kundkontakt', 'kundbemötande', 'pr'],
  'försäljning': ['säljare', 'sales', 'sälj', 'account manager', 'kundansvarig'],
  'marknadsföring': ['marketing', 'digital marknadsföring', 'content', 'seo', 'sem'],
  'kundservice': ['kundtjänst', 'customer service', 'kundsupport'],

  // Finance & Admin
  'ekonomi': ['redovisning', 'bokföring', 'accounting', 'finans', 'finance'],
  'administration': ['admin', 'administratör', 'kontorsarbete', 'reception'],
  'hr': ['personal', 'rekrytering', 'human resources', 'personalansvarig'],
  'juridik': ['jurist', 'legal', 'avtal', 'kontrakt'],

  // Healthcare & Social
  'vård': ['omsorg', 'sjukvård', 'hälsa', 'healthcare', 'omvårdnad'],
  'undersköterska': ['usk', 'vårdbiträde', 'äldreomsorg'],
  'sjuksköterska': ['ssk', 'nurse', 'nursing'],
  'läkare': ['doctor', 'physician', 'medicine'],
  'psykologi': ['psykolog', 'terapi', 'terapeut', 'counseling'],
  'socialt arbete': ['socionom', 'social worker', 'biståndshandläggare'],

  // Education
  'pedagogik': ['undervisning', 'lärare', 'utbildning', 'education', 'teacher'],
  'förskola': ['förskollärare', 'barnskötare', 'dagis'],
  'grundskola': ['mellanstadie', 'lågstadie', 'högstadie'],

  // Construction & Industry
  'bygg': ['byggnad', 'construction', 'byggnadsarbete', 'snickare'],
  'el': ['elektriker', 'elektricitet', 'elinstallation'],
  'vvs': ['rörmokare', 'plumber', 'ventilation'],
  'industri': ['produktion', 'tillverkning', 'manufacturing', 'fabrik'],
  'lager': ['logistik', 'warehouse', 'lagerpersonal', 'godshantering'],
  'transport': ['chaufför', 'driver', 'lastbil', 'truck', 'leverans'],

  // Licenses & Certificates
  'körkort': ['b-körkort', 'c-körkort', 'ce-körkort', 'driving license', 'förare'],
  'truckkort': ['truck', 'forklift', 'gaffeltruck'],
  'certifikat': ['certificate', 'behörighet', 'licens'],

  // Languages
  'engelska': ['english', 'eng'],
  'svenska': ['swedish', 'swe'],
  'tyska': ['german', 'deutsch'],
  'franska': ['french', 'français'],
  'spanska': ['spanish', 'español'],
}

export const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
  'systemutvecklare': ['developer', 'utvecklare', 'programmerare', 'software engineer', 'mjukvaruutvecklare'],
  'webbutvecklare': ['web developer', 'frontendutvecklare', 'backendutvecklare', 'fullstackutvecklare'],
  'projektledare': ['project manager', 'pm', 'projektkoordinator', 'project lead'],
  'produktägare': ['product owner', 'po', 'produktchef', 'product manager'],
  'säljare': ['sales', 'försäljare', 'account manager', 'säljansvarig', 'key account'],
  'ekonom': ['accountant', 'redovisningsekonom', 'controller', 'finansanalytiker'],
  'administratör': ['admin', 'kontorsassistent', 'sekreterare', 'koordinator'],
  'receptionist': ['reception', 'front desk', 'kundmottagare'],
  'chef': ['manager', 'ledare', 'ansvarig', 'head of', 'director'],
  'konsult': ['consultant', 'rådgivare', 'specialist', 'expert'],
  'tekniker': ['technician', 'servicetekniker', 'drifttekniker'],
  'ingenjör': ['engineer', 'civilingenjör', 'högskoleingenjör'],
  'lärare': ['teacher', 'pedagog', 'utbildare', 'instructor'],
  'sjuksköterska': ['nurse', 'ssk', 'vårdpersonal'],
  'undersköterska': ['usk', 'vårdbiträde', 'omsorgspersonal'],
  'kock': ['chef', 'cook', 'köksbiträde', 'köksansvarig'],
  'städare': ['cleaner', 'lokalvårdare', 'städpersonal'],
  'chaufför': ['driver', 'förare', 'lastbilschaufför', 'budbilsförare'],
}

// SENIORITY_LEVELS + INDUSTRIES borttagna 2026-05-15 — användes endast
// av detect-funktionerna (också borttagna). Återinför med tester när
// matching-logiken behöver granulär klassificering.

/**
 * Generic skills that should NOT be used for job searching
 * These are basic requirements that almost every job has,
 * so using them as search terms returns irrelevant results.
 * They can still contribute minor points in scoring.
 */
export const GENERIC_SKILLS = new Set([
  // Languages
  'svenska', 'swedish', 'engelska', 'english', 'tyska', 'german',
  'franska', 'french', 'spanska', 'spanish', 'arabiska', 'arabic',
  'finska', 'finnish', 'norska', 'norwegian', 'danska', 'danish',
  'polska', 'polish', 'ryska', 'russian', 'kinesiska', 'chinese',
  'japanska', 'japanese', 'portugisiska', 'portuguese',
  // Driver's licenses
  'körkort', 'b-körkort', 'c-körkort', 'ce-körkort', 'am-körkort',
  'a-körkort', 'a1-körkort', 'a2-körkort', 'driving license',
  'drivers license', 'förarbevis',
  // Basic computer skills
  'dator', 'datorer', 'datorvana', 'computer', 'it-vana',
  'microsoft office', 'ms office', 'office', 'word', 'excel', 'powerpoint',
  'outlook', 'teams', 'e-post', 'email', 'internet',
  // Soft skills (too generic)
  'kommunikation', 'kommunikativ', 'social', 'samarbete', 'teamwork',
  'flexibel', 'noggrann', 'ansvarstagande', 'självständig', 'strukturerad',
  'serviceinriktad', 'stresstålig', 'lösningsorienterad', 'positiv',
  'driven', 'engagerad', 'motiverad', 'pålitlig', 'punktlig',
  // Other generic
  'truckkort', 'truck', 'hjullastare', 'travers',
])

// ============================================
// PROFESSIONAL LICENSE/CERTIFICATION REQUIREMENTS
// ============================================

/**
 * Professional licenses that are legally required for certain jobs
 * Jobs requiring these should be filtered out if user doesn't have them
 */
export const REQUIRED_LICENSES: Record<string, {
  keywords: string[]
  titlePatterns: string[]
  description: string
}> = {
  'sjuksköterska': {
    keywords: ['legitimerad sjuksköterska', 'leg. sjuksköterska', 'leg sjuksköterska', 'ssk-legitimation', 'sjuksköterskelegitimation'],
    titlePatterns: ['sjuksköterska', 'ssk'],
    description: 'Sjuksköterskelegitimation'
  },
  'läkare': {
    keywords: ['legitimerad läkare', 'leg. läkare', 'läkarlegitimation', 'medicine doktor'],
    titlePatterns: ['läkare', 'doktor', 'medicine'],
    description: 'Läkarlegitimation'
  },
  'lärare': {
    keywords: ['lärarlegitimation', 'legitimerad lärare', 'leg. lärare', 'behörig lärare'],
    titlePatterns: ['lärare', 'pedagog'],
    description: 'Lärarlegitimation'
  },
  'förskollärare': {
    keywords: ['legitimerad förskollärare', 'förskollärarlegitimation', 'behörig förskollärare'],
    titlePatterns: ['förskollärare'],
    description: 'Förskollärarlegitimation'
  },
  'psykolog': {
    keywords: ['legitimerad psykolog', 'leg. psykolog', 'psykologlegitimation'],
    titlePatterns: ['psykolog'],
    description: 'Psykologlegitimation'
  },
  'fysioterapeut': {
    keywords: ['legitimerad fysioterapeut', 'leg. fysioterapeut', 'fysioterapeutlegitimation', 'legitimerad sjukgymnast'],
    titlePatterns: ['fysioterapeut', 'sjukgymnast'],
    description: 'Fysioterapeutlegitimation'
  },
  'arbetsterapeut': {
    keywords: ['legitimerad arbetsterapeut', 'leg. arbetsterapeut', 'arbetsterapeutlegitimation'],
    titlePatterns: ['arbetsterapeut'],
    description: 'Arbetsterapeutlegitimation'
  },
  'tandläkare': {
    keywords: ['legitimerad tandläkare', 'leg. tandläkare', 'tandläkarlegitimation'],
    titlePatterns: ['tandläkare'],
    description: 'Tandläkarlegitimation'
  },
  'tandhygienist': {
    keywords: ['legitimerad tandhygienist', 'leg. tandhygienist'],
    titlePatterns: ['tandhygienist'],
    description: 'Tandhygienistlegitimation'
  },
  'apotekare': {
    keywords: ['legitimerad apotekare', 'leg. apotekare', 'apotekarlegitimation'],
    titlePatterns: ['apotekare'],
    description: 'Apotekarlegitimation'
  },
  'receptarie': {
    keywords: ['legitimerad receptarie', 'leg. receptarie'],
    titlePatterns: ['receptarie'],
    description: 'Receptarielegitimation'
  },
  'barnmorska': {
    keywords: ['legitimerad barnmorska', 'leg. barnmorska', 'barnmorskelegitimation'],
    titlePatterns: ['barnmorska'],
    description: 'Barnmorskelegitimation'
  },
  'dietist': {
    keywords: ['legitimerad dietist', 'leg. dietist'],
    titlePatterns: ['dietist'],
    description: 'Dietistlegitimation'
  },
  'logoped': {
    keywords: ['legitimerad logoped', 'leg. logoped'],
    titlePatterns: ['logoped'],
    description: 'Logopedlegitimation'
  },
  'optiker': {
    keywords: ['legitimerad optiker', 'leg. optiker'],
    titlePatterns: ['optiker'],
    description: 'Optikerlegitimation'
  },
  'kiropraktor': {
    keywords: ['legitimerad kiropraktor', 'leg. kiropraktor'],
    titlePatterns: ['kiropraktor'],
    description: 'Kiropraktorlegitimation'
  },
  'naprapat': {
    keywords: ['legitimerad naprapat', 'leg. naprapat'],
    titlePatterns: ['naprapat'],
    description: 'Naprapatlegitimation'
  },
  'audionom': {
    keywords: ['legitimerad audionom', 'leg. audionom'],
    titlePatterns: ['audionom'],
    description: 'Audionomlegitimation'
  },
  'biomedicinsk_analytiker': {
    keywords: ['legitimerad biomedicinsk analytiker', 'bma-legitimation'],
    titlePatterns: ['biomedicinsk analytiker', 'bma'],
    description: 'BMA-legitimation'
  },
  'röntgensjuksköterska': {
    keywords: ['legitimerad röntgensjuksköterska', 'leg. röntgensjuksköterska'],
    titlePatterns: ['röntgensjuksköterska'],
    description: 'Röntgensjuksköterskelegitimation'
  },
  'socionom': {
    keywords: ['socionomexamen', 'socionom'],
    titlePatterns: ['socionom', 'socialsekreterare', 'biståndshandläggare'],
    description: 'Socionomexamen'
  },
  'jurist': {
    keywords: ['juristexamen', 'jur. kand', 'advokat'],
    titlePatterns: ['jurist', 'advokat'],
    description: 'Juristexamen'
  },
  'revisor': {
    keywords: ['auktoriserad revisor', 'godkänd revisor', 'revisorsexamen'],
    titlePatterns: ['revisor'],
    description: 'Revisorsauktorisation'
  },
  'elektriker': {
    keywords: ['behörig elektriker', 'elinstallatör', 'elbehörighet'],
    titlePatterns: ['elektriker', 'elinstallatör'],
    description: 'Elbehörighet'
  },
  'veterinär': {
    keywords: ['legitimerad veterinär', 'leg. veterinär'],
    titlePatterns: ['veterinär'],
    description: 'Veterinärlegitimation'
  }
}
