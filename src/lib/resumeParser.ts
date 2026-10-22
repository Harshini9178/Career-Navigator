import { extractPdfTextFromArrayBuffer } from './pdfExtractor.js';
import { extractDocxTextFromArrayBuffer } from './docxExtractor.js';
import {
  normalizeResumeText,
  computeContentHash,
  detectSections,
  analyzeKeywords,
  calculateAtsScore,
  matchJobDescription,
  FullAtsEvaluation
} from './atsEngine.js';

export interface ParseAndAnalyzeOptions {
  fileName: string;
  targetRole?: string;
  jobDescription?: string;
  userId?: string;
}

/**
 * Parses raw file content or text and runs deterministic ATS evaluation.
 */
export async function parseAndAnalyzeResume(
  input: string | ArrayBuffer,
  options: ParseAndAnalyzeOptions
): Promise<FullAtsEvaluation> {
  const fileName = options.fileName || 'resume.pdf';
  const fileExt = fileName.toLowerCase().split('.').pop() || '';

  let rawText = '';

  if (typeof input === 'string') {
    rawText = input;
  } else if (input instanceof ArrayBuffer) {
    if (fileExt === 'pdf') {
      rawText = await extractPdfTextFromArrayBuffer(input);
    } else if (fileExt === 'docx') {
      rawText = await extractDocxTextFromArrayBuffer(input);
    } else {
      // Plain text / Markdown
      const decoder = new TextDecoder('utf-8', { fatal: false });
      rawText = decoder.decode(new Uint8Array(input));
    }
  }

  // Normalize Unicode, whitespace, bullets, dashes
  const normalizedText = normalizeResumeText(rawText);

  // Validate that text extraction produced meaningful content
  if (!normalizedText || normalizedText.trim().length < 40) {
    throw new Error(
      `Could not extract sufficient text from "${fileName}". The file may be empty, an image scan, or password-protected. Please copy and paste your resume text manually.`
    );
  }

  // Detect Sections
  const { detectedSections, missingSections, sectionDetails } = detectSections(normalizedText);

  // Analyze Keywords
  const keywords = analyzeKeywords(normalizedText);

  // Calculate ATS Score & Category Breakdown
  const scoring = calculateAtsScore({
    normalizedText,
    detectedSections,
    missingSections,
    keywords,
    targetRole: options.targetRole,
    hasJobDescription: Boolean(options.jobDescription && options.jobDescription.trim())
  });

  // Extract detected skill names for the top-level skills array
  const detectedSkills = keywords
    .filter((k) => k.match)
    .map((k) => k.keyword);

  // Compute Content Hash for data integrity & caching
  const contentHash = computeContentHash(normalizedText);
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

  // Optional Job Description Matching
  let jdResults: { jdMatchScore?: number; matchedJDKeywords?: string[]; missingJDKeywords?: string[] } = {};
  if (options.jobDescription && options.jobDescription.trim()) {
    const jdMatch = matchJobDescription(normalizedText, options.jobDescription);
    jdResults = {
      jdMatchScore: jdMatch.jdMatchScore,
      matchedJDKeywords: jdMatch.matchedJDKeywords,
      missingJDKeywords: jdMatch.missingJDKeywords
    };
  }

  return {
    atsScore: scoring.atsScore,
    categoryBreakdown: scoring.categoryBreakdown,
    detectedSections,
    missingSections,
    sectionDetails,
    skills: detectedSkills.length > 0 ? detectedSkills : ['General Software Engineering'],
    keywords,
    suggestions: scoring.suggestions,
    grammarIssues: scoring.grammarIssues,
    improvementsToAdd: scoring.improvementsToAdd,
    improvementsToRemove: scoring.improvementsToRemove,
    wordCount,
    contentHash,
    targetRole: options.targetRole,
    jobDescription: options.jobDescription,
    ...jdResults
  };
}

/**
 * Synchronous text parser and ATS scorer for raw resume text strings.
 */
export function parseResumeText(
  rawText: string,
  fileName: string = 'resume.txt',
  targetRole?: string
): FullAtsEvaluation {
  const cleaned = rawText ? rawText.trim() : '';
  if (!cleaned || cleaned.length < 30 || cleaned.startsWith('[Could not extract') || cleaned.startsWith('[PDF contained')) {
    throw new Error('Resume text must be at least 30 characters and contain readable text, not unreadable error strings.');
  }

  const normalizedText = normalizeResumeText(cleaned);
  if (!normalizedText || normalizedText.trim().length < 30) {
    throw new Error('Resume text must be at least 30 characters.');
  }

  const { detectedSections, missingSections, sectionDetails } = detectSections(normalizedText);
  const keywords = analyzeKeywords(normalizedText);
  const scoring = calculateAtsScore({
    normalizedText,
    detectedSections,
    missingSections,
    keywords,
    targetRole
  });

  const detectedSkills = keywords.filter((k) => k.match).map((k) => k.keyword);
  if (detectedSkills.includes('Docker') && !detectedSkills.includes('Docker & Containers')) {
    detectedSkills.push('Docker & Containers');
  }

  const contentHash = computeContentHash(normalizedText);
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

  return {
    atsScore: scoring.atsScore,
    categoryBreakdown: scoring.categoryBreakdown,
    detectedSections,
    missingSections,
    sectionDetails,
    skills: detectedSkills.length > 0 ? detectedSkills : ['General Software Engineering'],
    keywords,
    suggestions: scoring.suggestions,
    grammarIssues: scoring.grammarIssues,
    improvementsToAdd: scoring.improvementsToAdd,
    improvementsToRemove: scoring.improvementsToRemove,
    wordCount,
    contentHash,
    targetRole
  };
}

