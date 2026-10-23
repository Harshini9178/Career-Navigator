// ponytail: deprecated — replaced by database.ts (SQLite). Kept for reference.
import fs from 'fs';
import path from 'path';
import { User, ResumeAnalysis, MockInterview, ResumeTemplate, StudentFeedback, DashboardMetrics, StoredConversation, ConversationSummary } from '../types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  users: User[];
  resumes: ResumeAnalysis[];
  interviews: MockInterview[];
  templates: ResumeTemplate[];
  feedback: StudentFeedback[];
  conversations?: StoredConversation[];
}

const DEFAULT_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'template-1',
    name: 'Standard ATS Minimalist',
    description: 'A clean, highly parseable single-column format recommended for software engineering and technical roles.',
    downloadCount: 142,
    fileContent: `# [Your Name]
[City, State] | [Phone Number] | [Email] | [LinkedIn URL] | [GitHub URL]

## EDUCATION
**[University Name]** | [Degree, e.g., B.S. in Computer Science]
*Graduation Date: [Month, Year] | GPA: [X.X/4.0 or percentage]*

## TECHNICAL SKILLS
* **Languages:** Java, Python, C++, SQL, TypeScript, JavaScript
* **Frameworks/Libraries:** Spring Boot, React, Node.js, Express, Tailwind CSS
* **Developer Tools:** Git, Docker, AWS, Google Cloud, PostgreSQL, MongoDB

## WORK EXPERIENCE
**[Company Name]** | [Job Title, e.g., Software Engineering Intern]
*[Month, Year] – [Month, Year] | [City, State]*
* Designed and implemented dynamic web interfaces using React and Tailwind CSS, increasing page load performance by 15%.
* Developed microservices with Spring Boot and integrated PostgreSQL database, reducing API latency by 20%.
* Collaborated in an agile team of 5 engineers to deliver critical core features under strict timelines.

## PROJECTS
**[Project Name (e.g., Career Navigator Platform)]** | *React, Express, Tailwind, Gemini API*
*[Month, Year] – [Month, Year]*
* Engineered an AI-driven interview preparation system with real-time feedback and dynamic mock questionnaires.
* Optimized data persistence utilizing structured file arrays, reducing runtime dependencies by 100%.
`
  },
  {
    id: 'template-2',
    name: 'Professional Modern Two-Column',
    description: 'A stylish layout with a sidebar highlighting technical competencies, suited for frontend and full-stack developers.',
    downloadCount: 98,
    fileContent: `# [Your Name] - Full Stack Developer
[Email] • [Phone] • [Website] • [GitHub]

## SUMMARY
Motivated Computer Science graduate with hands-on experience in full-stack application development. Skilled in building resilient, server-side APIs and engaging, interactive browser interfaces.

## KEY PROJECTS
### [Project 1 Name] - *Spring Boot, Angular, PostgreSQL*
* Designed a relational schema for robust transaction tracking with ACID compliance.
* Built microservice endpoints with custom token-based filter authentication.

### [Project 2 Name] - *React, Tailwind CSS, Firebase*
* Constructed a collaborative canvas dashboard utilizing real-time event-driven updates.
`
  },
  {
    id: 'template-3',
    name: 'Executive Tech Lead Format',
    description: 'A comprehensive layout that emphasizes professional experience, projects, and systems architecture skills.',
    downloadCount: 65,
    fileContent: `# [Your Name]
[Contact Details] • [Portfolio Link] • [GitHub]

## PROFESSIONAL EXPERIENCE
**Junior Software Engineer** | [Tech Corp]
*[Month, Year] - Present*
* Spearheaded transition of legacy monolithic endpoints to scalable RESTful services, servicing 10k+ daily queries.
* Maintained CI/CD pipelines to guarantee seamless deployments with zero-downtime rollback controls.
`
  },
  {
    id: 'template-4',
    name: 'Data Science & Machine Learning Specialist',
    description: 'Optimized for ML engineers, data scientists, and quantitative analysts featuring model evaluation and data pipeline metrics.',
    downloadCount: 112,
    fileContent: `# [Your Name] - Data Scientist & ML Engineer
[City, Country] | [Phone] | [Email] | [LinkedIn] | [Kaggle / GitHub]

## SUMMARY
Data Scientist with deep expertise in supervised/unsupervised learning, deep neural architectures, and distributed data pipelines. Proven record of deploying scalable PyTorch and scikit-learn models into high-volume production systems.

## TECHNICAL SKILLS
* **Languages:** Python (NumPy, Pandas, SciPy), SQL, R, C++
* **ML/DL Frameworks:** PyTorch, TensorFlow, Scikit-Learn, Hugging Face, XGBoost
* **Data Engineering & Cloud:** Apache Spark, Kafka, PostgreSQL, Snowflake, AWS SageMaker, Docker

## MACHINE LEARNING PROJECTS
### [Project 1: Real-Time Fraud Detection Engine] | *PyTorch, Kafka, FastAPI*
* Trained a graph neural network on 2.4M transactions, achieving a 94.2% ROC-AUC score and reducing false positives by 28%.
* Containerized real-time inference microservice with Docker and Triton, reducing p99 response latency to 18ms.

### [Project 2: Customer Churn Propensity Model] | *XGBoost, Snowflake, Streamlit*
* Engineered 45 feature signals across user activity logs, identifying high-risk churn cohorts with 89% precision.
* Automated weekly retrain DAGs in Apache Airflow, recovering an estimated $140k in annualized ARR.
`
  },
  {
    id: 'template-5',
    name: 'DevOps & Cloud Platform Infrastructure',
    description: 'Parser-vetted framework emphasizing Kubernetes, Terraform, cloud security, and resilient CI/CD pipelines.',
    downloadCount: 89,
    fileContent: `# [Your Name] - DevOps & Cloud Infrastructure Engineer
[Location] | [Phone] | [Email] | [GitHub] | [LinkedIn]

## SUMMARY
Site Reliability & DevOps Engineer specializing in infrastructure-as-code, multi-region Kubernetes clusters, and zero-downtime deployment pipelines. Passionate about observability, security compliance, and cloud cost governance.

## TECHNICAL PROFICIENCIES
* **Cloud Providers:** AWS (EKS, S3, RDS, IAM, CloudFront), Google Cloud Platform
* **Containers & Orchestration:** Docker, Kubernetes, Helm, Istio Service Mesh
* **IaC & Automation:** Terraform, Ansible, GitHub Actions, ArgoCD, Jenkins
* **Monitoring & Observability:** Prometheus, Grafana, Datadog, ELK Stack

## WORK EXPERIENCE / PLATFORM PROJECTS
### Cloud Migration & GitOps Pipeline | *Terraform, Kubernetes, ArgoCD*
* Architected multi-cluster EKS infrastructure using modular Terraform, standardizing deployments across 3 environments.
* Configured GitOps deployment flow with ArgoCD, eliminating configuration drift and cutting deployment times from 45m to 4m.
* Implemented Prometheus alert rules and Grafana dashboards, maintaining 99.98% platform uptime across peak traffic events.
`
  },
  {
    id: 'template-6',
    name: 'Embedded Systems & Firmware Engineer',
    description: 'Designed for IoT, microcontrollers, real-time operating systems (RTOS), and hardware-software interface engineers.',
    downloadCount: 54,
    fileContent: `# [Your Name] - Embedded Systems & Firmware Engineer
[Location] | [Phone] | [Email] | [LinkedIn] | [Portfolio / GitHub]

## TECHNICAL COMPETENCIES
* **Languages:** C, Modern C++ (C++17), Assembly (ARM Cortex), Python
* **Protocols & Hardware:** UART, SPI, I2C, CAN Bus, BLE, GPIO, Oscilloscopes, Logic Analyzers
* **Platforms & RTOS:** FreeRTOS, STM32, ESP32, Nordic nRF52, Embedded Linux
* **Tools:** Keil uVision, STM32CubeIDE, GCC Toolchain, Git, CMake

## CORE HARDWARE PROJECTS
### Autonomous Telemetry Sensor Node | *STM32, FreeRTOS, LoRaWAN*
* Developed interrupt-driven FreeRTOS firmware in C, reading environmental sensor arrays over SPI/I2C at 100Hz.
* Optimized deep-sleep power states, extending battery operational life from 3 weeks to 14 months on a single LiPo cell.
* Designed modular HAL drivers decoupling peripheral logic from hardware registers, facilitating multi-MCU portability.
`
  },
  {
    id: 'template-7',
    name: 'Cybersecurity & Systems Defense Analyst',
    description: 'Targeted for security analysts, penetration testers, and SOC engineers highlighting vulnerability management and compliance.',
    downloadCount: 73,
    fileContent: `# [Your Name] - Cybersecurity & SOC Analyst
[Location] | [Phone] | [Email] | [LinkedIn] | [TryHackMe / Security Profile]

## PROFESSIONAL SUMMARY
Cybersecurity professional with practical experience in threat detection, vulnerability assessment, and security automation. Dedicated to strengthening organizational defense posture and rapid incident containment.

## TECHNICAL DOMAINS
* **Security Tools:** Wireshark, Nmap, Burp Suite, Metasploit, Nessus, Splunk, Suricata
* **Standards & Frameworks:** MITRE ATT&CK, NIST CSF, OWASP Top 10, ISO 27001
* **Scripting & OS:** Python, Bash, PowerShell, Linux/Unix Security, Active Directory

## SECURITY AUDITS & PROJECTS
### Corporate SIEM Pipeline & Alert Triaging | *Splunk, Suricata, Python*
* Configured correlation rules in Splunk SIEM mapping alerts to MITRE ATT&CK tactics, triaging 500+ daily telemetry events.
* Created automated Python scripts to enrich threat intelligence feeds against VirusTotal and AbuseIPDB, cutting MTTR by 40%.
* Conducted black-box web vulnerability scans against staging applications, uncovering and remediating 4 critical OWASP flaws.
`
  },
  {
    id: 'template-8',
    name: 'Mobile Applications Engineer (iOS & Android)',
    description: 'Tailored for cross-platform and native mobile app developers showcasing app architecture, state management, and offline cache.',
    downloadCount: 81,
    fileContent: `# [Your Name] - Mobile Software Engineer
[Location] | [Phone] | [Email] | [App Store / Play Store Links] | [GitHub]

## SUMMARY
Mobile developer with proven experience shipping fluid, battery-efficient iOS and Android applications. Focused on reactive architectures, native module bridging, and offline-first data synchronization.

## SKILLS & FRAMEWORKS
* **Frameworks & Languages:** React Native, Flutter, Swift, Kotlin, TypeScript, Dart
* **State & Data:** Redux Toolkit, Zustand, Riverpod, SQLite, Realm, GraphQL, Firebase
* **Build & Release:** Xcode, Android Studio, Fastlane, TestFlight, Google Play Console

## MOBILE APPLICATIONS SHIPPED
### [App Name: Health & Fitness Companion] | *Flutter, Riverpod, SQLite*
* Built cross-platform mobile application supporting local step tracking and cloud sync across 45,000+ registered active users.
* Implemented background sync service minimizing battery footprint while guaranteeing 99.9% offline-data consistency.
* Streamlined CI/CD deployment pipelines using Fastlane, cutting binary release turnaround to under 15 minutes.
`
  }
];

