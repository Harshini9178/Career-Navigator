# Career Navigator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-career--navigator--1.onrender.com-success?style=for-the-badge&logo=render)](https://career-navigator-1.onrender.com)
[![CI Pipeline](https://github.com/Harshini9178/Career-Navigator/actions/workflows/ci.yml/badge.svg)](https://github.com/Harshini9178/Career-Navigator/actions)
![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![JUnit 5](https://img.shields.io/badge/JUnit%205-Tests%20Passing-emerald.svg)
![Vitest](https://img.shields.io/badge/Vitest-Tests%20Passing-emerald.svg)
![Security](https://img.shields.io/badge/Security-Spring%20Security%20Hardened-green.svg)

> **Enterprise-Grade AI Placement & Career Platform** — Practice technical and behavioral interviews with real-time speech analytics & SSE feedback, Monaco Code Lab algorithmic reviews, ATS resume scoring with Job Description matching, and automated STAR-method resume tailoring.

---

## 🌐 Live Production Links

* 🚀 **Live Web Application:** [https://career-navigator-1.onrender.com](https://career-navigator-1.onrender.com)
* ⚙️ **Render Service Dashboard:** [Career-Navigator-1 on Render](https://dashboard.render.com/web/srv-dbsf4f7e1egvs73cqaa7kg)
* 📦 **GitHub Repository:** [https://github.com/Harshini9178/Career-Navigator](https://github.com/Harshini9178/Career-Navigator)

---

## ✨ Key Capabilities & Highlights

* **Automated Job-Specific Resume Tailoring (STAR Method):** Paste any corporate Job Description (JD); the AI analyzes keyword gaps and provides 1-click bullet point rewrites following the **STAR formula** (*Situation, Task, Action, Result*) with quantifiable metrics (e.g. *"Optimized SQL queries, reducing API latency by 42%"*) to beat Workday, Greenhouse, Taleo, and Lever ATS filters.
* **ATS Keywords Optimizer & Resume Analyzer:** 6-factor deterministic scoring rubric analyzing section completeness, technical depth, formatting, and term density with instant PDF/Word extraction.
* **LaTeX-Grade Resume Builder Studio:** Multi-step wizard generating clean, ATS-compliant single-column PDF resumes with real-time score preview and direct STAR accomplishment injection.
* **AI Mock Interview Studio:** Speech-to-text audio recording, real-time WPM, filler word detection (`um`, `like`), and 5-dimension rubric scoring (Accuracy, Relevance, Logic, Communication, Delivery) via Google Gemini.
* **Aptitude & Technical Assessment Center:** Timed examinations across Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Core CS with proctoring / anti-cheat tab-switch detection.
* **AI Career Assistant & Mentor:** Conversational AI offering personalized preparation roadmaps, algorithm design walkthroughs, and behavioral interview roleplays.
* **Admin / Placement Officer Portal:** Departmental cohort analytics, student readiness percentiles, interview scorecards, and batch candidate exports.

---

## 🚀 Architecture Overview

Career Navigator is designed as a production-grade, maintainable full-stack application:

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite.
- **Backend:** Java 21 LTS, Spring Boot 3.4.3, Maven.
- **Security:** Spring Security with BCrypt password hashing, HMAC-SHA256 HttpOnly session cookies, CSRF protection, and sliding-window rate limiting.
- **Document Processing:** Apache PDFBox (3.0.x) for PDF parsing, Apache POI (5.4.x) for DOCX extraction, scanned PDF detection, and evidence-based ATS scoring.
- **Persistence:** Spring Data JPA with embedded high-performance H2 database and automatic two-way synchronization with `data/db.json` to guarantee zero data loss.
- **AI Integration:** Google Gemini Generative AI REST API with intelligent offline simulation fallback.

---

## 🛠️ Folder Structure

```
Career-Navigator/
├── backend/                             # Java Spring Boot Production Backend
│   ├── pom.xml                          # Maven build configuration
│   └── src/
│       ├── main/java/com/careernavigator/
│       │   ├── CareerNavigatorApplication.java  # Main Application Entrypoint
│       │   ├── config/                  # SecurityConfig, WebConfig (CORS/CSRF)
│       │   ├── controller/              # Auth, Resume, Interview, Admin, Feedback, Health
│       │   ├── dto/                     # Typed Request & Response DTOs
│       │   ├── entity/                  # JPA Entities (User, Resume, Interview, Template, Feedback)
│       │   ├── exception/               # GlobalExceptionHandler, ApiException
│       │   ├── repository/              # Spring Data JPA Repositories
│       │   ├── security/                # CustomPasswordEncoder, SessionAuthFilter, CsrfFilter
│       │   ├── service/                 # AuthService, ResumeService, AtsScoringService, GeminiService
│       │   └── util/                    # TextNormalizer, KeywordCatalog
│       └── test/java/com/careernavigator/ # JUnit 5 & Spring Boot Test Suite (21 tests)
├── src/                                 # React + TypeScript Frontend
│   ├── components/                      # UI components (Navbar, Sidebar, etc.)
│   ├── lib/api.ts                       # Centralized API Client
│   └── pages/                           # Application views
├── data/db.json                         # Preserved Application Database
├── package.json                         # Unified build & development scripts
└── vite.config.ts                       # Vite development server and API proxy
```

---

## 📦 Getting Started

### Prerequisites

- **Java JDK:** OpenJDK 21 LTS or later (`java -version`)
- **Maven:** Apache Maven 3.9+ (`mvn -version`)
- **Node.js:** Node.js v20+ and npm (`node -v`)

### Quick Start (Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Harshini9178/Career-Navigator.git
   cd Career-Navigator
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the Java Spring Boot backend (Port 8080):**
   ```bash
   npm run backend
   # Or manually:
   # cd backend && mvn spring-boot:run
   ```

4. **Start the Vite frontend development server (Port 3000):**
   ```bash
   npm run frontend
   # Or:
   # npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Automated Testing

### Java Backend (JUnit 5 & Spring Boot Test)
The backend includes 21 comprehensive test cases covering authentication, duplicate registration rejection, session persistence, role guards, PDFBox/POI document extraction, keyword boundary matching (`Java` vs `JavaScript`, `Go` vs `Google Cloud`), ATS scoring, and end-to-end integration:

```bash
npm run backend:test
# Or:
# cd backend && mvn test
```

### Frontend Test Suite (Vitest)
```bash
npm test
```

### Full Verification & Build
```bash
# Production Maven JAR build
npm run backend:build

# Production frontend bundle
npm run build
```

---

## 🛡️ Security Architecture

1. **Authentication & Password Storage:** Passwords hashed with BCrypt. Zero plaintext password storage.
2. **Session Management:** Cryptographically signed HMAC-SHA256 session tokens stored in secure, HttpOnly cookies (`SameSite=Lax`).
3. **Cross-Site Request Forgery (CSRF):** Auto-issued CSRF token cookies with header validation on state-changing API endpoints.
4. **Rate Limiting:** Sliding-window rate limiter protecting authentication endpoints against credential stuffing and AI endpoints against abuse.
5. **Role-Based Authorization:** Candidate student vs Administrator role guards enforced at the Spring Security filter chain level.

---

## ☁️ Cloud Deployment (Render & Docker)

The repository is pre-configured for continuous integration and automated deployment on **Render**:

1. **Deployment Architecture:** Multi-stage Docker container (`Dockerfile`) compiling React 19 frontend assets via Vite and bundling the Express server via `esbuild` into a lightweight, high-performance Node 20 production runtime.
2. **Environment Variables Required:**
   | Variable | Description | Example / Default |
   |---|---|---|
   | `PORT` | Listening server port | `3000` |
   | `NODE_ENV` | Production execution mode | `production` |
   | `JWT_SECRET` | Secret key for signed JWT tokens | `your_secure_jwt_secret` |
   | `GEMINI_API_KEY` | Google Gemini AI API Key | `AIzaSy...` |
   | `GEMINI_MODEL` | Effective Gemini model | `gemini-3.5-flash-lite` |
   | `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID | `...apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `GOCSPX-...` |
   | `APP_URL` | Canonical public application URL | `https://career-navigator-1.onrender.com` |

3. **Auto-Deployment:** Any push to the `main` branch automatically triggers a fresh build and zero-downtime deployment on Render at [https://career-navigator-1.onrender.com](https://career-navigator-1.onrender.com).

---

## 📄 License
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
