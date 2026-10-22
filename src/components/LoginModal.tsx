import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  AlertCircle,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Smartphone,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Check,
  GraduationCap
} from 'lucide-react';
import { User as UserType } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  onGoogleLogin: () => void;
  loading: 'google' | 'student' | 'admin' | null;
  oauthError: string | null;
  oauthInstructions?: string | null;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  loading: externalLoading,
  oauthError,
  oauthInstructions
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'mobile_otp' | 'register'>('credentials');
  
  // Credentials / Register State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  if (!isOpen) return null;

  // Handle Credentials Login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      sound.playClick(400);
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      sound.playClick(400);
      return;
    }

    setSubmitting(true);
    sound.playClick(1000);

    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed.');
      }
      sound.playChime();
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      sound.playClick(400);
      setLocalError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (!username.trim()) {
      setLocalError('Please enter your full name.');
      sound.playClick(400);
      return;
    }

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      sound.playClick(400);
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      sound.playClick(400);
      return;
    }

    setSubmitting(true);
    sound.playClick(1000);

    try {
      const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhoneDigits.length >= 10 ? `${countryCode} ${cleanPhoneDigits}` : undefined;
      const response = await api.post('/api/auth/register', {
        name: username.trim(),
        email: email.trim(),
        password,
        role,
        phone: fullPhone
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }
      sound.playChime();
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      sound.playClick(400);
      setLocalError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Send Mobile OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      sound.playClick(400);
      return;
    }

    const fullPhone = `${countryCode} ${cleanDigits}`;
    setSubmitting(true);
    sound.playClick(1000);

    try {
      const response = await api.post('/api/auth/send-otp', { phone: fullPhone });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification OTP.');
      }
      sound.playClick(900);
      setOtpStep('verify');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCountdown(30);
      if (data.otpCode) {
        setServerOtp(data.otpCode);
      }
      setLocalSuccess(`OTP sent to ${fullPhone}`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      sound.playClick(400);
      setLocalError(err.message || 'Failed to send OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);

    const code = otpDigits.join('');
    if (code.length < 6) {
      setLocalError('Please enter all 6 digits.');
      sound.playClick(400);
      return;
    }

    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const fullPhone = `${countryCode} ${cleanDigits}`;
    setSubmitting(true);
    sound.playClick(1200);

    try {
      const response = await api.post('/api/auth/verify-otp', {
        phone: fullPhone,
        otp: code,
        name: username.trim() || undefined
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code.');
      }
      sound.playChime();
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      sound.playClick(400);
      setLocalError(err.message || 'OTP verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md border border-[var(--border)] bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--primary-soft)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--accent-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)]">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] tracking-tight">
                {activeTab === 'credentials' && 'Login via Email'}
                {activeTab === 'mobile_otp' && 'Login via Mobile Number'}
                {activeTab === 'register' && 'Register Candidate Account'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                {activeTab === 'credentials' && 'Sign in with your registered email and password'}
                {activeTab === 'mobile_otp' && 'Sign in using your registered mobile number'}
                {activeTab === 'register' && 'Create your account to enable portal access'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(800);
              onClose();
            }}
            className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: Exactly 2 login methods + registration */}
        <div className="grid grid-cols-3 p-1 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-mono">
          <button
            onClick={() => {
              sound.playClick(1000);
              setActiveTab('credentials');
              setLocalError(null);
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer text-center ${
              activeTab === 'credentials'
                ? 'bg-[var(--primary)] text-white font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => {
              sound.playClick(1000);
              setActiveTab('mobile_otp');
              setOtpStep('phone');
              setLocalError(null);
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer text-center ${
              activeTab === 'mobile_otp'
                ? 'bg-[var(--primary)] text-white font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Mobile Login
          </button>
          <button
            onClick={() => {
              sound.playClick(1000);
              setActiveTab('register');
              setLocalError(null);
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer text-center ${
              activeTab === 'register'
                ? 'bg-[var(--primary)] text-white font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Notice with Registration Direct Action */}
        {(localError || oauthError) && (
          <div className="p-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)] text-xs space-y-2">
            <div className="flex items-center space-x-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0" />
              <span>Authentication Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed pl-6">{localError || oauthError}</p>
            {((localError && localError.toLowerCase().includes('register')) || (oauthError && oauthError.toLowerCase().includes('register'))) && activeTab !== 'register' && (
              <div className="pl-6 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(1000);
                    setActiveTab('register');
                    setLocalError(null);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-[11px] font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Register Account Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Notice */}
        {localSuccess && (
          <div className="p-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)] text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{localSuccess}</span>
          </div>
        )}

        {/* TAB 1: EMAIL LOGIN (Email & Password) */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Login via Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switching options */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(1000);
                  setActiveTab('mobile_otp');
                  setOtpStep('phone');
                  setLocalError(null);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-medium transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                <span>Login via Mobile Number with OTP</span>
              </button>
              <div className="text-center pt-1">
                <span className="text-[11px] text-[var(--text-secondary)]">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(1000);
                    setActiveTab('register');
                    setLocalError(null);
                  }}
                  className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: MOBILE NUMBER WITH OTP */}
        {activeTab === 'mobile_otp' && (
          <div className="space-y-4">
            {otpStep === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] font-mono"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                    <div className="relative flex-1">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="98765 43210"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] font-mono tracking-wider focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                    Only registered numbers can request login OTPs.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send OTP Code</span>
                    </>
                  )}
                </button>

                {/* Switching options */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(1000);
                      setActiveTab('credentials');
                      setLocalError(null);
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-medium transition cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-[var(--primary)]" />
                    <span>Login via Email & Password</span>
                  </button>
                  <div className="text-center pt-1">
                    <span className="text-[11px] text-[var(--text-secondary)]">Not registered yet? </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick(1000);
                        setActiveTab('register');
                        setLocalError(null);
                      }}
                      className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      Register here
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs text-[var(--text-secondary)] font-mono">
                    OTP sent to <span className="font-bold text-[var(--text-primary)]">{countryCode} {phone}</span>
                  </span>
                </div>

                {serverOtp && (
                  <div className="p-2.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] flex items-center justify-between text-xs font-mono">
                    <span>Code: <strong className="text-[var(--accent)]">{serverOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const split = serverOtp.split('').slice(0, 6);
                        setOtpDigits(split);
                        otpInputRefs.current[5]?.focus();
                      }}
                      className="px-2 py-0.5 rounded bg-[var(--accent)] text-white text-[10px] font-bold cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      className="w-10 h-10 text-center text-base font-bold font-mono rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  {otpCountdown > 0 ? (
                    <span className="text-[var(--text-muted)] text-[10px]">Resend in {otpCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-[var(--primary)] text-[11px] underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('phone');
                      setLocalError(null);
                    }}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Change number</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpDigits.some((d) => !d)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Login</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                User Name / Full Name <span className="text-[var(--primary)]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                Email Address <span className="text-[var(--primary)]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                Password <span className="text-[var(--primary)]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                Mobile Number <span className="text-[var(--text-muted)] font-normal">(optional, enables Mobile OTP)</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] font-mono"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] font-mono tracking-wider focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] font-mono">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center space-x-2 ${
                    role === 'student'
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <div className="font-semibold text-xs">Student</div>
                    <div className="text-[9px] text-[var(--text-muted)]">Interviews & ATS</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center space-x-2 ${
                    role === 'admin'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                  <div>
                    <div className="font-semibold text-xs">Coordinator</div>
                    <div className="text-[9px] text-[var(--text-muted)]">Analytics & audits</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Registration & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <span className="text-[11px] text-[var(--text-secondary)]">Already registered? </span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(1000);
                  setActiveTab('credentials');
                  setLocalError(null);
                }}
                className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                Login via Email
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-[var(--border)] text-center">
          <p className="text-[10px] text-[var(--text-muted)] font-mono">
            Career Navigator Placement Prep • Zero Telemetry Tracking
          </p>
        </div>
      </div>
    </div>
  );
}
