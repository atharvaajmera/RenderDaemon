'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, At, LockKey, SignIn, UserPlus, Hexagon, GithubLogo, GoogleLogo, User } from '@phosphor-icons/react';

export default function LoginPage() {
  const router = useRouter();
  const meshRef = useRef<HTMLDivElement>(null);
  const floatersRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Interactive Background Interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      if (meshRef.current) {
        meshRef.current.style.transform = `translate(${x * 20}px, ${y * 20}px) scale(1.1)`;
      }

      floatersRef.current.forEach((el, index) => {
        if (el) {
          const speed = (index + 1) * 10;
          el.style.transform = `translate(${x * speed}px, ${y * speed}px) rotate(${45 + (index * 15)}deg)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Simulate login/signup and redirect to dashboard
    router.push('/');
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-base)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem'
    }}>
      {/* Background Layer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(138, 43, 226, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 50% 50%, var(--color-bg-base) 0%, var(--color-bg-base) 100%)
        `
      }}>
        <div
          ref={meshRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.4,
            filter: 'blur(100px)',
            background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 50%, #480081 100%)',
            animation: 'pulse-mesh 15s ease-in-out infinite alternate',
            transition: 'transform 0.1s ease-out'
          }}
        />

        {/* Decorative capsules */}
        {[
          { w: '8rem', h: '3rem', rot: '45deg', top: '10%', left: '15%' },
          { w: '12rem', h: '4rem', rot: '-12deg', top: '60%', left: '5%' },
          { w: '10rem', h: '3.5rem', rot: '30deg', top: '20%', right: '10%' },
          { w: '6rem', h: '2rem', rot: '-45deg', bottom: '20%', right: '20%' },
        ].map((style, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) floatersRef.current[i] = el;
            }}
            style={{
              position: 'absolute',
              background: 'rgba(220, 184, 255, 0.05)',
              border: '1px solid rgba(220, 184, 255, 0.1)',
              borderRadius: '40px',
              pointerEvents: 'none',
              width: style.w,
              height: style.h,
              top: style.top,
              left: style.left,
              right: style.right,
              bottom: style.bottom,
              transform: `rotate(${style.rot})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <main style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>

        {/* Brand Identity Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
          <div style={{
            padding: '0.75rem',
            borderRadius: '12px',
            background: 'rgba(138, 43, 226, 0.1)',
            border: '1px solid rgba(138, 43, 226, 0.2)',
            backdropFilter: 'blur(12px)'
          }}>
            <Hexagon size={32} color="var(--color-purple)" weight="duotone" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>
              RenderDaemon
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
              The Sophisticated Architect of Automation
            </p>
          </div>
        </div>

        {/* Glassmorphic Login/Signup Card */}
        <div style={{
          background: 'rgba(26, 26, 26, 0.7)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(220, 184, 255, 0.1)',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}>
          <header style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {isSignUp ? 'Sign up to manage your render queue.' : 'Sign in to continue your render workflow.'}
            </p>
          </header>

          {/* Social Logins */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {['GOOGLE', 'GITHUB'].map((provider) => (
              <button key={provider} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: '#201f1f',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.05em'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#201f1f';
                }}
              >
                {provider === 'GOOGLE' ? <GoogleLogo size={20} weight="bold" /> : <GithubLogo size={20} weight="bold" />}
                <span className="mono-text">{provider}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span className="mono-text" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>OR</span>
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder="Enter your full name here"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input"
                    autoComplete="off"
                    style={{
                      width: '100%',
                      background: '#0e0e0e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    required
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <At size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="email"
                  placeholder="Enter your email here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    background: '#0e0e0e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-purple)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <LockKey size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password here"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    background: '#0e0e0e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    transition: 'all 0.3s',
                    letterSpacing: (showPassword || !password) ? 'normal' : '0.2em'
                  }}
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <LockKey size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password here"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="login-input"
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      background: '#0e0e0e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                      transition: 'all 0.3s',
                      letterSpacing: (showPassword || !confirmPassword) ? 'normal' : '0.2em'
                    }}
                    required
                  />
                </div>
              </div>
            )}

            {!isSignUp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.25rem' }}>
                <input type="checkbox" id="remember" style={{ cursor: 'pointer', accentColor: 'var(--color-purple)' }} />
                <label htmlFor="remember" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'var(--color-purple)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              {isSignUp ? <UserPlus size={20} /> : <SignIn size={20} />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-purple)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                textDecorationColor: 'rgba(138,43,226,0.3)',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
          {!isSignUp && (
            <Link
              href="#"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                textDecorationColor: 'rgba(255,255,255,0.2)'
              }}
            >
              Forgot Password?
            </Link>
          )}
        </footer>

        {/* Atmospheric Real-time status */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', opacity: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', animation: 'pulse-dot 2s infinite' }} />
            <span className="mono-text" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>API: ONLINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mono-text" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>NODES: 1,284 ACTIVE</span>
          </div>
        </div>

      </main>

      <style jsx global>{`
        @keyframes pulse-mesh {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.2) translate(5%, 5%); }
        }
        .login-input {
          font-family: inherit;
        }
        .login-input:focus {
          border-color: var(--color-purple) !important;
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
        }
        .login-btn:hover {
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
          background: #9b4dff !important;
        }
        .login-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
