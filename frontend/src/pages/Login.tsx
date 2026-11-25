// src/pages/Login.tsx - CORRECTED
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const { googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isAiStudioHost =
    typeof window !== 'undefined' && window.location.hostname.endsWith('.run.app');
  const GOOGLE_CLIENT_ID = isAiStudioHost ? undefined : rawClientId;

  const handleCredentialResponse = useCallback(async (response: { credential?: string }) => {
    try {
      setError('');
      if (!response?.credential) {
        throw new Error('No credential received from Google');
      }
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  }, [googleLogin, navigate]);

  const handleDemoGoogleLogin = async () => {
    try {
      setError('');
      await googleLogin('demo-google-token');
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  // Load Google Identity Services only when Client ID is configured
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    const loadGoogleScript = () => {
      if (window.google) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleLoaded(true);
      script.onerror = () => setError('Failed to load Google Sign-In');
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, [GOOGLE_CLIENT_ID]);

  // Initialize Google Sign In
  useEffect(() => {
    if (!isGoogleLoaded || !googleButtonRef.current || !GOOGLE_CLIENT_ID || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 368,
        }
      );

    } catch (err) {
      console.error('Google OAuth error:', err);
    }
  }, [isGoogleLoaded, GOOGLE_CLIENT_ID, handleCredentialResponse]);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Email login is disabled as per requirements
    console.log('Email login (disabled):', { email, password });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Login Header */}
        <div className={styles.loginHeader}>
          <h1 className={styles.title}>Login</h1>
          <p className={styles.subtitle}>Access your ReachInbox account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <div 
          ref={googleButtonRef} 
          className={styles.googleButtonContainer}
          style={{ 
            minHeight: '44px',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}
        >
          {(!GOOGLE_CLIENT_ID || !isGoogleLoaded) && (
            <button 
              type="button"
              className={styles.googleButton}
              onClick={GOOGLE_CLIENT_ID ? () => setError('Loading Google Sign-In...') : handleDemoGoogleLogin}
              disabled={isLoading || (Boolean(GOOGLE_CLIENT_ID) && !isGoogleLoaded)}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Login with Google</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingText}>
            Signing in...
          </div>
        )}

        {/* Divider - Exact text from Figma */}
        <div className={styles.divider}>
          <span>or sign up through email</span>
        </div>

        {/* Email Form (Disabled as per requirements) */}
        <form onSubmit={handleEmailLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Email ID
            </label>
            <input
              id="email"
              type="email"
              className={styles.inputField}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            className={styles.loginButton}
            type="submit"
            disabled
          >
            Login
          </button>
        </form>

        {/* Sign up link - if needed */}
        <div className={styles.signupText}>
          Don't have an account? 
          <a 
            href="#" 
            className={styles.signupLink}
            onClick={(e) => {
              e.preventDefault();
              setError('Sign up is currently available only through Google.');
            }}
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

// Declare google in window object
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default Login;