function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData: Schema = {
      users: [
        {
          id: 'admin-1',
          email: 'admin@careernavigator.app',
          name: 'Super Admin',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          role: 'admin',
          completedProfile: true
        },
        {
          id: 'demo-student-1',
          email: 'student@careernavigator.app',
          name: 'Jane Doe',
          picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
          role: 'student',
          branch: 'Computer Science',
          skills: ['React', 'JavaScript', 'SQL', 'TypeScript'],
          projects: ['Portfolio Website', 'Weather App'],
          targetRole: 'Full Stack Engineer',
          experienceLevel: 'Entry Level',
          completedProfile: true
        }
      ],
      resumes: [
        {
          id: 'res-1',
          userId: 'demo-student-1',
          fileName: 'Jane_Doe_CS_Resume.pdf',
          uploadedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          atsScore: 78,
          skills: ['React', 'JavaScript', 'SQL', 'TypeScript', 'Node.js', 'HTML/CSS'],
          missingSections: ['Certifications', 'Summary Statement'],
          suggestions: [
            'Add a brief Summary section at the top of your resume highlighting your core accomplishments.',
            'Include relevant academic/industry certifications to strengthen your profile.',
            'Use more impact-driven bullet points starting with action verbs (e.g., "Led", "Optimized", "Engineered").'
          ],
          grammarIssues: ['Found inconsistent capitalization in job titles ("Full-stack" vs "Full Stack").'],
          keywords: [
            { keyword: 'React', match: true },
            { keyword: 'Node.js', match: false },
            { keyword: 'Docker', match: false },
            { keyword: 'RESTful APIs', match: true },
            { keyword: 'PostgreSQL', match: false }
          ],
          improvementsToAdd: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
          improvementsToRemove: ['Irrelevant hobbies', 'High school GPA (if college senior)']
        }
      ],
      interviews: [
        {
          id: 'int-1',
          userId: 'demo-student-1',
          jobRole: 'Full Stack Engineer',
          branch: 'Computer Science',
          skills: ['React', 'TypeScript', 'SQL'],
          experienceLevel: 'Entry Level',
          status: 'completed',
          questions: [
            'Explain the virtual DOM and how React renders changes.',
            'What is the difference between SQL and NoSQL databases?',
            'Tell me about a challenging technical project you worked on.'
          ],
          currentQuestionIndex: 3,
          answers: [
            {
              question: 'Explain the virtual DOM and how React renders changes.',
              answer: 'React creates an in-memory lightweight representation of the real DOM. When state updates, React builds a new virtual DOM tree, compares it with the previous one (diffing), and calculates the minimal updates to apply to the real DOM (reconciliation).',
              evaluation: {
                score: 9,
                feedback: 'Excellent answer. You correctly covered both the diffing process and reconciliation.',
                technicalScore: 9,
                communicationScore: 9,
                confidenceScore: 8,
                grammar: 'Perfect.',
                clarity: 'Highly clear.'
              }
            },
            {
              question: 'What is the difference between SQL and NoSQL databases?',
              answer: 'SQL databases are relational, table-based, with fixed schemas and support ACID compliance. NoSQL are non-relational, document or key-value based, with dynamic schemas, designed for horizontal scalability.',
              evaluation: {
                score: 8,
                feedback: 'Solid explanation of SQL vs NoSQL, clearly stating schemas and scalability models.',
                technicalScore: 8,
                communicationScore: 8,
                confidenceScore: 8,
                grammar: 'Excellent.',
                clarity: 'Clear.'
              }
            },
            {
              question: 'Tell me about a challenging technical project you worked on.',
              answer: 'I worked on a portfolio project where I had to sync state across views. It was challenging because I had prop drilling, so I implemented React Context to solve the complex prop propagation.',
              evaluation: {
                score: 7,
                feedback: 'Good description of React Context. Try using the STAR method (Situation, Task, Action, Result) to format your story more impactfully next time.',
                technicalScore: 7,
                communicationScore: 8,
                confidenceScore: 7,
                grammar: 'Minor phrasing issues.',
                clarity: 'Understandable.'
              }
            }
          ],
          overallScore: 80,
          technicalScore: 80,
          communicationScore: 83,
          confidenceScore: 77,
          feedbackText: 'Great overall performance Jane! Your React and database theory is very strong. Continue working on structuring your behavioral/project-based answers using action-oriented frameworks like STAR.',
          suggestions: [
            'Use the STAR framework for project-based questions.',
            'Add more concrete metrics when explaining what you built (e.g., "achieved 15% improvement").',
            'Slightly slow down your speaking pace to sound more composed and confident.'
          ],
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ],
      templates: DEFAULT_TEMPLATES,
      feedback: [
        {
          id: 'feed-1',
          userId: 'demo-student-1',
          userName: 'Jane Doe',
          category: 'interview',
          rating: 5,
          comment: 'The AI feedback after my mock interview was incredibly detailed! It felt like talking to a real technical interviewer.',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Make sure it runs
initDb();

function readDb(): Schema {
  try {
    initDb();
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed.templates || !Array.isArray(parsed.templates) || parsed.templates.length === 0) {
      parsed.templates = [...DEFAULT_TEMPLATES];
    }
    parsed.users = Array.isArray(parsed.users) ? parsed.users : [];
    if (!parsed.users.some((u: any) => u.id === 'admin-1')) {
      parsed.users.unshift({
        id: 'admin-1',
        email: 'admin@careernavigator.app',
        name: 'Super Admin',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        role: 'admin',
        completedProfile: true
      });
    }
    if (!parsed.users.some((u: any) => u.id === 'demo-student-1')) {
      parsed.users.push({
        id: 'demo-student-1',
        email: 'student@careernavigator.app',
        name: 'Jane Doe',
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        role: 'student',
        branch: 'Computer Science',
        skills: ['React', 'JavaScript', 'SQL', 'TypeScript'],
        projects: ['Portfolio Website', 'Weather App'],
        targetRole: 'Full Stack Engineer',
        experienceLevel: 'Entry Level',
        completedProfile: true
      });
    }
    parsed.conversations = Array.isArray(parsed.conversations) ? parsed.conversations : [];
    return parsed;
  } catch (err) {
    console.error('Error reading JSON DB, reinitializing:', err);
    return { users: [], resumes: [], interviews: [], templates: [...DEFAULT_TEMPLATES], feedback: [], conversations: [] };
  }
}

function writeDb(data: Schema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON DB:', err);
  }
}

export const jsonDb = {
  // --- USERS ---
  getUsers: (): User[] => readDb().users,
  getUserById: (id: string): User | undefined => {
    return readDb().users.find((u) => u.id === id);
  },
  getUserByEmail: (email: string): User | undefined => {
    if (!email || typeof email !== 'string') return undefined;
    const clean = email.trim().toLowerCase();
    return readDb().users.find((u) => u.email && u.email.trim().toLowerCase() === clean);
  },
  saveUser: (user: User): User => {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      db.users.push(user);
    }
    writeDb(db);
    return user;
  },
  updateUserProfile: (id: string, updates: Partial<User>): User | undefined => {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...updates, completedProfile: true };
      writeDb(db);
      return db.users[idx];
    }
    return undefined;
  },
  updateUserPassword: (id: string, passwordHash: string): boolean => {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      db.users[idx].passwordHash = passwordHash;
      delete db.users[idx].password;
      writeDb(db);
      return true;
    }
    return false;
  },

  // --- RESUMES ---
  getResumes: (): ResumeAnalysis[] => readDb().resumes,
  getResumeByUserId: (userId: string): ResumeAnalysis | undefined => {
    return readDb().resumes.find((r) => r.userId === userId);
  },
  saveResume: (resume: ResumeAnalysis): ResumeAnalysis => {
    const db = readDb();
    const idx = db.resumes.findIndex((r) => r.userId === resume.userId);
    if (idx >= 0) {
      db.resumes[idx] = resume;
    } else {
      db.resumes.push(resume);
    }
    writeDb(db);
    return resume;
  },

  // --- INTERVIEWS ---
  getInterviews: (): MockInterview[] => readDb().interviews,
  getInterviewsByUserId: (userId: string): MockInterview[] => {
    return readDb().interviews
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getInterviewById: (id: string): MockInterview | undefined => {
    return readDb().interviews.find((i) => i.id === id);
  },
  saveInterview: (interview: MockInterview): MockInterview => {
    const db = readDb();
    const idx = db.interviews.findIndex((i) => i.id === interview.id);
    if (idx >= 0) {
      db.interviews[idx] = interview;
    } else {
      db.interviews.push(interview);
    }
    writeDb(db);
    return interview;
  },

  // --- TEMPLATES ---
  getTemplates: (): ResumeTemplate[] => readDb().templates,
  incrementTemplateDownload: (id: string): void => {
    const db = readDb();
    const t = db.templates.find((x) => x.id === id);
    if (t) {
      t.downloadCount += 1;
      writeDb(db);
    }
  },
  addTemplate: (template: ResumeTemplate): ResumeTemplate => {
    const db = readDb();
    if (!db.templates) db.templates = [];
    const idx = db.templates.findIndex((x) => x.id === template.id);
    if (idx >= 0) {
      db.templates[idx] = template;
    } else {
      db.templates.push(template);
    }
    writeDb(db);
    return template;
  },
  updateTemplate: (id: string, updates: Partial<ResumeTemplate>): ResumeTemplate | undefined => {
    const db = readDb();
    const idx = db.templates.findIndex((t) => t.id === id);
    if (idx >= 0) {
      db.templates[idx] = { ...db.templates[idx], ...updates };
      writeDb(db);
      return db.templates[idx];
    }
    return undefined;
  },
  deleteTemplate: (id: string): boolean => {
    const db = readDb();
    const idx = db.templates.findIndex((t) => t.id === id);
    if (idx >= 0) {
      db.templates.splice(idx, 1);
      writeDb(db);
      return true;
    }
    return false;
  },

  // --- FEEDBACK ---
  getFeedbacks: (): StudentFeedback[] => readDb().feedback,
  addFeedback: (feedback: StudentFeedback): StudentFeedback => {
    const db = readDb();
    db.feedback.push(feedback);
    writeDb(db);
    return feedback;
  },

  // --- METRICS ---
  getDashboardMetrics: (): DashboardMetrics => {
    const db = readDb();
    const students = db.users.filter((u) => u.role === 'student');
    const completedInterviews = db.interviews.filter((i) => i.status === 'completed');

    // Calculate averages
    const totalATS = db.resumes.reduce((sum, r) => sum + r.atsScore, 0);
    const avgATS = db.resumes.length ? Math.round(totalATS / db.resumes.length) : 0;

    const totalInterviewScores = completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0);
    const avgInterview = completedInterviews.length ? Math.round(totalInterviewScores / completedInterviews.length) : 0;

    // Branches distribution
    const branchCounts: { [key: string]: number } = {};
    students.forEach((s) => {
      if (s.branch) {
        branchCounts[s.branch] = (branchCounts[s.branch] || 0) + 1;
      }
    });
    const branchDistribution = Object.entries(branchCounts).map(([branch, count]) => ({
      branch,
      count
    }));

    // Dynamic weekly interviews chart based on real data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCountMap: { [key: string]: number } = {};
    dayNames.forEach(d => { dayCountMap[d] = 0; });

    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    completedInterviews.forEach((i) => {
      const d = new Date(i.createdAt);
      if (d.getTime() >= oneWeekAgo) {
        const dayName = dayNames[d.getDay()];
        dayCountMap[dayName] += 1;
      }
    });

    const weeklyInterviews = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => ({
      name,
      count: dayCountMap[name] || 0
    }));

    // Recent Activity
    const activities: any[] = [];
    db.resumes.slice(-5).forEach((r) => {
      const u = db.users.find((user) => user.id === r.userId);
      activities.push({
        id: `act-res-${r.id}`,
        type: 'resume_upload',
        userName: u ? u.name : 'Unknown Student',
        detail: `Uploaded and evaluated resume (${r.fileName}) - ATS Score: ${r.atsScore}%`,
        timestamp: r.uploadedAt
      });
    });

    completedInterviews.slice(-5).forEach((i) => {
      const u = db.users.find((user) => user.id === i.userId);
      activities.push({
        id: `act-int-${i.id}`,
        type: 'interview_completed',
        userName: u ? u.name : 'Unknown Student',
        detail: `Completed mock interview for ${i.jobRole} - Score: ${i.overallScore}%`,
        timestamp: i.createdAt
      });
    });

    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      totalStudents: students.length,
      totalInterviews: completedInterviews.length,
      avgATSScore: avgATS,
      avgInterviewScore: avgInterview,
      recentActivity,
      branchDistribution,
      weeklyInterviews
    };
  },

  // --- CHAT CONVERSATIONS ---
  getConversationsByUserId: (userId: string): ConversationSummary[] => {
    const list = readDb().conversations || [];
    return list
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .map((c) => {
        const msgs = Array.isArray(c.messages) ? c.messages : [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        return {
          id: c.id,
          title: c.title || 'Conversation',
          messageCount: msgs.length,
          learningMode: c.learningMode,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt || c.createdAt,
          lastMessageSnippet: lastMsg?.content ? (lastMsg.content.slice(0, 100) + (lastMsg.content.length > 100 ? '...' : '')) : undefined
        };
      });
  },

  getConversationById: (id: string, userId: string): StoredConversation | undefined => {
    const list = readDb().conversations || [];
    return list.find((c) => c.id === id && c.userId === userId);
  },

  saveConversation: (conversation: StoredConversation): StoredConversation => {
    const db = readDb();
    if (!Array.isArray(db.conversations)) {
      db.conversations = [];
    }
    const idx = db.conversations.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      db.conversations[idx] = { ...db.conversations[idx], ...conversation };
    } else {
      db.conversations.push(conversation);
    }
    writeDb(db);
    return conversation;
  },

  deleteConversation: (id: string, userId: string): boolean => {
    const db = readDb();
    if (!Array.isArray(db.conversations)) return false;
    const initialLen = db.conversations.length;
    db.conversations = db.conversations.filter((c) => !(c.id === id && c.userId === userId));
    if (db.conversations.length !== initialLen) {
      writeDb(db);
      return true;
    }
    return false;
  },

  clearConversationsByUserId: (userId: string): boolean => {
    const db = readDb();
    if (!Array.isArray(db.conversations)) return false;
    db.conversations = db.conversations.filter((c) => c.userId !== userId);
    writeDb(db);
    return true;
  }
};
