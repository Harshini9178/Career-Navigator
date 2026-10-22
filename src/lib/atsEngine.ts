/**
 * Career Navigator - ATS Scoring & Keyword Analytics Engine
 *
 * Deterministic, evidence-based ATS scoring, section detection,
 * and software engineering keyword density analyzer.
 */

export interface SectionAnalysisResult {
  sectionName: string;
  detected: boolean;
  evidence?: string;
  confidence: number;
}

export interface KeywordDensityResult {
  keyword: string;
  match: boolean;
  count: number;
  density: number; // percentage (count / totalTokens) * 100
  category: 'Languages' | 'Frameworks' | 'Databases & APIs' | 'DevOps & Cloud' | 'Testing & Tools';
  aliases: string[];
}

export interface ScoreCategoryBreakdown {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  reason: string;
}

export interface FullAtsEvaluation {
  atsScore: number;
  categoryBreakdown: ScoreCategoryBreakdown[];
  detectedSections: string[];
  missingSections: string[];
  sectionDetails: SectionAnalysisResult[];
  skills: string[];
  keywords: KeywordDensityResult[];
  suggestions: string[];
  grammarIssues: string[];
  improvementsToAdd: string[];
  improvementsToRemove: string[];
  wordCount: number;
  contentHash: string;
  targetRole?: string;
  jdMatchScore?: number;
  jobDescription?: string;
  matchedJDKeywords?: string[];
  missingJDKeywords?: string[];
}

/**
 * Normalizes resume text:
 * - Unifies Unicode punctuation, quotes, dashes, bullets, zero-width characters
 * - Normalizes line breaks and excess horizontal whitespace while keeping paragraph structure
 */
export function normalizeResumeText(text: string): string {
  if (!text) return '';

  return text
    // Replace smart quotes and apostrophes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Replace em/en dashes and horizontal bars
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Replace bullets, middots, diamond marks
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7]/g, ' - ')
    // Remove zero-width spaces and soft hyphens
    .replace(/\u200B|\u200C|\u200D|\uFEFF|\u00AD/g, '')
    // Normalize unicode ligatures: fi, fl, etc.
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    // Normalize newlines to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse 3+ newlines into double newlines
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple horizontal spaces/tabs
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Computes a lightweight fast DJB2 hash of the content string for change detection & caching.
 */
export function computeContentHash(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16);
}

/**
 * Accurate Content-Based Section Detection
 */
