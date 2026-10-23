import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage.js';
import Sidebar from './components/Sidebar.js';
import Navbar from './components/Navbar.js';
import StudentDashboard from './pages/StudentDashboard.js';
import SignInPage from './pages/SignInPage.js';
import { User } from './types.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

// Lazy-loaded pages for optimal performance and chunk-splitting
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer.js'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep.js'));
const MockInterview = lazy(() => import('./pages/MockInterview.js'));
const Templates = lazy(() => import('./pages/Templates.js'));
const ProfileManagement = lazy(() => import('./pages/ProfileManagement.js'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm.js'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.js'));
const AptitudeAssessment = lazy(() => import('./pages/AptitudeAssessment.js'));

function ViewFallback() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)] p-8">
      <div className="w-full max-w-md p-6 glass-card rounded-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
            <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-32 shimmer-box rounded" />
            <div className="h-2 w-20 shimmer-box rounded" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-10 w-full shimmer-box rounded-xl" />
          <div className="h-24 w-full shimmer-box rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function MainWorkspace() {
  const { user, isLoading, logout, refreshUser } = useAuth();
  const [unauthView, setUnauthView] = useState<'landing' | 'signin'>('landing');
  const [signInMode, setSignInMode] = useState<'signin' | 'register'>('signin');
  const [targetViewAfterAuth, setTargetViewAfterAuth] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>('student-dashboard');
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);

  const prevUserRef = useRef<User | null>(null);

  // Sync view only when user initially logs in (respecting target view if clicked from landing page)
  useEffect(() => {
    const wasUnauthenticated = !prevUserRef.current && !!user;
    prevUserRef.current = user;

    if (wasUnauthenticated && user) {
      if (targetViewAfterAuth) {
        setCurrentView(targetViewAfterAuth);
        setTargetViewAfterAuth(null);
      } else if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('student-dashboard');
      }
    }
  }, [user, targetViewAfterAuth]);

  const handleNavigate = (view: string, targetId?: string) => {
    if (view === 'mock-interview' && targetId) {
      setActiveInterviewId(targetId);
    }
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await logout();
    setUnauthView('landing');
    setTargetViewAfterAuth(null);
    setCurrentView('student-dashboard');
    setActiveInterviewId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#070B14] text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Restoring Authenticated Session...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated user flow: toggle between Landing Page and dedicated responsive SignIn Page
  if (!user) {
    if (unauthView === 'signin') {
      return (
        <SignInPage
          onBackToHome={() => setUnauthView('landing')}
          initialMode={signInMode}
          targetDestinationName={
            targetViewAfterAuth === 'resume-analyzer'
              ? 'ATS Resume Optimizer'
              : targetViewAfterAuth === 'interview-prep'
              ? 'Mock Interview Studio'
              : targetViewAfterAuth === 'aptitude' || targetViewAfterAuth === 'code-sandbox'
              ? 'Aptitude Assessment Center'
              : targetViewAfterAuth === 'templates'
              ? 'Resume Templates'
              : undefined
          }
        />
      );
    }
    return (
      <LandingPage
        onLoginSuccess={() => refreshUser()}
        onNavigateToSignIn={(mode = 'signin', targetView) => {
          setSignInMode(mode);
          if (targetView) setTargetViewAfterAuth(targetView);
          setUnauthView('signin');
        }}
        currentUser={user}
        onNavigateToDashboard={() => setUnauthView('landing')}
      />
    );
  }

  // Determine current page view to render
  const renderView = () => {
    switch (currentView) {
      // Student Views
      case 'student-dashboard':
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
      case 'resume-analyzer':
        return <ResumeAnalyzer />;
      case 'interview-prep':
        return <InterviewPrep user={user} onNavigate={handleNavigate} />;
      case 'mock-interview':
        return activeInterviewId ? (
          <MockInterview interviewId={activeInterviewId} onNavigate={handleNavigate} />
        ) : (
          <InterviewPrep user={user} onNavigate={handleNavigate} />
        );
      case 'templates':
        return <Templates />;
      case 'aptitude':
      case 'code-sandbox':
        return <AptitudeAssessment user={user} onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileManagement user={user} onProfileUpdate={() => refreshUser()} />;
      case 'feedback':
        return <FeedbackForm />;

      // Admin Views
      case 'admin-dashboard':
      case 'admin-students':
      case 'admin-feedbacks':
        return <AdminDashboard />;

      default:
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  // Human-readable titles for navigation
  const getViewTitle = () => {
    switch (currentView) {
      case 'student-dashboard':
        return 'Placement Readiness Hub';
      case 'resume-analyzer':
        return 'ATS Keywords Optimizer';
      case 'interview-prep':
        return 'Mock Assessment Gate';
      case 'mock-interview':
        return 'AI Interview Assessor';
      case 'aptitude':
      case 'code-sandbox':
        return 'Aptitude Assessment Center';
      case 'templates':
        return 'ATS-vetted Resume Frameworks';
      case 'profile':
        return 'Placement Settings';
      case 'feedback':
        return 'Share Experience';
      case 'admin-dashboard':
        return 'Analytics & Placements Summary';
      case 'admin-students':
        return 'Enrolled Candidates Directory';
      case 'admin-feedbacks':
        return 'Student Feedback Audits';
      default:
        return 'Career Navigator Portal';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex">
      {/* a11y: Skip to main content link for keyboard and screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-md focus:shadow-xl focus:ring-2 focus:ring-[var(--primary-hover)] focus:outline-none text-xs font-bold transition-all"
      >
        Skip to main content
      </a>

      {/* Persistent Left Sidebar Navigation with integrated SignOutModal */}
      <Sidebar
        user={user}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main Content Layout Right Panel – responsive: no left padding on mobile */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <Navbar user={user} title={getViewTitle()} onLogout={handleLogout} />
        
        <main id="main-content" tabIndex={-1} className="flex-1 bg-[var(--bg-base)] overflow-y-auto focus:outline-none">
          <ErrorBoundary fallbackTitle={`Error loading ${getViewTitle()}`}>
            <Suspense fallback={<ViewFallback />}>
              {renderView()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainWorkspace />
    </AuthProvider>
  );
}
