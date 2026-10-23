import { GoogleGenAI, Type } from '@google/genai';
import { ResumeAnalysis, AnswerEvaluation } from '../types.js';
import {
  normalizeResumeText,
  detectSections,
  analyzeKeywords,
  calculateAtsScore,
  matchJobDescription,
  computeContentHash
} from './atsEngine.js';

// Lazy-initialize Gemini client to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;

export function isRealApiKey(key?: string): boolean {
  if (!key) return false;
  const clean = key.trim();
  if (clean.length < 15) return false;
  const upper = clean.toUpperCase();
  if (
    upper === 'MY_GEMINI_API_KEY' ||
    upper === 'YOUR_REAL_GEMINI_API_KEY' ||
    upper === 'PASTE_YOUR_REAL_GEMINI_API_KEY_HERE' ||
    upper.startsWith('PASTE_') ||
    upper.startsWith('YOUR_') ||
    upper.includes('PLACEHOLDER') ||
    upper.includes('EXAMPLE')
  ) {
    return false;
  }
  return true;
}

export function isGeminiConfigured(): boolean {
  return isRealApiKey(process.env.GEMINI_API_KEY);
}

export function getEffectiveModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && envModel !== 'YOUR_SUPPORTED_GEMINI_MODEL' && envModel !== 'gemini-2.5-flash') {
    return envModel;
  }
  return 'gemini-3.1-flash-lite';
}