export function detectSections(normalizedText: string): {
  detectedSections: string[];
  missingSections: string[];
  sectionDetails: SectionAnalysisResult[];
} {
  const lines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean);

  const sectionDefinitions: {
    name: string;
    headingRegex: RegExp;
    contextualRegex: RegExp;
  }[] = [
    {
      name: 'Contact Information',
      headingRegex: /\b(contact\s*(information|details|info)?|personal\s*details)\b/i,
      contextualRegex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|github\.com\/[a-zA-Z0-9_-]+|linkedin\.com\/in\/[a-zA-Z0-9_-]+)\b/i
    },
    {
      name: 'Professional Summary',
      headingRegex: /\b(professional\s*summary|career\s*(objective|goal)|summary|objective|profile|about\s*me|overview|executive\s*summary|background)\b/i,
      contextualRegex: /\b(years?\s+of\s+experience|seeking\s+a\s+role|passionate\s+software|proven\s+track\s+record|results-oriented|dedicated\s+engineer)\b/i
    },
    {
      name: 'Education',
      headingRegex: /\b(education|academic\s*(qualifications?|background|history|credentials?)|academics|qualifications)\b/i,
      contextualRegex: /\b(bachelor|master|b\.?tech|b\.?e\.?|m\.?tech|m\.?e\.?|bca|mca|b\.?sc|m\.?sc|degree|university|college|institute|cgpa|gpa|percentage|graduation)\b/i
    },
    {
      name: 'Technical Skills',
      headingRegex: /\b(technical\s*skills?|core\s*competencies|skills?\s*(&|and)?\s*abilities|tech\s*stack|skills|technologies|proficiencies|tools\s*(&|and)?\s*frameworks|programming\s*languages)\b/i,
      contextualRegex: /\b(javascript|typescript|python|react|java|c\+\+|node|sql|docker|git|aws|html|css|express|mongodb|postgresql)\b/i
    },
    {
      name: 'Projects',
      headingRegex: /\b(projects?|personal\s*projects?|academic\s*projects?|key\s*projects?|featured\s*projects?|technical\s*projects?|portfolio)\b/i,
      contextualRegex: /\b(github\.com|developed\s+(an?|the)|built\s+(an?|the)|architected|full-stack\s+application|web\s+app|capstone|open-source)\b/i
    },
    {
      name: 'Work Experience / Internships',
      headingRegex: /\b(work\s*experience|professional\s*experience|employment\s*(history)?|experience|internships?|industrial\s*training|work\s*history)\b/i,
      contextualRegex: /\b(intern(ship)?|software\s*engineer|developer|consultant|analyst|associate|lead\s*engineer|full-time|part-time|responsibilities|managed|reported\s*to)\b/i
    },
    {
      name: 'Certifications',
      headingRegex: /\b(certifications?|certificates?|licenses?\s*(&|and)?\s*certifications?|accreditations?|courses?\s*(&|and)?\s*certifications?|online\s*certifications?)\b/i,
      contextualRegex: /\b(certified|certification|credential|coursera|udemy|aws\s*certified|meta\s*frontend|oracle\s*certified|comptia|freecodecamp)\b/i
    }
  ];

  const sectionDetails: SectionAnalysisResult[] = [];
  const detectedSections: string[] = [];
  const missingSections: string[] = [];

  for (const def of sectionDefinitions) {
    let detected = false;
    let evidence = '';
    let confidence = 0;

    // Pass 1: Direct Heading Match in lines
    for (const line of lines) {
      if (line.length <= 60 && def.headingRegex.test(line)) {
        detected = true;
        evidence = `Found heading: "${line}"`;
        confidence = 0.95;
        break;
      }
    }

    // Pass 2: Contextual Fallback
    if (!detected) {
      const match = def.contextualRegex.exec(normalizedText);
      if (match) {
        detected = true;
        evidence = `Contextual match: "${match[0]}"`;
        confidence = 0.75;
      }
    }

    sectionDetails.push({
      sectionName: def.name,
      detected,
      evidence: evidence || undefined,
      confidence
    });

    if (detected) {
      detectedSections.push(def.name);
    } else {
      missingSections.push(def.name);
    }
  }

  return { detectedSections, missingSections, sectionDetails };
}

/**
 * Software Engineering Keyword Catalog & Analyzer
 */
interface KeywordCatalogItem {
  canonical: string;
  category: KeywordDensityResult['category'];
  matcher: (text: string) => { count: number; matchedAliases: string[] };
  aliases: string[];
}

