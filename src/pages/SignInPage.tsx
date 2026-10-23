import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Smartphone,
  KeyRound,
  RotateCcw,
  Check,
  Compass,
  FileText,
  Video,
  Code
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { sound } from '../lib/sound.js';

interface SignInPageProps {
  onBackToHome?: () => void;
  initialMode?: 'signin' | 'register' | 'mobile_otp' | 'forgot_password';
  targetDestinationName?: string;
}

export default function SignInPage({
  onBackToHome,
  initialMode = 'signin',
  targetDestinationName
}: SignInPageProps) {
  const {
    login,
    register,
    sendOtp,
    verifyOtp,
    demoLogin,
    forgotPassword,
    resetPassword,
    authError,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'mobile_otp' | 'forgot_password'>(initialMode);

  // Credentials State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password / Reset State
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'submit'>('request');
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Mobile OTP State
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpDevNotice, setOtpDevNotice] = useState<string | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const switchMode = (newMode: 'signin' | 'register' | 'mobile_otp' | 'forgot_password') => {
    sound.playClick(1000);
    clearError();
    setValidationError(null);
    setSuccessNotice(null);
    setResetNotice(null);
    setMode(newMode);
  };

  // Validation Helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Email Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    clearError();
    setValidationError(null);
    setSuccessNotice(null);

    if (!email.trim()) {
      setValidationError('Please enter your email address.');
      sound.playClick(400);
      return;
    }
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address.');
      sound.playClick(400);
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      sound.playClick(400);
      return;
    }

    setIsSubmitting(true);
    sound.playClick(1100);

    try {
      await login(email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    clearError();
    setValidationError(null);
    setSuccessNotice(null);

    if (!name.trim()) {
      setValidationError('Please enter your full name.');
      sound.playClick(400);
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setValidationError('Please enter a valid email address.');
      sound.playClick(400);
      return;
    }
    if (!password || password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      sound.playClick(400);
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setValidationError('Password must contain both letters and numbers.');
      sound.playClick(400);
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please verify both fields.');
      sound.playClick(400);
      return;
    }

    setIsSubmitting(true);
    sound.playClick(1100);

    try {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanDigits.length >= 10 ? `${countryCode} ${cleanDigits}` : undefined;
      const success = await register(name.trim(), email.trim(), password, role, fullPhone);
      if (success) {
        setSuccessNotice('Account created successfully! Welcome to Career Navigator.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password Request Handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email.trim() || !isValidEmail(email)) {
      setValidationError('Please enter a valid email address.');
      sound.playClick(400);
      return;
    }

    setIsSubmitting(true);
    sound.playClick(1000);

    try {
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setResetNotice(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
          setResetStep('submit');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password Execution Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!resetToken.trim()) {
      setValidationError('Please provide the reset token.');
      sound.playClick(400);
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters long.');
      sound.playClick(400);
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setValidationError('New password must contain both letters and numbers.');
      sound.playClick(400);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setValidationError('Passwords do not match.');
      sound.playClick(400);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(resetToken.trim(), newPassword);
      if (res.success) {
        setSuccessNotice('Password successfully updated! You may now sign in.');
        setMode('signin');
        setPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile OTP Send Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);
    setSuccessNotice(null);

    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      sound.playClick(400);
      return;
    }

    const fullNumber = `${countryCode} ${cleanDigits}`;
    setIsSubmitting(true);
    sound.playClick(900);

    try {
      const res = await sendOtp(fullNumber);
      if (res.success) {
        setOtpStep('verify');
        setOtpCountdown(60);
        if (res.otp) {
          setServerOtp(res.otp);
          setOtpDevNotice('SMS Gateway unconfigured. Development testing verification code provided below.');
        }
        setSuccessNotice(`Verification code sent to ${fullNumber}`);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile OTP Input Management
  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (digit && index === 5 && updated.every((d) => d !== '')) {
      const fullOtp = updated.join('');
      executeVerifyOtp(fullOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const executeVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setValidationError('Please enter the complete 6-digit code.');
      sound.playClick(400);
      return;
    }

    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const fullNumber = `${countryCode} ${cleanDigits}`;

    setIsSubmitting(true);
    sound.playClick(1000);

    try {
      await verifyOtp(fullNumber, code);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between selection:bg-blue-500/30 selection:text-white">
      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
              aria-label="Back to Career Navigator Home"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-sm sm:text-base text-white">Career Navigator</span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold tracking-wider">
              Auth Hub
            </span>
          </div>
        </div>

      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: SaaS Branding, Product Highlights & Preview */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI-Powered Career Intelligence</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
              Welcome back. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-blue-200">
                Your next opportunity starts here.
              </span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Sign in to analyze your resume with real ATS algorithms, practice technical interviews with conversational AI, and track your engineering readiness.
            </p>

            {/* Product Benefits List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-200">ATS Resume Optimizer</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Section detection, keyword density, and role-based matching diagnostics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0 mt-0.5">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-200">Live Mock Interview Studio</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Practice speech pacing, architectural explanations, and technical depth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-200">Integrated CodeLab Sandbox</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    In-browser code editor with instant test-case execution and algorithmic review.
                  </p>
                </div>
              </div>
            </div>

            {/* Realistic Mini Telemetry Preview Card */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0F172A]/70 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Verified Session Security
                </span>
                <span className="text-teal-400 text-[10px]">OWASP Compliant</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/50">
                  <div className="text-[10px] text-slate-400">ATS Pass Rate</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">92%</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/50">
                  <div className="text-[10px] text-slate-400">Optimal WPM</div>
                  <div className="text-sm font-bold text-teal-400 mt-0.5">138</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/50">
                  <div className="text-[10px] text-slate-400">Auth Standard</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">HttpOnly</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-[#0F172A]/90 backdrop-blur-xl shadow-2xl relative">
              
              {/* Target Destination Banner if redirected */}
              {targetDestinationName && (
                <div className="mb-5 p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Sign in to access <strong>{targetDestinationName}</strong></span>
                </div>
              )}

              {/* Mode Selector Tabs (Sign In / Register / Mobile OTP) */}
              {mode !== 'forgot_password' && (
                <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-6 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                      mode === 'register'
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('mobile_otp')}
                    className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                      mode === 'mobile_otp'
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mobile OTP
                  </button>
                </div>
              )}

              {/* Alerts: Validation Error or Server Error */}
              {(validationError || authError) && (
                <div
                  role="alert"
                  className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{validationError || authError}</p>
                    {authError?.includes('register') && mode === 'signin' && (
                      <button
                        onClick={() => switchMode('register')}
                        className="mt-1 text-blue-400 hover:underline font-semibold block"
                      >
                        Switch to Registration tab &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Alert: Success Notice */}
              {successNotice && (
                <div
                  role="status"
                  className="mb-5 p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2.5 animate-fadeIn"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* VIEW 1: SIGN IN FORM */}
              {mode === 'signin' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white tracking-tight">Sign in to your account</h2>
                    <p className="text-xs text-slate-400 mt-1">Enter your registered email and password to continue.</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                    <div>
                      <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="login-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="candidate@example.com"
                          autoComplete="email"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => switchMode('forgot_password')}
                          className="text-xs text-blue-400 hover:text-blue-300 transition"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Remember me on this device</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg text-sm shadow-md hover:shadow-blue-500/25 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button
                      onClick={() => switchMode('register')}
                      className="text-blue-400 hover:text-blue-300 font-semibold transition cursor-pointer"
                    >
                      Register for free &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 2: REGISTRATION FORM */}
              {mode === 'register' && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-white tracking-tight">Create your account</h2>
                    <p className="text-xs text-slate-400 mt-1">Start preparing with AI career diagnostics and mock interviews.</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Morgan"
                          autoComplete="name"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@university.edu"
                          autoComplete="email"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-300 mb-1">
                        Password (min 8 characters, letters & numbers)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create strong password"
                          autoComplete="new-password"
                          className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`py-2 px-3 rounded-lg border text-left transition ${
                            role === 'student'
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Candidate / Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('admin')}
                          className={`py-2 px-3 rounded-lg border text-left transition ${
                            role === 'admin'
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Admin / Placement
                        </button>
                      </div>
                    </div>

                    {/* Optional Mobile Number */}
                    <div>
                      <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                        Mobile Number <span className="text-slate-500 font-normal">(optional for OTP login)</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-slate-900/90 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+1">+1 (US)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+65">+65 (SG)</option>
                        </select>
                        <input
                          id="reg-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          className="flex-1 px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold rounded-lg text-sm shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Free Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      onClick={() => switchMode('signin')}
                      className="text-blue-400 hover:text-blue-300 font-semibold transition cursor-pointer"
                    >
                      Sign in here &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 3: FORGOT PASSWORD FORM */}
              {mode === 'forgot_password' && (
                <div>
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-3 transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <h2 className="text-xl font-bold text-white tracking-tight">Reset Password</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {resetStep === 'request'
                        ? 'Enter your account email to receive a password reset token.'
                        : 'Enter the reset token and choose a new password.'}
                    </p>
                  </div>

                  {resetNotice && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
                      {resetNotice}
                    </div>
                  )}

                  {resetStep === 'request' ? (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="forgot-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? 'Requesting Reset Link...' : 'Send Password Reset Link'}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setResetStep('submit')}
                          className="text-xs text-slate-400 hover:text-slate-200 underline"
                        >
                          Already have a reset token? Enter it here
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                      <div>
                        <label htmlFor="reset-token" className="block text-xs font-semibold text-slate-300 mb-1">
                          Reset Token
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <input
                            id="reset-token"
                            type="text"
                            required
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                            placeholder="64-character token"
                            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reset-new-password" className="block text-xs font-semibold text-slate-300 mb-1">
                          New Password (min 8 chars, letters & numbers)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="reset-new-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New strong password"
                            className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-slate-300 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="reset-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? 'Updating Password...' : 'Save New Password & Log In'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* VIEW 4: MOBILE OTP FLOW */}
              {mode === 'mobile_otp' && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-white tracking-tight">Mobile OTP Authentication</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {otpStep === 'phone'
                        ? 'Sign in using your registered mobile number.'
                        : 'Enter the 6-digit verification code.'}
                    </p>
                  </div>

                  {otpDevNotice && (
                    <div className="mb-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                      {otpDevNotice}
                      {serverOtp && (
                        <div className="mt-1 font-mono font-bold text-amber-200">
                          Dev Verification Code: {serverOtp}
                        </div>
                      )}
                    </div>
                  )}

                  {otpStep === 'phone' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label htmlFor="otp-phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Registered Mobile Number
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-slate-900/90 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-2.5 focus:outline-none focus:border-blue-500"
                          >
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+65">+65 (SG)</option>
                          </select>
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <input
                              id="otp-phone"
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="9876543210"
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? 'Dispatching SMS...' : 'Send Verification Code'}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                          <span>Enter 6-Digit Code</span>
                          <button
                            type="button"
                            onClick={() => { setOtpStep('phone'); setOtpDigits(['', '', '', '', '', '']); }}
                            className="text-blue-400 hover:underline"
                          >
                            Change Number
                          </button>
                        </div>
                        
                        <div className="flex justify-between gap-2">
                          {otpDigits.map((d, idx) => (
                            <input
                              key={idx}
                              ref={(el) => { otpInputRefs.current[idx] = el; }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={d}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-11 h-12 text-center text-lg font-mono font-bold bg-slate-900/90 border border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white transition"
                              aria-label={`Digit ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Didn't receive code?</span>
                        {otpCountdown > 0 ? (
                          <span className="font-mono text-slate-500">Resend in {otpCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSubmitting}
                            className="text-blue-400 hover:underline font-semibold"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => executeVerifyOtp()}
                        disabled={isSubmitting || otpDigits.some((d) => d === '')}
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? 'Verifying OTP...' : 'Verify & Log In'}
                      </button>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                    Prefer email and password?{' '}
                    <button
                      onClick={() => switchMode('signin')}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Sign in with email
                    </button>
                  </div>
                </div>
              )}

              {/* Developer / Demo Quick Sandbox Access */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>Fast Preview Sandbox:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Dev Mode</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => demoLogin('student')}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition text-center cursor-pointer"
                  >
                    [Student Sandbox]
                  </button>
                  <button
                    type="button"
                    onClick={() => demoLogin('admin')}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition text-center cursor-pointer"
                  >
                    [Admin Sandbox]
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B1120]/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Career Navigator Platform • Secure Authenticated Session Architecture
      </footer>
    </div>
  );
}
