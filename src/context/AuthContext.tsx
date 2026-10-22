import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types.js';
import { api, parseApiResponse, formatApiError } from '../lib/api.js';
import { sound } from '../lib/sound.js';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  oauthInstructions: string | null;
  login: (email: string, password?: string, username?: string) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<{ success: boolean; otp?: string; message?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string, role?: 'student' | 'admin', phone?: string) => Promise<boolean>;
  demoLogin: (role: 'student' | 'admin') => Promise<boolean>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [oauthInstructions, setOauthInstructions] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setAuthError(null);
    setOauthInstructions(null);
  }, []);

  // Fetch current session state on initial load
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      const { ok, data } = await parseApiResponse(res);
      if (ok && data?.authenticated && data?.user) {
        setUser(data.user);
        return;
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        sound.playChime();
        refreshUser();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshUser]);

  // Standard Email/Password/Username login
  const login = async (email: string, password?: string, username?: string): Promise<boolean> => {
    clearError();
    try {
      const res = await api.post('/api/auth/login', { email, password, username });
      const { ok, status, data } = await parseApiResponse(res);

      if (!ok || !data.success) {
        if (status === 401) {
          throw new Error(data.error || 'Incorrect email or password. Please verify credentials.');
        }
        if (status === 400) {
          throw new Error(data.error || 'Please provide a valid email and password.');
        }
        if (status >= 500) {
          throw new Error(data.error || 'Authentication service temporarily unavailable. Please try again.');
        }
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      sound.playChime();
      setUser(data.user);
      return true;
    } catch (err: any) {
      sound.playClick(400);
      const userMessage = formatApiError(err, 'Login failed. Please verify your connection.');
      setAuthError(userMessage);
      return false;
    }
  };

  // Mobile Number OTP - Send 6-digit Code
  const sendOtp = async (phone: string): Promise<{ success: boolean; otp?: string; message?: string; error?: string }> => {
    clearError();
    try {
      const res = await api.post('/api/auth/send-otp', { phone });
      const { ok, data } = await parseApiResponse(res);

      if (!ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification SMS.');
      }

      sound.playClick(900);
      return { success: true, otp: data.otpCode, message: data.message };
    } catch (err: any) {
      sound.playClick(400);
      const userMessage = formatApiError(err, 'Failed to send verification code.');
      setAuthError(userMessage);
      return { success: false, error: userMessage };
    }
  };

  // Mobile Number OTP - Verify Code & Authenticate
  const verifyOtp = async (phone: string, otp: string, name?: string): Promise<boolean> => {
    clearError();
    try {
      const res = await api.post('/api/auth/verify-otp', { phone, otp, name });
      const { ok, data } = await parseApiResponse(res);

      if (!ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code. Please try again.');
      }

      sound.playChime();
      setUser(data.user);
      return true;
    } catch (err: any) {
      sound.playClick(400);
      const userMessage = formatApiError(err, 'OTP verification failed.');
      setAuthError(userMessage);
      return false;
    }
  };

  // User Registration
  const register = async (
    name: string,
    email: string,
    password?: string,
    role: 'student' | 'admin' = 'student',
    phone?: string
  ): Promise<boolean> => {
    clearError();
    try {
      const res = await api.post('/api/auth/register', { name, email, password, role, phone });
      const { ok, status, data } = await parseApiResponse(res);

      if (!ok || !data.success) {
        if (status === 409) {
          throw new Error(data.error || 'An account with this email already exists. Please log in.');
        }
        if (status === 400) {
          throw new Error(data.error || 'Please check your registration details and try again.');
        }
        if (status >= 500) {
          throw new Error(data.error || 'Server error occurred during registration. Please try again shortly.');
        }
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      sound.playChime();
      setUser(data.user);
      return true;
    } catch (err: any) {
      sound.playClick(400);
      const userMessage = formatApiError(err, 'Registration failed. Please check your connection and try again.');
      setAuthError(userMessage);
      return false;
    }
  };

  // 1-Click Quick Demo Sandbox login
  const demoLogin = async (role: 'student' | 'admin'): Promise<boolean> => {
    clearError();
    try {
      const res = await api.post('/api/auth/demo', { role });
      const { ok, data } = await parseApiResponse(res);

      if (!ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize demo sandbox.');
      }

      sound.playChime();
      setUser(data.user);
      return true;
    } catch (err: any) {
      sound.playClick(400);
      setAuthError(formatApiError(err, 'Demo login failed.'));
      return false;
    }
  };

  // Google OAuth Initiator
  const googleLogin = async (): Promise<void> => {
    clearError();
    try {
      const res = await api.get('/api/auth/url');
      const { ok, data } = await parseApiResponse(res);
      if (!ok) {
        throw new Error(data.error || data.instructions || 'Could not initialize Google OAuth.');
      }

      const { url } = data;
      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=550,height=650,left=150,top=100,resizable=yes,scrollbars=yes'
      );

      if (!authWindow) {
        setAuthError('Popup blocked by browser. Please enable popups for this domain to sign in with Google.');
      }
    } catch (err: any) {
      setAuthError(formatApiError(err, 'Google OAuth failed.'));
      if (err.message?.includes('Secrets') || err.message?.includes('Client ID')) {
        setOauthInstructions(`To activate Google OAuth in production:
1. Open Google Cloud Console -> APIs & Credentials.
2. Add Authorized Redirect URI: ${window.location.origin}/auth/callback
3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables.`);
      }
    }
  };

  // Secure Sign-Out Mechanism
  const logout = async (): Promise<void> => {
    sound.playClick(600);
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      clearError();
    }
  };

  // Forgot Password request
  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string; resetToken?: string }> => {
    clearError();
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      const { ok, data } = await parseApiResponse(res);
      if (!ok) {
        throw new Error(data.error || 'Failed to request password reset.');
      }
      return { success: true, message: data.message, resetToken: data.resetToken };
    } catch (err: any) {
      sound.playClick(400);
      const userMessage = formatApiError(err, 'Failed to request password reset.');
      setAuthError(userMessage);
      return { success: false, message: userMessage };
    }
  };

  // Reset Password request
  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    clearError();
    try {
      const res = await api.post('/api/auth/reset-password', { token, newPassword });
      const { ok, data } = await parseApiResponse(res);
      if (!ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      sound.playChime();
      return { success: true, message: data.message };
    } catch (err: any) {
      sound.playClick(400);
      const userMessage = formatApiError(err, 'Failed to reset password.');
      setAuthError(userMessage);
      return { success: false, message: userMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        oauthInstructions,
        login,
        sendOtp,
        verifyOtp,
        register,
        demoLogin,
        googleLogin,
        logout,
        forgotPassword,
        resetPassword,
        clearError,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