export const GEMINI_MODEL = getEffectiveModel();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!isRealApiKey(apiKey)) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export const aiService = {
  /**
   * Evaluates an engineering student resume and predicts an ATS score (40-100).
   * Extracts core technical skills, identifies missing sections, points out grammar/formatting issues,
   * and recommends concrete keywords to add/remove.
   *
   * Fallback: If GEMINI_API_KEY is not configured or the API request fails,
   * executes a local heuristic simulation based on keyword density and section detection.
   *
   * @param resumeText - Raw text extracted from the candidate's uploaded resume
   * @param fileName - Original filename of the uploaded document
   * @param targetRole - The specific target job role (e.g. Frontend, Backend, DevOps, Data Science)
   * @returns Detailed ATS analysis object including scores, extracted skills, and suggestions
   */
  async analyzeResume(resumeText: string, fileName: string, targetRole?: string): Promise<ResumeAnalysis & { simulated?: boolean }> {
    const client = getGeminiClient();

    if (!client) {
      console.warn('GEMINI_API_KEY is not configured. Running in simulation mode.');
      return this.simulateResumeAnalysis(resumeText, fileName, targetRole);
    }

    try {
      const prompt = `Analyze this student resume for engineering placements${targetRole ? ` for the specific target role: "${targetRole}"` : ''}.
Resume Text:
${resumeText}

Analyze the skills, projects, certifications, and experience strictly against the expectations of ${targetRole || 'engineering roles'}. Detect missing sections. Highlight grammar/formatting issues. Predict an ATS score between 40 and 100 dynamically based on relevance to ${targetRole || 'the role'}. Recommend keywords to add/remove. Return details structured in JSON format.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: `You are a professional ATS resume scanner and corporate technical recruiter. Your goal is to give highly detailed, concrete, and rigorous engineering-specific feedback${targetRole ? ` tailored specifically to the "${targetRole}" role` : ''} to help candidates pass screening filters. Score dynamically: penalize resumes with irrelevant or shallow technical skills for this role, and reward deep, quantified, role-aligned experience.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: { type: Type.INTEGER, description: 'The predicted ATS score from 40 to 100.' },
              skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Extracted skills found in the resume.' },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key sections missing from the resume (e.g. Summary, Certifications, Contact details).' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Concrete suggestions for improvement.' },
              grammarIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Grammar, punctuation, or formatting inconsistencies identified.' },
              keywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    match: { type: Type.BOOLEAN, description: 'Whether the keyword exists in the resume.' }
                  },
                  required: ['keyword', 'match']
                },
                description: 'Crucial technical keywords for engineering roles and their match status.'
              },
              improvementsToAdd: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific technologies, words, or sections to ADD.' },
              improvementsToRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Vague, outdated, or redundant sections/words to REMOVE.' }
            },
            required: ['atsScore', 'skills', 'missingSections', 'suggestions', 'grammarIssues', 'keywords', 'improvementsToAdd', 'improvementsToRemove']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const base = this.simulateResumeAnalysis(resumeText, fileName, targetRole);

      return {
        ...base,
        id: `res-${Math.random().toString(36).substr(2, 9)}`,
        userId: '', // set by endpoint
        fileName,
        targetRole: targetRole || undefined,
        uploadedAt: new Date().toISOString(),
        suggestions: parsed.suggestions?.length ? parsed.suggestions : base.suggestions,
        grammarIssues: parsed.grammarIssues?.length ? parsed.grammarIssues : base.grammarIssues,
        improvementsToAdd: parsed.improvementsToAdd?.length ? parsed.improvementsToAdd : base.improvementsToAdd,
        improvementsToRemove: parsed.improvementsToRemove?.length ? parsed.improvementsToRemove : base.improvementsToRemove
      };
    } catch (err) {
      console.error('Gemini Resume Analysis failed:', err);
      return this.simulateResumeAnalysis(resumeText, fileName, targetRole);
    }
  },

  /**
   * Evaluates a resume directly against a target Job Description (JD Matcher).
   * Computes ATS quality score, JD match percentage (0-100), matched/missing keywords,
   * and tailored improvement recommendations.
   *
   * @param resumeText - Raw text extracted from the candidate's resume
   * @param jobDescription - The job description text to match against
   * @param fileName - Original filename of the candidate's resume
   * @param targetRole - Optional target job role
   * @returns Detailed ATS analysis object with jdMatchScore and keyword diffs
   */
  async analyzeResumeWithJD(
    resumeText: string,
    jobDescription: string,
    fileName: string,
    targetRole?: string
  ): Promise<ResumeAnalysis & { simulated?: boolean }> {
    const client = getGeminiClient();

    if (!client) {
      console.warn('GEMINI_API_KEY is not configured. Running JD analysis in simulation mode.');
      return this.simulateResumeWithJD(resumeText, jobDescription, fileName, targetRole);
    }

    try {
      const prompt = `Analyze this student resume directly against the provided Job Description for an engineering placement.
Resume Text:
${resumeText.substring(0, 15000)}

Job Description:
${jobDescription.substring(0, 8000)}

Evaluate:
1. Overall ATS resume quality score (40-100).
2. Direct Job Description Match Score (jdMatchScore: 0-100) based on alignment with required technologies, experience, and responsibilities.
3. Extracted skills found in the resume.
4. matchedJDKeywords: array of key skills/technologies mentioned in the JD that the candidate possesses.
5. missingJDKeywords: array of critical skills/technologies mentioned in the JD that are absent from the resume.
6. Missing resume sections, concrete improvement suggestions, grammar issues, keywords to add/remove.

Return details structured in JSON format.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite corporate technical recruiter and ATS specialist. Provide objective, razor-sharp feedback comparing a candidate resume with the target job description.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: { type: Type.INTEGER, description: 'The predicted general ATS score from 40 to 100.' },
              jdMatchScore: { type: Type.INTEGER, description: 'The target job description match score from 0 to 100.' },
              skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Extracted skills found in the resume.' },
              matchedJDKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Keywords and skills from the JD that matched the resume.' },
              missingJDKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Crucial keywords/skills requested by the JD that are absent from the resume.' },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key sections missing from the resume.' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Concrete suggestions for improvement.' },
              grammarIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Grammar or formatting inconsistencies.' },
              keywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    match: { type: Type.BOOLEAN }
                  },
                  required: ['keyword', 'match']
                }
              },
              improvementsToAdd: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Items to add to align with this JD.' },
              improvementsToRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Items to remove or de-emphasize.' }
            },
            required: ['atsScore', 'jdMatchScore', 'skills', 'matchedJDKeywords', 'missingJDKeywords', 'missingSections', 'suggestions', 'grammarIssues', 'keywords', 'improvementsToAdd', 'improvementsToRemove']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const base = this.simulateResumeWithJD(resumeText, jobDescription, fileName, targetRole);

      return {
        ...base,
        id: `res-${Math.random().toString(36).substr(2, 9)}`,
        userId: '',
        fileName,
        uploadedAt: new Date().toISOString(),
        jobDescription,
        suggestions: parsed.suggestions?.length ? parsed.suggestions : base.suggestions,
        grammarIssues: parsed.grammarIssues?.length ? parsed.grammarIssues : base.grammarIssues,
        improvementsToAdd: parsed.improvementsToAdd?.length ? parsed.improvementsToAdd : base.improvementsToAdd,
        improvementsToRemove: parsed.improvementsToRemove?.length ? parsed.improvementsToRemove : base.improvementsToRemove
      };
    } catch (err) {
      console.error('Gemini JD Resume Analysis failed:', err);
      return this.simulateResumeWithJD(resumeText, jobDescription, fileName, targetRole);
    }
  },

  /**
   * Generates 5 tailored technical, coding, project, behavioral, and analytical interview questions.
   *
   * Fallback: If GEMINI_API_KEY is not configured or the API request fails,
   * generates standard placement interview questions tailored to the candidate's target role and primary skill.
   *
   * @param resumeText - Excerpt of candidate resume for context
   * @param branch - Engineering branch (e.g., Computer Science, Mechanical)
   * @param skills - Array of candidate's core technical competencies
   * @param projects - Array of student's completed academic and personal projects
   * @param targetRole - Target engineering job role (e.g., Full Stack Engineer)
   * @param experienceLevel - Experience tier (e.g., Entry Level, Intern)
   * @returns Array of exactly 5 interview question strings
   */
  async generateQuestions(
    resumeText: string,
    branch: string,
    skills: string[],
    projects: string[],
    targetRole: string,
    experienceLevel: string
  ): Promise<string[]> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateQuestions(skills, targetRole);
    }

    try {
      const prompt = `Generate exactly 5 targeted engineering interview questions strictly within these 4 domains for an engineering interview:
Candidate Context:
- Target Job Role: ${targetRole}
- Engineering Branch: ${branch}
- Experience Level: ${experienceLevel}
- Core Skills: ${skills.join(', ')}
- Projects: ${projects.join(', ')}
- Resume Excerpt: ${resumeText.substring(0, 2000)}

Domains:
1. Technical Core (specifically on skills like ${skills[0] || 'programming'})
2. Programming & Coding / System Design
3. Project & Resume-Based (specifically on ${projects[0] || 'core projects'})
4. Behavioral & HR
5. Advanced Technical Application / System Architecture

Do NOT generate aptitude, math puzzle, or general numerical reasoning questions.
Return exactly 5 questions as a JSON array of strings.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite technical interviewer from a top-tier tech firm. Generate highly realistic, specific, and standard interview questions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (err) {
      console.error('Gemini Question Generation failed:', err);
      return this.simulateQuestions(skills, targetRole);
    }
  },

  /**
   * Evaluates a single mock interview answer, providing discrete scores (0-10) for technical accuracy,
   * communication, confidence, grammar, and delivery clarity.
   *
   * Fallback: If GEMINI_API_KEY is not configured, analyzes length and provides constructive feedback.
   *
   * @param question - The interview question presented to the candidate
   * @param answer - The candidate's spoken or typed answer transcript
   * @returns Structured AnswerEvaluation with category scores and written assessor feedback
   */
  async evaluateAnswer(question: string, answer: string): Promise<AnswerEvaluation> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateAnswerEvaluation(question, answer);
    }

    try {
      const prompt = `Evaluate the candidate's answer to the interview question.
Question: "${question}"
Candidate Answer: "${answer}"

Evaluate based on:
1. Technical Accuracy (Is the answer technically correct and detailed?)
2. Communication (Is the answer structured, fluent, and professional?)
3. Confidence & Clarity (Is the delivery confident and easy to understand?)
4. Grammar (Is there good sentence structure and grammatical correctness?)

Return the scores and qualitative feedback in JSON format.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective technical assessor. Give realistic, constructive, and precise feedback with discrete scores out of 10.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Overall score for this answer out of 10.' },
              feedback: { type: Type.STRING, description: 'Constructive analysis of the answer, including what went well and what is missing.' },
              technicalScore: { type: Type.INTEGER, description: 'Technical score out of 10.' },
              communicationScore: { type: Type.INTEGER, description: 'Communication structure score out of 10.' },
              confidenceScore: { type: Type.INTEGER, description: 'Confidence / clarity score out of 10.' },
              grammar: { type: Type.STRING, description: 'Feedback about grammatical correctness and wording.' },
              clarity: { type: Type.STRING, description: 'Feedback about delivery clarity and vocabulary.' }
            },
            required: ['score', 'feedback', 'technicalScore', 'communicationScore', 'confidenceScore', 'grammar', 'clarity']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Gemini Answer Evaluation failed:', err);
      return this.simulateAnswerEvaluation(question, answer);
    }
  },

  /**
   * Streams token chunks for evaluating an answer in real-time over Server-Sent Events (SSE).
   *
   * Fallback: If GEMINI_API_KEY is absent, yields simulated feedback words with a 30ms delay.
   *
   * @param question - The interview question
   * @param answer - The candidate's answer
   * @yields String token chunks as generated by Gemini stream or simulated typewriter
   */
  async *evaluateAnswerStream(question: string, answer: string): AsyncGenerator<string> {
    const client = getGeminiClient();

    if (!client) {
      const sim = this.simulateAnswerEvaluation(question, answer);
      const words = sim.feedback.split(/(\s+)/);
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 30));
        yield word;
      }
      return;
    }

    try {
      const prompt = `Evaluate the candidate's answer to the interview question.
Question: "${question}"
Candidate Answer: "${answer}"

Provide constructive, razor-sharp technical and communication analysis of the answer. Highlight what went well and what is missing.`;

      const responseStream = await client.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective technical assessor. Give constructive, precise, real-time feedback.',
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (err) {
      console.error('Gemini Answer Evaluation streaming failed, using simulation:', err);
      const sim = this.simulateAnswerEvaluation(question, answer);
      const words = sim.feedback.split(/(\s+)/);
      for (const word of words) {
        yield word;
      }
    }
  },

  /**
   * Generates a conversational follow-up question based on the candidate's previous response.
   *
   * Fallback: Generates role-based conversational probes when API key is unconfigured.
   *
   * @param originalQuestion - The initial question asked
   * @param candidateAnswer - The candidate's response
   * @param evaluation - Prior answer evaluation
   * @returns Probing follow-up question string
   */
  async generateFollowUp(
    originalQuestion: string,
    candidateAnswer: string,
    evaluation: AnswerEvaluation
  ): Promise<string> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateFollowUp(originalQuestion, candidateAnswer);
    }

    try {
      const prompt = `You are a senior technical interviewer conducting an engineering placement interview.
Original Question: "${originalQuestion}"
Candidate Answer: "${candidateAnswer.substring(0, 3000)}"
Answer Assessment Score: ${evaluation.score}/10
Assessor Feedback: "${evaluation.feedback}"

Based directly on what the candidate explained in their answer, generate exactly ONE probing follow-up question that tests deeper technical understanding, architectural implications, edge cases, or trade-offs. The question must specifically refer to something mentioned in their answer. Return only the question text without greetings or preambles.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are an exacting senior software engineer interviewer. Ask one sharp, direct, technical follow-up question.',
          responseMimeType: 'text/plain'
        }
      });

      const text = (response.text || '').trim();
      return text || this.simulateFollowUp(originalQuestion, candidateAnswer);
    } catch (err) {
      console.error('Gemini Follow-Up generation failed:', err);
      return this.simulateFollowUp(originalQuestion, candidateAnswer);
    }
  },

  /**
   * Generates a comprehensive feedback report at the end of the mock interview session.
   *
   * Fallback: Synthesizes aggregate scores and checklist from local QA logs.
   *
   * @param jobRole - Target job title
   * @param qaList - List of all questions, answers, and evaluations in the completed interview
   * @returns Placement readiness report with category percentages and actionable suggestions
   */
  async generateOverallReport(
    jobRole: string,
    qaList: { question: string; answer: string; evaluation?: AnswerEvaluation }[]
  ): Promise<{
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    feedbackText: string;
    suggestions: string[];
  }> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateOverallReport(qaList);
    }

    try {
      const qasFormatted = qaList.map(q => `Q: ${q.question}\nA: ${q.answer}\nScore: ${q.evaluation?.score || 0}/10\nFeedback: ${q.evaluation?.feedback || ''}`).join('\n\n');
      const prompt = `Synthesize these individual question answers and evaluations into a final Placement Readiness Report.
Job Role: ${jobRole}
Question-Answer Logs:
${qasFormatted}

Evaluate student placement readiness, identify global areas of strength, weaknesses, and a structured checklist for improvement. Return scores as percentages (out of 100).`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are a career development expert and senior engineering manager. Deliver a highly supportive, practical, yet professional placement readiness assessment.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER, description: 'Aggregate placement readiness score (0-100).' },
              technicalScore: { type: Type.INTEGER, description: 'Combined technical competency score (0-100).' },
              communicationScore: { type: Type.INTEGER, description: 'Combined communication skill score (0-100).' },
              confidenceScore: { type: Type.INTEGER, description: 'Combined confidence/clarity score (0-100).' },
              feedbackText: { type: Type.STRING, description: 'A detailed executive summary feedback paragraph addressing placement readiness.' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Actionable bullet-point suggestions to help the student improve before real placement drives.' }
            },
            required: ['overallScore', 'technicalScore', 'communicationScore', 'confidenceScore', 'feedbackText', 'suggestions']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Gemini Overall Report failed:', err);
      return this.simulateOverallReport(qaList);
    }
  },

  /**
   * Evaluates live code submission from Monaco Code Lab.
   * Analyzes algorithmic time and space complexity (Big-O), correctness, and code style.
   *
   * Fallback: Analyzes loop nesting patterns (e.g. single loop O(N), nested loops O(N^2)).
   *
   * @param code - Source code string
   * @param language - Programming language (e.g., javascript, python, cpp)
   * @param problemStatement - Problem requirements and description
   * @returns Code review analysis with Big-O complexity, correctness score, and suggestions
   */
  async reviewCode(
    code: string,
    language: string,
    problemStatement: string
  ): Promise<{
    correctness: number;
    timeComplexity: string;
    spaceComplexity: string;
    feedback: string;
    suggestions: string[];
  }> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateCodeReview(code, language);
    }

    try {
      const prompt = `Review this candidate's code submission for an engineering technical interview round.
Problem Statement:
${problemStatement}

Language: ${language}
Submitted Code:
\`\`\`${language}
${code.substring(0, 10000)}
\`\`\`

Evaluate:
1. Correctness score (0-100) — does it solve the problem without fatal errors or edge case failures?
2. Big-O Time Complexity (e.g. O(N), O(N log N), O(N^2)).
3. Big-O Space Complexity (e.g. O(1), O(N)).
4. Detailed feedback addressing clean architecture, idiomatic language patterns, and readability.
5. Actionable suggestions for optimization or handling missing edge cases.

Return JSON.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are a principal software engineer conducting an elite coding interview. Give rigorous, precise algorithmic and stylistic feedback.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctness: { type: Type.INTEGER, description: 'Correctness rating from 0 to 100.' },
              timeComplexity: { type: Type.STRING, description: 'Estimated Big-O time complexity.' },
              spaceComplexity: { type: Type.STRING, description: 'Estimated Big-O auxiliary space complexity.' },
              feedback: { type: Type.STRING, description: 'Detailed technical critique.' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific suggestions for improvement.' }
            },
            required: ['correctness', 'timeComplexity', 'spaceComplexity', 'feedback', 'suggestions']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Gemini Code Review failed:', err);
      return this.simulateCodeReview(code, language);
    }
  },

  // --- AI STATUS & COPILOT HELPERS ---

  getStatus() {
    const isConfigured = isGeminiConfigured();
    const model = getEffectiveModel();
    return {
      configured: isConfigured,
      model,
      status: isConfigured ? 'active' : 'unconfigured',
      mode: isConfigured ? `Google Gemini (${model}) - Live AI Connected` : 'Unconfigured - GEMINI_API_KEY Required',
      features: [
        'Career Assistant Technical Mentor & Placement Prep',
        'Multi-factor ATS Resume Scanner & Gap Analysis',
        'Tailored Technical Question Generation',
        'Real-time SSE Answer Evaluation',
        'Dynamic Follow-up Question Prompter',
        'Monaco Code Lab Algorithmic Review'
      ]
    };
  },

  /**
   * Conversational Career Assistant AI Mentor
   * Directly interfaces with Google Gemini model to assist candidates with:
   * - Programming & Web Dev (Java, Python, C, C++, JS, React, HTML, CSS, Spring Boot)
   * - DSA, System Design, SQL, OS, DBMS, Computer Networks
   * - Technical & HR Placement Prep, ATS Resume guidance, Code Debugging
   */
  async chat(params: {
    message: string;
    history?: Array<{ role: string; content: string; error?: boolean }>;
    learningMode?: boolean;
    careerContext?: Record<string, any>;
  }): Promise<{ answer: string; source: 'gemini'; model: string }> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error(
        'Google Gemini AI service is not configured. Please set a valid GEMINI_API_KEY in your server environment or .env file and restart the server.'
      );
    }

    const model = getEffectiveModel();

    let systemInstruction = `You are Career Navigator AI, an expert technical mentor, engineering educator, and placement preparation assistant for students and software developers.

Your core mission is to answer candidate questions accurately, clearly, and practically to help them master technical concepts and excel in placements and technical interviews.

Core Competencies:
- Programming Languages: Java, Python, C, C++, JavaScript, TypeScript, HTML, CSS.
- Frameworks & Backends: Spring Boot, REST APIs, React, Node.js, Express, Microservices, SQL, relational databases (PostgreSQL/MySQL), and NoSQL (MongoDB).
- Computer Science Core: Data Structures & Algorithms (arrays, linked lists, trees, graphs, dynamic programming, sorting, recursion), Big-O time and space complexity.
- Systems Concepts: Operating Systems (concurrency, threads, synchronization, memory management), DBMS (normalization, indexing, ACID transactions), Computer Networks (OSI, TCP/IP, HTTP/HTTPS, DNS), Git and GitHub workflows.
- Placement Preparation: ATS resume improvements, project architecture walkthroughs for interviews, coding rounds, and behavioral questions using the STAR framework.

Response Guidelines:
1. Direct & Factual: Answer the actual question directly in simple, precise language.
2. Code & Examples: Include practical, tested-pattern code examples in markdown code blocks (\`\`\`language ... \`\`\`) where appropriate. Explain code step-by-step for beginners.
3. Complexity & Output: For algorithmic or coding queries, state the expected output, Big-O time complexity, and auxiliary space complexity.
4. Debugging: For error messages or bug reports, identify the likely root cause, explain why it happens, and provide the corrected code.
5. Career & Placement Advice: Provide realistic, actionable advice tailored to college students and freshers.
6. Context-Aware: In multi-turn conversations, use earlier context to understand follow-ups seamlessly.
7. Honesty & Integrity: Never invent APIs, company policies, or fake facts. If uncertain, state the uncertainty and provide steps to verify. Never claim code was executed unless tested.`;

    if (params.learningMode) {
      systemInstruction += `\n\n[LEARNING MODE ACTIVE]
- Explain concepts step by step using relatable analogies and clean definitions.
- Avoid overwhelming technical jargon without explaining it first.
- End your response with:
  1. A short, interactive 1-question "Concept Check" to test their understanding.
  2. A 2-sentence key takeaway summary.`;
    }

    if (params.careerContext && Object.keys(params.careerContext).length > 0) {
      systemInstruction += `\n\n[CANDIDATE CONTEXT] (Personalize explanations to their profile):`;
      if (params.careerContext.targetRole) systemInstruction += `\n- Target Role: ${params.careerContext.targetRole}`;
      if (params.careerContext.branch) systemInstruction += `\n- Branch: ${params.careerContext.branch}`;
      if (params.careerContext.skills && Array.isArray(params.careerContext.skills)) systemInstruction += `\n- Skills: ${params.careerContext.skills.join(', ')}`;
      if (params.careerContext.latestAtsScore) systemInstruction += `\n- Resume ATS Score: ${params.careerContext.latestAtsScore}%`;
      if (params.careerContext.latestInterviewScore) systemInstruction += `\n- Mock Interview Score: ${params.careerContext.latestInterviewScore}%`;
    }

    // Format multi-turn contents ensuring proper alternation and role assignment
    const contents = formatGeminiChatContents(params.history || [], params.message);

    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Gemini AI returned an empty response. Please retry with more specific details.');
      }

      return {
        answer: text,
        source: 'gemini',
        model
      };
    } catch (err: any) {
      const msg = err.message || String(err);
      console.error('Gemini Chat API call error:', msg);

      if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
        throw new Error('Google Gemini AI is currently experiencing high demand. Please retry in a few moments.');
      }
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Google Gemini API quota or rate limit exceeded. Please wait a moment and retry.');
      }
      if (msg.includes('API_KEY_INVALID') || (msg.includes('400') && msg.includes('API key'))) {
        throw new Error('Configured GEMINI_API_KEY is invalid or unauthorized. Please verify the key in .env.');
      }
      if (msg.includes('404') && msg.includes('model')) {
        throw new Error(`The configured Gemini model (${model}) is not accessible with this API key.`);
      }

      throw new Error(`Google Gemini API error: ${msg.replace(/key=[^&\s]+/g, 'key=[REDACTED]')}`);
    }
  },

  async quickAsk(question: string): Promise<{ answer: string; source: 'gemini' | 'simulation' }> {
    const client = getGeminiClient();
    if (!client) {
      return {
        answer: this.simulateQuickAsk(question),
        source: 'simulation'
      };
    }
    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: `You are Career Navigator AI, an elite technical interviewer and placement mentor. Answer this placement/engineering question concisely and clearly in 2-4 sentences:\n\n${question}`
      });
      return {
        answer: response.text || 'No response generated.',
        source: 'gemini'
      };
    } catch {
      return {
        answer: this.simulateQuickAsk(question),
        source: 'simulation'
      };
    }
  },

  simulateQuickAsk(question: string): string {
    const qLower = question.toLowerCase();
    if (qLower.includes('cap') || qLower.includes('theorem')) {
      return 'The CAP Theorem proves that a distributed data store can guarantee at most two of Consistency, Availability, and Partition Tolerance simultaneously. In real-world cloud architectures where network partitions are inevitable, systems prioritize either CP (e.g. MongoDB majority writes) or AP (e.g. Cassandra/DynamoDB for high write availability).';
    }
    if (qLower.includes('kafka') || qLower.includes('event') || qLower.includes('queue')) {
      return 'Apache Kafka utilizes an immutable distributed commit log organized by topics and partitions. Core benefits include persistent event replayability, horizontal consumer scaling, and decoupling asynchronous pipelines from synchronous request lifecycles.';
    }
    if (qLower.includes('star') || qLower.includes('behavioral')) {
      return 'The STAR framework structures interview answers into: Situation (context/constraints), Task (your specific challenge), Action (concrete technical or architectural steps you led), and Result (quantifiable metrics such as % latency reduced or dollar savings).';
    }
    if (qLower.includes('index') || qLower.includes('database') || qLower.includes('b-tree')) {
      return 'Database indexes commonly use B-Trees to provide O(log N) lookup times. While indexes accelerate read queries (SELECT, WHERE, JOIN), each additional index adds write overhead (INSERT, UPDATE, DELETE) as the index tree must be updated in sync.';
    }
    return `Career Navigator AI Placement Strategy for "${question}": Frame your answer by stating technical definitions first, explaining underlying trade-offs (time vs memory, read vs write), and backing your solution with a concrete architectural use-case.`;
  },

  // --- ROLE DEFINITIONS FOR DYNAMIC SCORING ---
  getRoleDefinition(roleQuery?: string) {
    const roles: Record<string, { title: string; coreSkills: string[]; secondarySkills: string[]; description: string }> = {
      'frontend': {
        title: 'Frontend Developer',
        coreSkills: ['react', 'vue', 'angular', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'next.js', 'redux', 'vite', 'webpack', 'responsive design', 'ui/ux'],
        secondarySkills: ['sass', 'dom', 'rest api', 'accessibility', 'jest', 'cypress', 'figma', 'graphql'],
        description: 'Client-side architecture, reactive UI components, accessibility, and modern web styling.'
      },
      'backend': {
        title: 'Backend Developer',
        coreSkills: ['node.js', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'go', 'golang', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'rest api', 'microservices'],
        secondarySkills: ['docker', 'kubernetes', 'aws', 'graphql', 'c#', '.net', 'kafka', 'grpc', 'orm', 'linux'],
        description: 'Server-side API architecture, database performance, caching, and distributed systems.'
      },
      'fullstack': {
        title: 'Full Stack Engineer',
        coreSkills: ['react', 'next.js', 'typescript', 'javascript', 'node.js', 'express', 'sql', 'postgresql', 'mongodb', 'docker', 'rest api', 'git'],
        secondarySkills: ['tailwind', 'redis', 'aws', 'graphql', 'ci/cd', 'python', 'html/css', 'jest'],
        description: 'End-to-end web applications combining reactive interfaces with scalable server architectures.'
      },
      'devops': {
        title: 'DevOps & Cloud Engineer',
        coreSkills: ['docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'jenkins', 'github actions', 'linux', 'bash'],
        secondarySkills: ['ansible', 'helm', 'prometheus', 'grafana', 'cloudformation', 'microservices', 'networking', 'python'],
        description: 'Cloud infrastructure-as-code, container orchestration, automated release pipelines, and site reliability.'
      },
      'datascience': {
        title: 'Data Scientist / AI/ML Engineer',
        coreSkills: ['python', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'machine learning', 'deep learning', 'sql', 'ai'],
        secondarySkills: ['nlp', 'computer vision', 'data pipeline', 'spark', 'jupyter', 'statistics', 'matplotlib', 'tableau'],
        description: 'Predictive modeling, deep learning architectures, statistical data exploration, and AI pipelines.'
      },
      'mobile': {
        title: 'Mobile App Developer',
        coreSkills: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'dart', 'mobile'],
        secondarySkills: ['sqlite', 'firebase', 'app store', 'play store', 'rest api', 'redux', 'mobile ui'],
        description: 'Native and cross-platform mobile application engineering, responsive touch UI, and offline caching.'
      },
      'cybersecurity': {
        title: 'Cybersecurity Engineer',
        coreSkills: ['cybersecurity', 'security', 'penetration testing', 'cryptography', 'siem', 'soc', 'vulnerability', 'owasp', 'firewall', 'network security'],
        secondarySkills: ['wireshark', 'python', 'incident response', 'iso 27001', 'nist', 'zero trust', 'ssl/tls', 'linux'],
        description: 'Threat modeling, vulnerability mitigation, secure coding guidelines, and network defense.'
      },
      'embedded': {
        title: 'Embedded Systems Engineer',
        coreSkills: ['c', 'c++', 'rtos', 'microcontroller', 'arm', 'firmware', 'spi', 'i2c', 'uart', 'embedded'],
        secondarySkills: ['pcb', 'oscilloscope', 'hardware', 'assembly', 'iot', 'linux kernel', 'sensors'],
        description: 'Low-level bare-metal programming, RTOS scheduling, hardware bus protocols, and IoT firmware.'
      }
    };

    if (!roleQuery || !roleQuery.trim()) {
      return {
        key: 'general',
        title: 'General Software Engineer',
        coreSkills: ['javascript', 'python', 'java', 'c++', 'sql', 'git', 'data structures', 'algorithms', 'rest api'],
        secondarySkills: ['docker', 'linux', 'testing', 'html', 'css', 'cloud'],
        description: 'General engineering problem solving, algorithmic foundations, and core technical proficiencies.'
      };
    }

    const queryLower = roleQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, profile] of Object.entries(roles)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        return { key, ...profile };
      }
      if (profile.title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(queryLower)) {
        return { key, ...profile };
      }
    }

    return {
      key: 'custom',
      title: roleQuery.trim(),
      coreSkills: [roleQuery.toLowerCase(), 'git', 'sql', 'rest api', 'problem solving'],
      secondarySkills: ['docker', 'cloud', 'testing', 'linux'],
      description: `Targeted analysis for specialized role: ${roleQuery.trim()}`
    };
  },

  // --- SIMULATION FALLBACKS ---

  simulateResumeAnalysis(resumeText: string, fileName: string, targetRole?: string): ResumeAnalysis & { simulated: boolean } {
    const normalizedText = normalizeResumeText(resumeText);
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
      id: `sim-res-${Math.random().toString(36).substr(2, 9)}`,
      userId: '',
      fileName,
      targetRole: targetRole || undefined,
      uploadedAt: new Date().toISOString(),
      simulated: true,
      atsScore: scoring.atsScore,
      categoryBreakdown: scoring.categoryBreakdown,
      skills: detectedSkills.length > 0 ? detectedSkills : ['General Software Engineering'],
      detectedSections,
      missingSections,
      sectionDetails,
      suggestions: scoring.suggestions,
      grammarIssues: scoring.grammarIssues,
      keywords: keywords.map((k) => ({
        keyword: k.keyword,
        match: k.match,
        count: k.count,
        density: k.density
      })),
      improvementsToAdd: scoring.improvementsToAdd,
      improvementsToRemove: scoring.improvementsToRemove,
      contentHash,
      wordCount
    };
  },

  simulateResumeWithJD(
    resumeText: string,
    jobDescription: string,
    fileName: string,
    targetRole?: string
  ): ResumeAnalysis & { simulated: boolean } {
    const base = this.simulateResumeAnalysis(resumeText, fileName, targetRole);
    const normalizedText = normalizeResumeText(resumeText);
    const jdMatch = matchJobDescription(normalizedText, jobDescription);

    const matchedSet = new Set<string>();
    for (const kw of jdMatch.matchedJDKeywords) {
      matchedSet.add(kw);
      matchedSet.add(kw.toUpperCase());
    }

    const missingSet = new Set<string>();
    for (const kw of jdMatch.missingJDKeywords) {
      missingSet.add(kw);
      missingSet.add(kw.toUpperCase());
    }

    return {
      ...base,
      jdMatchScore: jdMatch.jdMatchScore,
      jobDescription,
      matchedJDKeywords: Array.from(matchedSet),
      missingJDKeywords: Array.from(missingSet)
    };
  },

  simulateQuestions(skills: string[], targetRole: string): string[] {
    const mainSkill = skills[0] || 'programming';
    return [
      `How does ${targetRole} benefit from the key features of ${mainSkill}? Explain with a real-world architectural example.`,
      `Explain your core project's software structure. How did you design database tables/schema and structure API endpoints for optimal payload transfer?`,
      `Describe a technical bug you encountered in one of your projects. What systematic steps did you execute to debug and resolve it?`,
      `If a team member strongly disagrees with your technical design approach for a critical placement assignment, how do you handle the conflict?`,
      `What is horizontal vs vertical scaling in server architecture? Which would you recommend for hosting a high-traffic e-commerce database, and why?`
    ];
  },

  simulateAnswerEvaluation(question: string, answer: string): AnswerEvaluation {
    const answerLen = answer.trim().length;
    let score = 5;
    let feedback = '';

    if (answerLen < 15) {
      score = 4;
      feedback = 'The answer is too brief. In a technical interview, you need to expand considerably, provide definitions, use cases, and outline your experience.';
    } else if (answerLen < 60) {
      score = 6;
      feedback = 'A decent start, but the answer lacks technical depth. Mention architectural implications, specific keywords, or libraries/technologies to demonstrate mastery.';
    } else {
      score = 8;
      feedback = 'Good detail. You explained the concepts clearly, structured your sentences logically, and demonstrated a practical understanding of the core subject.';
    }

    return {
      score,
      feedback,
      technicalScore: Math.min(10, score + (answerLen > 100 ? 1 : 0)),
      communicationScore: Math.min(10, score + 1),
      confidenceScore: Math.min(10, score),
      grammar: 'Grammatically sound. Good professional phrasing.',
      clarity: 'Highly clear and understandable delivery.'
    };
  },

  simulateOverallReport(qaList: { question: string; answer: string; evaluation?: AnswerEvaluation }[]): {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    feedbackText: string;
    suggestions: string[];
  } {
    const total = qaList.reduce((sum, qa) => sum + (qa.evaluation?.score || 5), 0);
    const count = qaList.length || 1;
    const avgScoreOutOf10 = total / count;
    const overallPct = Math.round(avgScoreOutOf10 * 10);

    return {
      overallScore: overallPct,
      technicalScore: Math.min(100, Math.round(avgScoreOutOf10 * 10 + 2)),
      communicationScore: Math.min(100, Math.round(avgScoreOutOf10 * 10 - 2)),
      confidenceScore: Math.min(100, Math.round(avgScoreOutOf10 * 10)),
      feedbackText: `You have completed the mock interview with an overall rating of ${overallPct}%. You demonstrated consistent familiarity with core engineering competencies and communicated your points reasonably well. To stand out in competitive placement drives, strive to inject more structured technical detail and back your project descriptions with objective performance metrics.`,
      suggestions: [
        'Utilize the structured STAR (Situation, Task, Action, Result) template for all project-based and behavioral questions.',
        'Introduce concrete engineering metrics when explaining your contributions (e.g., "improved performance by 15%").',
        'Deepen your command of system architecture principles (scalability, database normalization, and caching).',
        'Slow down slightly during communication to sound more composed and improve articulation clarity.'
      ]
    };
  },

  simulateFollowUp(originalQuestion: string, candidateAnswer: string): string {
    const textLower = candidateAnswer.toLowerCase();

    if (textLower.includes('scale') || textLower.includes('postgres') || textLower.includes('database') || textLower.includes('sql')) {
      return 'You mentioned database scaling techniques. How would you specifically handle cache invalidation and replication lag between the write master and read replicas in high-throughput operations?';
    }
    if (textLower.includes('react') || textLower.includes('state') || textLower.includes('frontend') || textLower.includes('redux')) {
      return 'Regarding your frontend architecture, what specific profiling strategies or React memoization patterns would you apply to prevent unnecessary re-renders when broadcasting updates across complex component trees?';
    }
    if (textLower.includes('node') || textLower.includes('api') || textLower.includes('microservice') || textLower.includes('express')) {
      return 'Building on your API discussion, how would you design idempotent mutation endpoints and rate limiting to prevent duplicate transaction executions during distributed network retries?';
    }
    if (textLower.includes('test') || textLower.includes('docker') || textLower.includes('deploy') || textLower.includes('ci/cd')) {
      return 'You touched on deployment and testing workflows. How do you structure integration tests in your CI/CD pipeline to balance exhaustive test coverage against deployment build times?';
    }

    return 'Building on the architecture you just described, what is the single largest performance bottleneck in that design, and how would you re-architect it to gracefully handle a 10x traffic spike?';
  },

  simulateCodeReview(code: string, language: string): {
    correctness: number;
    timeComplexity: string;
    spaceComplexity: string;
    feedback: string;
    suggestions: string[];
  } {
    const codeLen = code.trim().length;
    const hasLoops = code.includes('for') || code.includes('while') || code.includes('forEach');
    const hasNestedLoops = /for.*for|while.*while|for.*while/s.test(code);
    const hasHashMap = code.includes('Map') || code.includes('Set') || code.includes('{}') || code.includes('dict');

    const timeComplexity = hasNestedLoops ? 'O(N^2)' : hasLoops ? 'O(N)' : 'O(1)';
    const spaceComplexity = hasHashMap ? 'O(N)' : 'O(1)';
    const correctness = Math.min(95, Math.max(60, 70 + (codeLen > 50 ? 15 : 0)));

    return {
      correctness,
      timeComplexity,
      spaceComplexity,
      feedback: `Solid implementation in ${language}. Your algorithmic approach demonstrates good control flow and clean syntax conventions. The logic successfully handles standard inputs.`,
      suggestions: [
        'Consider guarding against null, empty collections, or boundary edge conditions at the beginning of the function.',
        hasNestedLoops ? 'You can optimize this from O(N^2) to O(N) by using a Hash Map or Frequency Array.' : 'Current time complexity is optimal for this problem class.',
        'Add descriptive inline variable names and TypeScript interface contracts for improved production maintainability.'
      ]
    };
  }
};

