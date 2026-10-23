import { ResumeDocument, ResumeContent } from '../types.js';

interface PageStream {
  operations: string[];
}

/**
 * Escapes special characters for standard PDF string literals in WinAnsiEncoding.
 */
function escapePdfString(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7]/g, '-')
    .replace(/\t/g, '   ')
    .replace(/[^\x20-\x7E]/g, ' ');
}

/**
 * Wraps text into multiple lines given a maximum character length per line.
 */
function wrapWords(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.replace(/\r?\n/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Generates an ATS-compliant, publication-ready vector PDF document (A4 format).
 * Produces valid %PDF-1.4 binary buffer with selectable text and standard fonts.
 */
export function generateResumePdfBuffer(doc: ResumeDocument): Buffer {
  const content = doc.content || ({} as ResumeContent);
  const personal = content.personalInfo || {
    fullName: doc.title || 'Professional Resume',
    headline: doc.targetRole || '',
    email: '',
    phone: '',
    cityCountry: '',
    linkedIn: '',
    github: '',
    portfolioWebsite: ''
  };

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 40;
  const topMargin = 42;
  const bottomMargin = 42;

  const pages: PageStream[] = [{ operations: [] }];
  let currentPageIndex = 0;
  let cursorY = pageHeight - topMargin;

  function currentOps(): string[] {
    return pages[currentPageIndex].operations;
  }

  function checkPageBreak(neededHeight: number) {
    if (cursorY - neededHeight < bottomMargin) {
      pages.push({ operations: [] });
      currentPageIndex++;
      cursorY = pageHeight - topMargin;
      // Add subtle running header on continuation pages
      const ops = pages[currentPageIndex].operations;
      ops.push('0.45 0.52 0.60 rg');
      ops.push(`BT /F1 8 Tf ${marginX} ${cursorY} Td (${escapePdfString(personal.fullName || doc.title)} - Continued) Tj ET`);
      ops.push('0.85 0.88 0.92 RG 0.5 w');
      ops.push(`${marginX} ${cursorY - 4} m ${pageWidth - marginX} ${cursorY - 4} l S`);
      cursorY -= 18;
    }
  }

  function drawText(
    text: string,
    x: number,
    y: number,
    font: 'F1' | 'F2' | 'F3' | 'F4',
    size: number,
    colorRgb: [number, number, number] = [0.1, 0.12, 0.15]
  ) {
    const ops = currentOps();
    const [r, g, b] = colorRgb;
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfString(text)}) Tj ET`);
  }

  function drawSectionHeader(title: string) {
    checkPageBreak(32);
    cursorY -= 14;
    const ops = currentOps();
    // Section title
    ops.push('0.10 0.25 0.55 rg'); // Deep primary navy
    ops.push(`BT /F2 10.5 Tf ${marginX} ${cursorY.toFixed(2)} Td (${escapePdfString(title.toUpperCase())}) Tj ET`);
    cursorY -= 5;
    // Underline
    ops.push('0.18 0.38 0.75 RG 1.2 w');
    ops.push(`${marginX} ${cursorY.toFixed(2)} m ${pageWidth - marginX} ${cursorY.toFixed(2)} l S`);
    cursorY -= 10;
  }

  // --- 1. CANDIDATE HEADER ---
  const candidateName = personal.fullName || doc.title || 'Professional Resume';
  drawText(candidateName, marginX, cursorY, 'F2', 18, [0.08, 0.14, 0.25]);
  cursorY -= 18;

  if (personal.headline) {
    drawText(personal.headline, marginX, cursorY, 'F2', 10.5, [0.25, 0.35, 0.50]);
    cursorY -= 14;
  }

  // Contact line
  const contacts: string[] = [];
  if (personal.email) contacts.push(personal.email);
  if (personal.phone) contacts.push(personal.phone);
  if (personal.cityCountry) contacts.push(personal.cityCountry);
  if (personal.linkedIn) contacts.push(personal.linkedIn.replace(/^https?:\/\/(www\.)?/, ''));
  if (personal.github) contacts.push(personal.github.replace(/^https?:\/\/(www\.)?/, ''));
  if (personal.portfolioWebsite) contacts.push(personal.portfolioWebsite.replace(/^https?:\/\/(www\.)?/, ''));

  if (contacts.length > 0) {
    const contactLine = contacts.join('  |  ');
    const contactLines = wrapWords(contactLine, 95);
    for (const cline of contactLines) {
      drawText(cline, marginX, cursorY, 'F1', 8.5, [0.35, 0.40, 0.48]);
      cursorY -= 11;
    }
  }

  // Top header rule
  const ops0 = currentOps();
  ops0.push('0.80 0.84 0.90 RG 0.75 w');
  ops0.push(`${marginX} ${cursorY.toFixed(2)} m ${pageWidth - marginX} ${cursorY.toFixed(2)} l S`);
  cursorY -= 6;

  // --- 2. PROFESSIONAL SUMMARY ---
  if (content.summary && content.summary.trim()) {
    drawSectionHeader('Professional Summary');
    const summaryLines = wrapWords(content.summary.trim(), 98);
    for (const sLine of summaryLines) {
      checkPageBreak(12);
      drawText(sLine, marginX, cursorY, 'F1', 9, [0.15, 0.18, 0.22]);
      cursorY -= 12;
    }
  }

  // --- 3. TECHNICAL SKILLS ---
  const skills = content.skills;
  const hasSkills = skills && (
    (skills.programmingLanguages && skills.programmingLanguages.length > 0) ||
    (skills.frameworks && skills.frameworks.length > 0) ||
    (skills.databases && skills.databases.length > 0) ||
    (skills.toolsPlatforms && skills.toolsPlatforms.length > 0) ||
    (skills.coreConcepts && skills.coreConcepts.length > 0) ||
    (skills.communicationLeadership && skills.communicationLeadership.length > 0)
  );

  if (hasSkills) {
    drawSectionHeader('Technical Skills');
    const skillGroups = [
      { label: 'Languages', items: skills.programmingLanguages },
      { label: 'Frameworks & Libraries', items: skills.frameworks },
      { label: 'Databases & Storage', items: skills.databases },
      { label: 'Tools & Cloud Platforms', items: skills.toolsPlatforms },
      { label: 'Core Concepts & Architecture', items: skills.coreConcepts },
      { label: 'Leadership & Methodologies', items: skills.communicationLeadership }
    ].filter(g => g.items && g.items.length > 0);

    for (const group of skillGroups) {
      checkPageBreak(13);
      const text = `${group.label}: ${group.items.join(', ')}`;
      const wrapped = wrapWords(text, 95);
      for (let i = 0; i < wrapped.length; i++) {
        checkPageBreak(12);
        if (i === 0) {
          const labelPart = `${group.label}: `;
          drawText(labelPart, marginX, cursorY, 'F2', 9, [0.12, 0.16, 0.22]);
          const labelOffset = Math.min(180, labelPart.length * 5.3);
          const remainder = wrapped[0].substring(labelPart.length);
          if (remainder) {
            drawText(remainder, marginX + labelOffset, cursorY, 'F1', 9, [0.20, 0.24, 0.30]);
          }
        } else {
          drawText(wrapped[i], marginX + 12, cursorY, 'F1', 9, [0.20, 0.24, 0.30]);
        }
        cursorY -= 12;
      }
    }
  }

  // --- 4. WORK EXPERIENCE ---
  if (content.experience && content.experience.length > 0) {
    drawSectionHeader('Work Experience');
    for (const exp of content.experience) {
      const anyExp = exp as any;
      checkPageBreak(28);
      // Row 1: Title and Date Range
      const expTitle = anyExp.title || exp.jobTitle || 'Role';
      const isCurrent = anyExp.current || exp.currentRole;
      const endDateStr = anyExp.endDate || (isCurrent ? 'Present' : '');
      const dates = [exp.startDate, endDateStr].filter(Boolean).join(' - ');
      drawText(expTitle, marginX, cursorY, 'F2', 10, [0.08, 0.12, 0.20]);
      if (dates) {
        const dateX = Math.max(pageWidth - marginX - (dates.length * 5.5), marginX + 240);
        drawText(dates, dateX, cursorY, 'F2', 9, [0.30, 0.38, 0.50]);
      }
      cursorY -= 13;

      // Row 2: Company and Location
      const compLoc = [exp.company, exp.location].filter(Boolean).join(' | ');
      if (compLoc) {
        drawText(compLoc, marginX, cursorY, 'F3', 9, [0.35, 0.40, 0.48]);
        cursorY -= 12;
      }

      // Responsibilities / Bullets
      const rawBullets = anyExp.responsibilities || anyExp.bullets || [];
      const bulletsList: string[] = Array.isArray(rawBullets)
        ? [...rawBullets]
        : (typeof rawBullets === 'string' && rawBullets.trim() ? [rawBullets.trim()] : []);

      if (Array.isArray(anyExp.bullets) && !Array.isArray(rawBullets)) {
        bulletsList.push(...anyExp.bullets);
      }
      if (anyExp.achievements) bulletsList.push(anyExp.achievements);
      if (anyExp.impact) bulletsList.push(anyExp.impact);
      if (anyExp.projectImpact) bulletsList.push(anyExp.projectImpact);

      for (const bullet of bulletsList) {
        if (!bullet || !bullet.trim()) continue;
        const bulletLines = wrapWords(bullet.trim(), 92);
        for (let bIdx = 0; bIdx < bulletLines.length; bIdx++) {
          checkPageBreak(12);
          if (bIdx === 0) {
            drawText('-', marginX + 4, cursorY, 'F2', 9, [0.18, 0.38, 0.75]);
            drawText(bulletLines[bIdx], marginX + 14, cursorY, 'F1', 9, [0.15, 0.18, 0.22]);
          } else {
            drawText(bulletLines[bIdx], marginX + 14, cursorY, 'F1', 9, [0.15, 0.18, 0.22]);
          }
          cursorY -= 12;
        }
      }
      cursorY -= 4;
    }
  }

  // --- 5. PROJECTS ---
  if (content.projects && content.projects.length > 0) {
    drawSectionHeader('Projects');
    for (const proj of content.projects) {
      const anyProj = proj as any;
      checkPageBreak(24);
      const projTitle = proj.title || 'Technical Project';
      drawText(projTitle, marginX, cursorY, 'F2', 10, [0.08, 0.12, 0.20]);

      const techStr = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '');
      if (techStr) {
        const techLabel = ` [${techStr}]`;
        const titleWidth = Math.min(220, projTitle.length * 6);
        drawText(techLabel, marginX + titleWidth + 6, cursorY, 'F3', 8.5, [0.30, 0.42, 0.60]);
      }
      cursorY -= 13;

      if (proj.description) {
        const descLines = wrapWords(proj.description, 94);
        for (const dl of descLines) {
          checkPageBreak(12);
          drawText(dl, marginX + 10, cursorY, 'F1', 9, [0.18, 0.22, 0.28]);
          cursorY -= 12;
        }
      }

      const contribs = Array.isArray(anyProj.keyContributions)
        ? anyProj.keyContributions
        : (anyProj.keyContributions ? [anyProj.keyContributions] : []);
      if (anyProj.resultsImpact) contribs.push(anyProj.resultsImpact);
      if (anyProj.impact) contribs.push(anyProj.impact);

      for (const contrib of contribs) {
        if (!contrib || !contrib.trim()) continue;
        const contribLines = wrapWords(contrib.trim(), 90);
        for (let cIdx = 0; cIdx < contribLines.length; cIdx++) {
          checkPageBreak(12);
          if (cIdx === 0) {
            drawText('-', marginX + 8, cursorY, 'F2', 9, [0.18, 0.38, 0.75]);
            drawText(contribLines[cIdx], marginX + 18, cursorY, 'F1', 9, [0.15, 0.18, 0.22]);
          } else {
            drawText(contribLines[cIdx], marginX + 18, cursorY, 'F1', 9, [0.15, 0.18, 0.22]);
          }
          cursorY -= 12;
        }
      }

      const liveUrl = anyProj.liveDemoUrl || proj.liveUrl;
      if (proj.githubUrl || liveUrl) {
        const linkStr = [
          proj.githubUrl ? `Code: ${proj.githubUrl.replace(/^https?:\/\//, '')}` : '',
          liveUrl ? `Live: ${liveUrl.replace(/^https?:\/\//, '')}` : ''
        ].filter(Boolean).join('  |  ');
        checkPageBreak(11);
        drawText(linkStr, marginX + 10, cursorY, 'F1', 8, [0.25, 0.45, 0.70]);
        cursorY -= 11;
      }
      cursorY -= 4;
    }
  }

  // --- 6. EDUCATION ---
  if (content.education && content.education.length > 0) {
    drawSectionHeader('Education');
    for (const edu of content.education) {
      const anyEdu = edu as any;
      checkPageBreak(22);
      const degreeStr = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ') || 'Degree';
      const eduEndDate = anyEdu.endDate || edu.graduationDate;
      const eduDates = [edu.startDate, eduEndDate].filter(Boolean).join(' - ');

      drawText(degreeStr, marginX, cursorY, 'F2', 9.5, [0.08, 0.12, 0.20]);
      if (eduDates) {
        const dateX = Math.max(pageWidth - marginX - (eduDates.length * 5.5), marginX + 240);
        drawText(eduDates, dateX, cursorY, 'F1', 8.5, [0.35, 0.40, 0.48]);
      }
      cursorY -= 13;

      const instLoc = [edu.institution, edu.gradeCgpa ? `Grade/CGPA: ${edu.gradeCgpa}` : ''].filter(Boolean).join(' | ');
      if (instLoc) {
        drawText(instLoc, marginX, cursorY, 'F3', 9, [0.25, 0.30, 0.38]);
        cursorY -= 12;
      }
      const coursework = anyEdu.relevantCoursework || edu.coursework;
      if (coursework) {
        const courseLines = wrapWords(`Relevant Coursework: ${coursework}`, 94);
        for (const cl of courseLines) {
          checkPageBreak(11);
          drawText(cl, marginX + 8, cursorY, 'F1', 8.5, [0.30, 0.35, 0.42]);
          cursorY -= 11;
        }
      }
      cursorY -= 3;
    }
  }

  // --- 7. CERTIFICATIONS ---
  if (content.certifications && content.certifications.length > 0) {
    drawSectionHeader('Certifications');
    for (const cert of content.certifications) {
      checkPageBreak(14);
      const certLine = [cert.name, cert.issuingOrganization, cert.issueDate].filter(Boolean).join(' - ');
      drawText(`-  ${certLine}`, marginX + 4, cursorY, 'F1', 9, [0.15, 0.18, 0.24]);
      cursorY -= 13;
    }
  }

  // --- ASSEMBLE PDF OBJECTS ---
  const totalPages = pages.length;
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  let nextObjId = 4;
  for (let i = 0; i < totalPages; i++) {
    pageObjectIds.push(nextObjId++);
    contentObjectIds.push(nextObjId++);
  }

  const objects: { id: number; data: string }[] = [];

  // 1: Catalog
  objects.push({
    id: 1,
    data: `<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>`
  });

  // 2: Pages
  const kidsStr = pageObjectIds.map(id => `${id} 0 R`).join(' ');
  objects.push({
    id: 2,
    data: `<<\n  /Type /Pages\n  /Kids [${kidsStr}]\n  /Count ${totalPages}\n  /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}]\n>>`
  });

  // 3: Resources
  objects.push({
    id: 3,
    data: `<<\n  /Font <<\n    /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\n    /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\n    /F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\n    /F4 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-BoldOblique /Encoding /WinAnsiEncoding >>\n  >>\n>>`
  });

  // Page objects & Content Streams
  for (let i = 0; i < totalPages; i++) {
    const pageId = pageObjectIds[i];
    const contentId = contentObjectIds[i];
    const streamContent = pages[i].operations.join('\n');
    const streamLength = Buffer.byteLength(streamContent, 'utf-8');

    // Page Object
    objects.push({
      id: pageId,
      data: `<<\n  /Type /Page\n  /Parent 2 0 R\n  /Resources 3 0 R\n  /Contents ${contentId} 0 R\n>>`
    });

    // Content Stream Object
    objects.push({
      id: contentId,
      data: `<<\n  /Length ${streamLength}\n>>\nstream\n${streamContent}\nendstream`
    });
  }

  // Sort objects by ID
  objects.sort((a, b) => a.id - b.id);

  // Serialize to PDF byte buffer
  let pdfString = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const xrefOffsets: number[] = [0]; // object 0 offset

  for (const obj of objects) {
    const offset = Buffer.byteLength(pdfString, 'utf-8');
    xrefOffsets.push(offset);
    pdfString += `${obj.id} 0 obj\n${obj.data}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdfString, 'utf-8');
  pdfString += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const off = xrefOffsets[i].toString().padStart(10, '0');
    pdfString += `${off} 00000 n \n`;
  }

  pdfString += `trailer\n<<\n  /Size ${objects.length + 1}\n  /Root 1 0 R\n>>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdfString, 'utf-8');
}