export const KEYWORD_CATALOG: KeywordCatalogItem[] = [
  // Languages
  {
    canonical: 'JavaScript',
    category: 'Languages',
    aliases: ['javascript', 'js', 'es6', 'ecmascript'],
    matcher: (text) => {
      const regex = /\b(javascript|ecmascript|es6|es20\d\d)\b|(?<![a-zA-Z0-9_])js(?![a-zA-Z0-9_])/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'TypeScript',
    category: 'Languages',
    aliases: ['typescript', 'ts'],
    matcher: (text) => {
      const regex = /\btypescript\b|(?<![a-zA-Z0-9_])ts(?![a-zA-Z0-9_])/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Python',
    category: 'Languages',
    aliases: ['python', 'py'],
    matcher: (text) => {
      const regex = /\bpython\d?(\.\d+)?\b|(?<![a-zA-Z0-9_])py(?![a-zA-Z0-9_])/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Java',
    category: 'Languages',
    aliases: ['java', 'jvm', 'jdk'],
    matcher: (text) => {
      // Must not match JavaScript or JavaBean
      const regex = /\bjava\b(?!script|\.net|bean)/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'C++',
    category: 'Languages',
    aliases: ['c++', 'cpp', 'c/c++'],
    matcher: (text) => {
      const regex = /\bc\+\+|\bcpp\b|\bc\/c\+\+/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'C# / .NET',
    category: 'Languages',
    aliases: ['c#', 'c sharp', '.net', 'dotnet', 'asp.net'],
    matcher: (text) => {
      const regex = /\bc#|\bc\s*sharp|\b\.net\b|\bdotnet\b|\basp\.net\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Go',
    category: 'Languages',
    aliases: ['golang', 'go language'],
    matcher: (text) => {
      // Token boundary: Must not match Google, Algorithms, Mongo, Django, etc.
      const regex = /\bgolang\b|\bgo\s+language\b|(?<![a-zA-Z0-9_])Go(?![a-zA-Z0-9_])/g;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Rust',
    category: 'Languages',
    aliases: ['rust', 'cargo'],
    matcher: (text) => {
      const regex = /\brust(\s+lang(uage)?)?\b|\bcargo\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'HTML/CSS',
    category: 'Languages',
    aliases: ['html', 'css', 'html5', 'css3', 'tailwind', 'sass'],
    matcher: (text) => {
      const regex = /\bhtml5?\b|\bcss3?\b|\btailwind(\s*css)?\b|\bsass\b|\bscss\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },

  // Frameworks
  {
    canonical: 'React',
    category: 'Frameworks',
    aliases: ['react', 'react.js', 'reactjs', 'react native'],
    matcher: (text) => {
      const regex = /\breact(\.js|js)?\b|\breact\s+native\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Node.js',
    category: 'Frameworks',
    aliases: ['node.js', 'nodejs', 'node'],
    matcher: (text) => {
      const regex = /\bnode(\.js|js)\b|(?<![a-zA-Z0-9_])Node(?![a-zA-Z0-9_])/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Express.js',
    category: 'Frameworks',
    aliases: ['express', 'express.js', 'expressjs'],
    matcher: (text) => {
      const regex = /\bexpress(\.js|js)?\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },

  // Databases & APIs
  {
    canonical: 'SQL',
    category: 'Databases & APIs',
    aliases: ['sql', 'rdbms'],
    matcher: (text) => {
      const regex = /\bsql\b|\brdbms\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'PostgreSQL',
    category: 'Databases & APIs',
    aliases: ['postgresql', 'postgres'],
    matcher: (text) => {
      const regex = /\bpostgres(ql)?\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'MySQL',
    category: 'Databases & APIs',
    aliases: ['mysql'],
    matcher: (text) => {
      const regex = /\bmysql\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'MongoDB',
    category: 'Databases & APIs',
    aliases: ['mongodb', 'mongo'],
    matcher: (text) => {
      const regex = /\bmongo(db)?\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'REST APIs',
    category: 'Databases & APIs',
    aliases: ['rest api', 'restful', 'apis'],
    matcher: (text) => {
      const regex = /\brest(ful)?\s*(api|apis|endpoints?)?\b|\bapis?\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'GraphQL',
    category: 'Databases & APIs',
    aliases: ['graphql', 'gql'],
    matcher: (text) => {
      const regex = /\bgraphql\b|(?<![a-zA-Z0-9_])gql(?![a-zA-Z0-9_])/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },

  // DevOps & Cloud
  {
    canonical: 'Git / GitHub',
    category: 'DevOps & Cloud',
    aliases: ['git', 'github', 'gitlab', 'version control'],
    matcher: (text) => {
      const regex = /\bgit\b|\bgithub\b|\bgitlab\b|\bversion\s*control\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Docker',
    category: 'DevOps & Cloud',
    aliases: ['docker', 'containerization'],
    matcher: (text) => {
      const regex = /\bdocker\b|\bcontainer(s|ization)?\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Kubernetes',
    category: 'DevOps & Cloud',
    aliases: ['kubernetes', 'k8s'],
    matcher: (text) => {
      const regex = /\bkubernetes\b|\bk8s\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'AWS',
    category: 'DevOps & Cloud',
    aliases: ['aws', 'amazon web services'],
    matcher: (text) => {
      const regex = /\baws\b|\bamazon\s+web\s+services\b|\bs3\b|\bec2\b|\blambda\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Google Cloud / GCP',
    category: 'DevOps & Cloud',
    aliases: ['gcp', 'google cloud'],
    matcher: (text) => {
      const regex = /\bgoogle\s+cloud\b|\bgcp\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'CI/CD',
    category: 'DevOps & Cloud',
    aliases: ['ci/cd', 'cicd', 'jenkins', 'github actions'],
    matcher: (text) => {
      const regex = /\bci\/cd\b|\bcicd\b|\bjenkins\b|\bgithub\s*actions\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },

  // Testing & Tools
  {
    canonical: 'Unit Testing',
    category: 'Testing & Tools',
    aliases: ['unit testing', 'test driven', 'tdd'],
    matcher: (text) => {
      const regex = /\bunit\s*test(ing|s)?\b|\btdd\b|\btest\s*driven\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  },
  {
    canonical: 'Jest / Vitest / Cypress',
    category: 'Testing & Tools',
    aliases: ['jest', 'vitest', 'cypress', 'testing library'],
    matcher: (text) => {
      const regex = /\bjest\b|\bvitest\b|\bcypress\b|\btesting\s*library\b/gi;
      const matches = text.match(regex) || [];
      return { count: matches.length, matchedAliases: Array.from(new Set(matches.map((m) => m.toLowerCase()))) };
    }
  }
];

export function analyzeKeywords(normalizedText: string): KeywordDensityResult[] {
  const wordTokens = normalizedText.split(/\s+/).filter(Boolean);
  const totalTokens = Math.max(1, wordTokens.length);

  return KEYWORD_CATALOG.map((item) => {
    const { count, matchedAliases } = item.matcher(normalizedText);
    const density = Number(((count / totalTokens) * 100).toFixed(2));
    return {
      keyword: item.canonical,
      match: count > 0,
      count,
      density,
      category: item.category,
      aliases: matchedAliases
    };
  });
}

export const ROLE_PROFILES: Record<string, { title: string; coreSkills: string[]; secondarySkills: string[] }> = {
  frontend: {
    title: 'Frontend Developer',
    coreSkills: ['react', 'vue', 'angular', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'next.js', 'redux', 'vite', 'ui/ux'],
    secondarySkills: ['sass', 'dom', 'rest api', 'accessibility', 'jest', 'cypress', 'figma', 'graphql']
  },
  backend: {
    title: 'Backend Developer',
    coreSkills: ['node.js', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'go', 'golang', 'sql', 'postgresql', 'mysql', 'mongodb', 'rest api'],
    secondarySkills: ['docker', 'kubernetes', 'aws', 'graphql', 'c#', '.net', 'kafka', 'grpc', 'redis']
  },
  fullstack: {
    title: 'Full Stack Engineer',
    coreSkills: ['react', 'next.js', 'typescript', 'javascript', 'node.js', 'express', 'sql', 'postgresql', 'mongodb', 'docker', 'rest api', 'git'],
    secondarySkills: ['tailwind', 'redis', 'aws', 'graphql', 'ci/cd', 'python', 'html/css', 'jest']
  },
  devops: {
    title: 'DevOps & Cloud Engineer',
    coreSkills: ['docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'jenkins', 'github actions', 'linux', 'bash'],
    secondarySkills: ['ansible', 'helm', 'prometheus', 'grafana', 'cloudformation', 'microservices', 'networking']
  },
  datascience: {
    title: 'Data Scientist / AI/ML Engineer',
    coreSkills: ['python', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'machine learning', 'deep learning', 'sql', 'ai'],
    secondarySkills: ['nlp', 'computer vision', 'data pipeline', 'spark', 'jupyter', 'statistics', 'matplotlib']
  },
  mobile: {
    title: 'Mobile App Developer',
    coreSkills: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'dart', 'mobile'],
    secondarySkills: ['sqlite', 'firebase', 'app store', 'play store', 'rest api', 'redux']
  },
  cybersecurity: {
    title: 'Cybersecurity Engineer',
    coreSkills: ['cybersecurity', 'security', 'penetration testing', 'cryptography', 'siem', 'soc', 'vulnerability', 'owasp', 'firewall', 'network security'],
    secondarySkills: ['wireshark', 'python', 'incident response', 'iso 27001', 'nist', 'zero trust', 'ssl/tls']
  },
  embedded: {
    title: 'Embedded Systems Engineer',
    coreSkills: ['c', 'c++', 'rtos', 'microcontroller', 'arm', 'firmware', 'spi', 'i2c', 'uart', 'embedded'],
    secondarySkills: ['pcb', 'oscilloscope', 'hardware', 'assembly', 'iot', 'linux kernel', 'sensors']
  }
};

/**
 * Deterministic Multi-Category ATS Scoring Engine (Weights total 100%)
 */
export function calculateAtsScore(params: {
  normalizedText: string;
  detectedSections: string[];
  missingSections: string[];
  keywords: KeywordDensityResult[];
  targetRole?: string;
  hasJobDescription?: boolean;
}): {
  atsScore: number;
  categoryBreakdown: ScoreCategoryBreakdown[];
  suggestions: string[];
  grammarIssues: string[];
  improvementsToAdd: string[];
  improvementsToRemove: string[];
} {
  const { normalizedText, detectedSections, keywords, targetRole } = params;
  const wordTokens = normalizedText.split(/\s+/).filter(Boolean);
  const wordCount = wordTokens.length;
  const textLower = normalizedText.toLowerCase();

  const suggestions: string[] = [];
  const grammarIssues: string[] = [];
  const improvementsToAdd: string[] = [];
  const improvementsToRemove: string[] = [
    'Vague introductory fluff (e.g. "Hardworking team player looking for any opportunity")',
    'Non-technical high school coursework or obsolete computer package references'
  ];

  // ==========================================
  // Category 1: Section Completeness (Weight: 20%)
  // ==========================================
  // 7 standard sections = ~2.85 pts each
  const sectionRatio = detectedSections.length / 7;
  const sectionScore = Math.min(20, Math.round(sectionRatio * 20));
  let sectionReason = `Detected ${detectedSections.length} of 7 core structural sections.`;
  if (params.missingSections.length > 0) {
    sectionReason += ` Missing: ${params.missingSections.join(', ')}.`;
    suggestions.push(`Add a distinct "${params.missingSections[0]}" section to pass automated category parsers.`);
  }

  // ==========================================
  // Category 2: Technical Skills & Density (Weight: 25%)
  // ==========================================
  const detectedKeywords = keywords.filter((k) => k.match);
  // Expect 4 to 8 distinct technical technologies for solid breadth
  const keywordRatio = Math.min(1, detectedKeywords.length / 6);
  const techScore = Math.min(25, Math.round(keywordRatio * 25));
  const techReason = `Found ${detectedKeywords.length} verified technologies in resume text.`;
  if (detectedKeywords.length < 4) {
    suggestions.push('Expand your Technical Skills inventory with primary programming languages, frameworks, and databases.');
  }

  // ==========================================
  // Category 3: Experience & Project Depth (Weight: 20%)
  // ==========================================
  const actionVerbs = [
    'architected', 'engineered', 'developed', 'implemented', 'designed',
    'spearheaded', 'overhauled', 'optimized', 'refactored', 'built',
    'launched', 'deployed', 'automated', 'accelerated', 'scaled',
    'secured', 'resolved', 'mentored', 'orchestrated', 'created', 'maintained'
  ];
  const foundActionVerbs = actionVerbs.filter((v) => textLower.includes(v));
  const hasProjectsOrWork = detectedSections.includes('Projects') || detectedSections.includes('Work Experience / Internships');
  const verbRatio = Math.min(1, foundActionVerbs.length / 4);
  const depthScore = Math.min(20, Math.round((hasProjectsOrWork ? 10 : 0) + (verbRatio * 10)));
  const depthReason = `Found ${foundActionVerbs.length} action verbs across project and work bullet points.`;
  if (foundActionVerbs.length < 3) {
    suggestions.push('Format your project bullets using the STAR method: Begin each bullet with strong verbs like Engineered, Optimized, or Deployed.');
    grammarIssues.push('Action verb density is low. Lead technical accomplishment bullets with active verbs rather than passive statements.');
  }

  // ==========================================
  // Category 4: Quantified Metrics & Impact (Weight: 15%)
  // ==========================================
  const metricRegexes = [
    /\b\d+%\b/, /\b\d+\s*percent\b/i, /\b\d+\s*ms\b/i, /\b\d+\s*sec(onds)?\b/i,
    /\$\d+/, /₹\d+/, /\b\d+\s*k\b/i, /\b\d+\s*million\b/i, /\b\d+\s*users?\b/i,
    /\breduced\s+by\b/i, /\bincreased\s+by\b/i, /\blatency\b/i, /\bthroughput\b/i,
    /\brequests?\s+per\s+second\b/i, /\brps\b/i
  ];
  const matchedMetrics = metricRegexes.filter((r) => r.test(normalizedText));
  const metricRatio = Math.min(1, matchedMetrics.length / 3);
  const metricScore = Math.min(15, Math.round(metricRatio * 15));
  const metricReason = `Found ${matchedMetrics.length} measurable metrics/outcomes.`;
  if (matchedMetrics.length < 2) {
    suggestions.push('Substantiate your achievements with quantifiable results (e.g., "improved query performance by 25%" or "servicing 10k+ requests").');
    grammarIssues.push('Impact warning: Absence of measurable metrics (%, latency, user scale) to substantiate project accomplishments.');
  }

  // ==========================================
  // Category 5: Contact Information Completeness (Weight: 10%)
  // ==========================================
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(normalizedText);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10}/.test(normalizedText);
  const hasLink = /(github\.com|linkedin\.com|portfolio|\.dev|\.io)/i.test(normalizedText);
  let contactPoints = 0;
  if (hasEmail) contactPoints += 4;
  if (hasPhone) contactPoints += 3;
  if (hasLink) contactPoints += 3;
  const contactScore = Math.min(10, contactPoints);
  const contactReason = `Contact points evaluated (Email: ${hasEmail ? '✓' : '✗'}, Phone: ${hasPhone ? '✓' : '✗'}, Links: ${hasLink ? '✓' : '✗'}).`;
  if (!hasEmail) {
    grammarIssues.push('Header warning: No email address detected in candidate contact section.');
  }

  // ==========================================
  // Category 6: Readability & Document Structure (Weight: 10%)
  // ==========================================
  let readPoints = 10;
  if (wordCount < 100) {
    readPoints = 2;
    grammarIssues.push('Length warning: Resume text is very brief (under 100 words). Expand your project and technical descriptions.');
  } else if (wordCount < 200) {
    readPoints = 6;
  } else if (wordCount > 1800) {
    readPoints = 7;
    grammarIssues.push('Length warning: Resume exceeds 1,800 words. Consider condensing to 1-2 pages.');
  }
  const readScore = readPoints;
  const readReason = `Document contains ${wordCount} words with formatted section spacing.`;

  // ==========================================
  // TOTAL COMPOSITE SCORE (0 - 100)
  // ==========================================
  let baseScore = sectionScore + techScore + depthScore + metricScore + contactScore + readScore;

  // Role Alignment Evaluation (if targetRole is supplied)
  if (targetRole && targetRole.trim()) {
    const roleKey = targetRole.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedProfile: { title: string; coreSkills: string[]; secondarySkills: string[] } | undefined;

    for (const [key, profile] of Object.entries(ROLE_PROFILES)) {
      if (roleKey.includes(key) || key.includes(roleKey) || profile.title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(roleKey)) {
        matchedProfile = profile;
        break;
      }
    }

    if (matchedProfile) {
      const matchedCore = matchedProfile.coreSkills.filter((s) => textLower.includes(s));
      const matchRatio = matchedCore.length / Math.min(4, matchedProfile.coreSkills.length);

      if (matchRatio < 0.3) {
        // Significant mismatch with target engineering role
        const penalty = Math.round((1 - matchRatio) * 25);
        baseScore = Math.max(10, baseScore - penalty);
        suggestions.unshift(`For ${matchedProfile.title} roles, highlight essential proficiencies such as ${matchedProfile.coreSkills.slice(0, 3).join(', ')}.`);
        improvementsToAdd.unshift(...matchedProfile.coreSkills.filter((s) => !textLower.includes(s)).slice(0, 3));
      } else {
        suggestions.push(`Resume demonstrates strong keyword and competency alignment with ${matchedProfile.title} standards.`);
      }
    } else {
      suggestions.push(`Target Role Focus: Tailor project descriptions to highlight competencies expected of a ${targetRole}.`);
    }
  }

  const totalScore = Math.max(10, Math.min(98, baseScore));

  const categoryBreakdown: ScoreCategoryBreakdown[] = [
    { category: 'Section Completeness', score: sectionScore, maxScore: 20, weight: 20, reason: sectionReason },
    { category: 'Technical Skills & Density', score: techScore, maxScore: 25, weight: 25, reason: techReason },
    { category: 'Experience & Project Depth', score: depthScore, maxScore: 20, weight: 20, reason: depthReason },
    { category: 'Quantified Impact & Metrics', score: metricScore, maxScore: 15, weight: 15, reason: metricReason },
    { category: 'Contact Information', score: contactScore, maxScore: 10, weight: 10, reason: contactReason },
    { category: 'Readability & Structure', score: readScore, maxScore: 10, weight: 10, reason: readReason }
  ];

  // Specific technology recommendations
  const missingKeywords = keywords.filter((k) => !k.match);
  if (!keywords.find((k) => k.keyword === 'Docker')?.match && !textLower.includes('cloud')) {
    improvementsToAdd.push('Cloud & Containerization context (Docker, AWS, Kubernetes, or Vercel)');
  }
  if (!keywords.find((k) => k.keyword === 'Git / GitHub')?.match) {
    improvementsToAdd.push('Version control and automation workflows (Git, GitHub Actions, CI/CD pipelines)');
  }
  if (!keywords.find((k) => k.keyword === 'Unit Testing')?.match) {
    improvementsToAdd.push('Testing paradigms and frameworks (Unit testing, Vitest, Jest, or Cypress)');
  }

  return {
    atsScore: totalScore,
    categoryBreakdown,
    suggestions: suggestions.slice(0, 5),
    grammarIssues,
    improvementsToAdd: improvementsToAdd.slice(0, 5),
    improvementsToRemove
  };
}

/**
 * Job Description Keyword Matching
 */
export function matchJobDescription(
  resumeText: string,
  jobDescription: string
): {
  jdMatchScore: number;
  matchedJDKeywords: string[];
  missingJDKeywords: string[];
} {
  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  // Extract critical skills mentioned in the JD from our catalog
  const matchedJDKeywords: string[] = [];
  const missingJDKeywords: string[] = [];

  for (const item of KEYWORD_CATALOG) {
    const jdMentions = item.matcher(jobDescription).count > 0;
    if (jdMentions) {
      const resumeMentions = item.matcher(resumeText).count > 0;
      if (resumeMentions) {
        matchedJDKeywords.push(item.canonical);
      } else {
        missingJDKeywords.push(item.canonical);
      }
    }
  }

  const totalRequired = matchedJDKeywords.length + missingJDKeywords.length;
  let jdMatchScore = 50; // default baseline when JD has few tech keywords

  if (totalRequired > 0) {
    jdMatchScore = Math.round((matchedJDKeywords.length / totalRequired) * 100);
  }

  return {
    jdMatchScore,
    matchedJDKeywords,
    missingJDKeywords
  };
}
