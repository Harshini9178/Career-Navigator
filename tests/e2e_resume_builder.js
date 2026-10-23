import fs from 'fs';

async function runE2E() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Live E2E Verification for Resume Builder & ATS Studio ---');

  // Helper to extract cookies
  function parseCookies(res) {
    const raw = res.headers.get('set-cookie') || '';
    const parts = raw.split(/,(?=[^;]+=[^;]+)/);
    const map = {};
    for (const p of parts) {
      const match = p.match(/^\s*([^=]+)=([^;]+)/);
      if (match) {
        map[match[1].trim()] = match[2].trim();
      }
    }
    return map;
  }

  function cookieHeader(map) {
    return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  // 1. Get initial session & CSRF
  const initRes = await fetch(baseUrl);
  let cookies = parseCookies(initRes);
  const csrfToken = cookies['csrf-token'] || 'test-csrf';
  console.log(`[1] Initial session ready. CSRF: ${csrfToken.slice(0, 10)}...`);

  // 2. Register Candidate A
  const emailA = `candidate_a_${Date.now()}@careernavigator.app`;
  const regARes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookies),
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      name: 'Candidate Alpha',
      email: emailA,
      password: 'StrongPassword123!',
      role: 'student'
    })
  });
  const regAData = await regARes.json();
  const cookiesA = { ...cookies, ...parseCookies(regARes) };
  console.log(`[2] Candidate A registered: ${regAData.user?.email} (User ID: ${regAData.user?.id})`);

  // 3. Register Candidate B (Attacker / Unrelated user)
  const emailB = `candidate_b_${Date.now()}@careernavigator.app`;
  const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookies),
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      name: 'Candidate Beta',
      email: emailB,
      password: 'StrongPassword123!',
      role: 'student'
    })
  });
  const regBData = await regBRes.json();
  const cookiesB = { ...cookies, ...parseCookies(regBRes) };
  console.log(`[3] Candidate B registered: ${regBData.user?.email} (User ID: ${regBData.user?.id})`);

  // 4. Candidate A creates a new resume
  const createRes = await fetch(`${baseUrl}/api/resumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookiesA),
      'X-CSRF-Token': cookiesA['csrf-token'] || csrfToken
    },
    body: JSON.stringify({
      title: 'Senior Java & React Engineer Resume',
      targetRole: 'Full Stack Engineer',
      templateId: 'software-engineer',
      content: {
        personalInfo: {
          fullName: 'Candidate Alpha',
          headline: 'Full Stack Software Engineer',
          email: emailA,
          phone: '+91 98765 43210',
          cityCountry: 'Bengaluru, India',
          linkedIn: 'https://linkedin.com/in/candidate-alpha',
          github: 'https://github.com/candidate-alpha',
          portfolioWebsite: 'https://alpha.dev'
        },
        summary: 'Experienced Full Stack Engineer with 3+ years architecting scalable enterprise systems with Java Spring Boot and React. Increased transactional throughput by 40%.',
        education: [
          {
            id: 'edu-1',
            institution: 'Indian Institute of Technology',
            degree: 'Bachelor of Technology in Computer Science',
            fieldOfStudy: 'Computer Science',
            startDate: '2020',
            endDate: '2024',
            gradeCgpa: '9.2 CGPA',
            relevantCoursework: 'Data Structures, Distributed Systems, Cloud Architecture'
          }
        ],
        skills: {
          programmingLanguages: ['Java', 'TypeScript', 'SQL', 'Python'],
          frameworks: ['Spring Boot', 'React', 'Node.js', 'Tailwind CSS'],
          databases: ['PostgreSQL', 'Redis'],
          toolsPlatforms: ['Docker', 'Kubernetes', 'AWS', 'Git'],
          coreConcepts: ['Microservices', 'RESTful APIs', 'System Design'],
          communicationLeadership: ['Cross-functional Leadership', 'Agile Scrum']
        },
        experience: [
          {
            id: 'exp-1',
            title: 'Software Development Engineer',
            company: 'NextGen Fintech Labs',
            location: 'Bengaluru, India',
            startDate: 'Jun 2024',
            endDate: 'Present',
            current: true,
            responsibilities: [
              'Architected high-throughput payment settlement microservices handling 2M daily transactions',
              'Developed reactive student assessment dashboard using React, Vite, and Tailwind CSS'
            ],
            achievements: 'Optimized SQL database query latency by 35% through indexing and Redis caching',
            projectImpact: 'Prevented duplicate charges with idempotent distributed locking'
          }
        ],
        projects: [
          {
            id: 'proj-1',
            title: 'Career Navigator Studio',
            description: 'AI-powered placement preparation platform and ATS resume optimizer',
            technologies: ['Spring Boot', 'React', 'PostgreSQL', 'Tailwind CSS'],
            keyContributions: [
              'Designed split-screen resume builder with vector PDF generation and real-time preview'
            ],
            impact: 'Adopted by 5,000+ university students with 94% placement readiness score',
            githubUrl: 'https://github.com/mockgenius/career-navigator'
          }
        ],
        certifications: [
          {
            id: 'cert-1',
            name: 'AWS Certified Solutions Architect',
            issuingOrganization: 'Amazon Web Services',
            issueDate: '2024',
            credentialUrl: 'https://aws.amazon.com'
          }
        ],
        additionalSections: {
          publications: [],
          volunteerExperience: [],
          leadership: ['Tech Community Organizer'],
          languages: ['English (Fluent)', 'Hindi (Native)'],
          interests: ['High-performance computing', 'Open source'],
          customSections: []
        }
      }
    })
  });

  const createData = await createRes.json();
  const createdResume = createData.resume || createData;
  console.log(`[4] POST /api/resumes -> status: ${createRes.status}, id: ${createdResume.id}, title: "${createdResume.title}", score: ${createdResume.atsScore}`);
  if (createRes.status !== 201 && createRes.status !== 200) {
    throw new Error(`Failed to create resume: ${JSON.stringify(createData)}`);
  }
  const resumeId = createdResume.id;

  // 5. Candidate A fetches resume list
  const listRes = await fetch(`${baseUrl}/api/resumes`, {
    headers: { 'Cookie': cookieHeader(cookiesA) }
  });
  const listData = await listRes.json();
  const resumes = listData.resumes || listData;
  console.log(`[5] GET /api/resumes -> status: ${listRes.status}, count: ${resumes.length}`);
  if (!Array.isArray(resumes) || resumes.length !== 1 || resumes[0].id !== resumeId) {
    throw new Error('Resume list mismatch');
  }

  // 6. Candidate A fetches resume by ID
  const getRes = await fetch(`${baseUrl}/api/resumes/${resumeId}`, {
    headers: { 'Cookie': cookieHeader(cookiesA) }
  });
  const getData = await getRes.json();
  const fetchedResume = getData.resume || getData;
  console.log(`[6] GET /api/resumes/${resumeId} -> status: ${getRes.status}, retrieved title: "${fetchedResume.title}"`);
  if (fetchedResume.id !== resumeId || fetchedResume.content?.personalInfo?.fullName !== 'Candidate Alpha') {
    throw new Error('Resume retrieval mismatch');
  }

  // 7. Candidate A updates resume
  fetchedResume.title = 'Updated Senior Full Stack Engineer Resume';
  fetchedResume.content.summary += ' Expert in high-throughput distributed systems.';
  const updateRes = await fetch(`${baseUrl}/api/resumes/${resumeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookiesA),
      'X-CSRF-Token': cookiesA['csrf-token'] || csrfToken
    },
    body: JSON.stringify(fetchedResume)
  });
  const updateData = await updateRes.json();
  const updatedResume = updateData.resume || updateData;
  console.log(`[7] PUT /api/resumes/${resumeId} -> status: ${updateRes.status}, new title: "${updatedResume.title}"`);
  if (updatedResume.title !== 'Updated Senior Full Stack Engineer Resume') {
    throw new Error('Resume update failed');
  }

  // 8. Candidate A runs ATS Check
  const atsRes = await fetch(`${baseUrl}/api/resumes/${resumeId}/ats-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookiesA),
      'X-CSRF-Token': cookiesA['csrf-token'] || csrfToken
    }
  });
  const atsData = await atsRes.json();
  const atsReport = atsData.atsCheck || atsData;
  console.log(`[8] POST /api/resumes/${resumeId}/ats-check -> status: ${atsRes.status}, overallScore: ${atsReport.overallScore}, passedChecks: ${atsReport.passedChecks?.length}, warnings: ${atsReport.warnings?.length}`);
  if (typeof atsReport.overallScore !== 'number' || atsReport.overallScore < 70) {
    throw new Error(`ATS score check failed or unexpectedly low: ${atsReport.overallScore}`);
  }

  // 9. Candidate A matches resume against a Target Job Description
  const jdRes = await fetch(`${baseUrl}/api/resumes/${resumeId}/job-match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookiesA),
      'X-CSRF-Token': cookiesA['csrf-token'] || csrfToken
    },
    body: JSON.stringify({
      targetRole: 'Full Stack Java Engineer',
      jobDescription: 'Looking for a Senior Full Stack Engineer with strong experience in Java, Spring Boot, React, Docker, Kubernetes, and PostgreSQL. Experience with GraphQL and AWS is a plus.'
    })
  });
  const jdData = await jdRes.json();
  const jdReport = jdData.jobMatch || jdData;
  console.log(`[9] POST /api/resumes/${resumeId}/job-match -> status: ${jdRes.status}, matchRate: ${jdReport.matchPercentage}%, matchedKeywords: ${jdReport.matchedKeywords?.join(', ')}, missingKeywords: ${jdReport.missingKeywords?.join(', ')}`);
  if (typeof jdReport.matchPercentage !== 'number' || jdReport.matchedKeywords?.length === 0) {
    throw new Error('Job description matching failed');
  }

  // 10. Candidate A exports resume to PDF
  const pdfRes = await fetch(`${baseUrl}/api/resumes/${resumeId}/export/pdf`, {
    headers: { 'Cookie': cookieHeader(cookiesA) }
  });
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString();
  console.log(`[10] GET /api/resumes/${resumeId}/export/pdf -> status: ${pdfRes.status}, bytes: ${pdfBuffer.byteLength}, header: ${pdfHeader}`);
  if (pdfRes.status !== 200 || !pdfHeader.startsWith('%PDF-') || pdfBuffer.byteLength < 500) {
    throw new Error(`PDF export failed or invalid format: ${pdfHeader}`);
  }

  // 11. Candidate A duplicates resume
  const dupRes = await fetch(`${baseUrl}/api/resumes/${resumeId}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(cookiesA),
      'X-CSRF-Token': cookiesA['csrf-token'] || csrfToken
    }
  });
  const dupData = await dupRes.json();
  const duplicatedResume = dupData.resume || dupData;
  console.log(`[11] POST /api/resumes/${resumeId}/duplicate -> status: ${dupRes.status}, duplicateId: ${duplicatedResume.id}, duplicateTitle: "${duplicatedResume.title}"`);
  if (dupRes.status !== 200 && dupRes.status !== 201) throw new Error('Duplicate failed');
  const duplicateId = duplicatedResume.id;

  // 12. Security Verification: Candidate B attempts to access Candidate A's resume
  const bGetRes = await fetch(`${baseUrl}/api/resumes/${resumeId}`, {
    headers: { 'Cookie': cookieHeader(cookiesB) }
  });
  console.log(`[12] Security Test: Candidate B GET /api/resumes/${resumeId} -> status: ${bGetRes.status}`);
  if (bGetRes.status !== 404 && bGetRes.status !== 403) {
    throw new Error(`SECURITY BREACH: Candidate B could access Candidate A resume! Status: ${bGetRes.status}`);
  }

  // 13. Security Verification: Candidate B attempts to export Candidate A's resume PDF
  const bPdfRes = await fetch(`${baseUrl}/api/resumes/${resumeId}/export/pdf`, {
    headers: { 'Cookie': cookieHeader(cookiesB) }
  });
  console.log(`[13] Security Test: Candidate B GET /api/resumes/${resumeId}/export/pdf -> status: ${bPdfRes.status}`);
  if (bPdfRes.status !== 404 && bPdfRes.status !== 403) {
    throw new Error(`SECURITY BREACH: Candidate B could export Candidate A PDF! Status: ${bPdfRes.status}`);
  }

  // 14. Security Verification: Candidate B attempts to delete Candidate A's resume
  const bDelRes = await fetch(`${baseUrl}/api/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': cookieHeader(cookiesB),
      'X-CSRF-Token': cookiesB['csrf-token'] || csrfToken
    }
  });
  console.log(`[14] Security Test: Candidate B DELETE /api/resumes/${resumeId} -> status: ${bDelRes.status}`);
  if (bDelRes.status !== 404 && bDelRes.status !== 403) {
    throw new Error(`SECURITY BREACH: Candidate B could delete Candidate A resume! Status: ${bDelRes.status}`);
  }

  // 15. Candidate A deletes duplicate resume
  const delRes = await fetch(`${baseUrl}/api/resumes/${duplicateId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': cookieHeader(cookiesA),
      'X-CSRF-Token': cookiesA['csrf-token'] || csrfToken
    }
  });
  const delData = await delRes.json();
  console.log(`[15] Candidate A DELETE duplicate -> status: ${delRes.status}, success: ${delData.success}`);

  // 16. Verify count is back to 1
  const finalListRes = await fetch(`${baseUrl}/api/resumes`, {
    headers: { 'Cookie': cookieHeader(cookiesA) }
  });
  const finalListData = await finalListRes.json();
  const finalResumes = finalListData.resumes || finalListData;
  console.log(`[16] Final resume list for Candidate A -> count: ${finalResumes.length}`);
  if (finalResumes.length !== 1) {
    throw new Error(`Expected 1 resume, found ${finalResumes.length}`);
  }

  console.log('\n============================================================');
  console.log('✅ ALL 16 LIVE E2E RESUME BUILDER TESTS PASSED WITH 100% SUCCESS!');
  console.log('============================================================\n');
}

runE2E().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