/**
 * Normalizes multi-turn message history into Google GenAI format.
 * - Ensures alternating user/model roles
 * - Guarantees first role is 'user'
 * - Appends current message to the end
 * - Limits context window to 10 most recent turns
 */
export function formatGeminiChatContents(
  history: Array<{ role: string; content: string; error?: boolean }>,
  currentMessage: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const turns: Array<{ role: 'user' | 'model'; text: string }> = [];

  for (const m of history) {
    if (!m || !m.content || m.error) continue;
    const role: 'user' | 'model' = m.role === 'user' ? 'user' : 'model';
    turns.push({ role, text: m.content.trim() });
  }

  const trimmed = currentMessage.trim();
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user' || turns[turns.length - 1].text !== trimmed) {
    turns.push({ role: 'user', text: trimmed });
  }

  const recentTurns = turns.slice(-10);

  while (recentTurns.length > 0 && recentTurns[0].role !== 'user') {
    recentTurns.shift();
  }

  if (recentTurns.length === 0) {
    recentTurns.push({ role: 'user', text: trimmed });
  }

  const result: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const t of recentTurns) {
    if (result.length > 0 && result[result.length - 1].role === t.role) {
      result[result.length - 1].parts[0].text += `\n\n${t.text}`;
    } else {
      result.push({ role: t.role, parts: [{ text: t.text }] });
    }
  }

  return result;
}

