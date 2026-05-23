'use client';

import Link from 'next/link';
import { Person, Scan, XCircle } from '@phosphor-icons/react';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_MESSAGES = [
  'Ingesting source media...',
  'Analyzing scene composition...',
  'Detecting keyframes...',
  'Generating proxy files...',
  'Encoding video stream...',
  'Applying color grading...',
  'Optimizing bitrate allocation...',
  'Multiplexing audio tracks...',
  'Finalizing output container...',
];

const PIPELINE_STEPS = ['INGEST', 'ANALYZE', 'ENCODE', 'FINALIZE'];

function getActiveStep(progress: number): number {
  if (progress < 20) return 0;
  if (progress < 50) return 1;
  if (progress < 85) return 2;
  return 3;
}

function formatEta(progress: number): string {
  const remaining = Math.max(0, 100 - progress);
  const totalSeconds = Math.round(remaining * 1.8); // ~3 min total render
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0 && s === 0) return 'Complete';
  return `~${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function JobProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const displayId = unwrappedParams.id ? '0x' + unwrappedParams.id.toUpperCase().substring(0, 6) : '0x8F9A2B';
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  // Animate progress
  useEffect(() => {
    if (cancelled) return;
    if (progress >= 100) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        // Variable speed: faster at start, slower near end
        const increment = prev < 30 ? 1.2 : prev < 70 ? 0.8 : prev < 90 ? 0.4 : 0.2;
        return Math.min(100, prev + increment);
      });
    }, 300);

    return () => clearInterval(interval);
  }, [progress, cancelled]);

  // Track completion in a ref so status rotation doesn't depend on progress
  const isDoneRef = React.useRef(false);
  useEffect(() => {
    isDoneRef.current = progress >= 100;
  }, [progress]);

  // Rotate status messages
  useEffect(() => {
    if (cancelled) return;

    const interval = setInterval(() => {
      if (isDoneRef.current) return;
      setStatusIdx(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [cancelled]);

  const handleCancel = useCallback(() => {
    setCancelled(true);
    setTimeout(() => router.push('/dashboard'), 800);
  }, [router]);

  const displayProgress = Math.round(progress);
  const activeStep = getActiveStep(progress);
  const isComplete = progress >= 100;

  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* CRT Overlay Effect */}
      <div className="crt-overlay" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 4px, 3px 100%'
      }}></div>

      {/* Top App Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, textDecoration: 'none', color: 'inherit' }}>
          <Scan size={24} weight="bold" color="var(--color-cyan)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>RenderDaemon</h1>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="mono-text" style={{ fontSize: '0.875rem', opacity: 0.5 }}>
            JOB_ID: {displayId}
          </span>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Person size={16} color="rgba(255,255,255,0.7)" />
          </div>
        </div>
      </header>

      {/* Main Canvas Container */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Ambient Glow Orbs behind the card */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.25), transparent 70%)',
          filter: 'blur(80px)',
          top: '20%',
          left: '10%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.2), transparent 70%)',
          filter: 'blur(80px)',
          bottom: '15%',
          right: '10%',
          pointerEvents: 'none'
        }} />

        {/* Glassmorphic Processing Card */}
        <div style={{
          width: '100%',
          maxWidth: '640px',
          background: 'rgba(20, 20, 28, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 43, 226, 0.08)',
          position: 'relative',
          opacity: cancelled ? 0.5 : 1,
          transition: 'opacity 0.5s ease'
        }}>

          {/* Scanning top border indicator */}
          {!isComplete && !cancelled && (
            <div className="scanner-bar-container" style={{ height: '2px', width: '100%' }}>
              <div className="scanner-bar" />
            </div>
          )}
          {/* Green top border when complete */}
          {isComplete && !cancelled && (
            <div style={{ height: '2px', width: '100%', background: 'var(--color-success)' }} />
          )}

          {/* Card Inner Content */}
          <div style={{ padding: '2.5rem 2rem 2rem' }}>

            {/* Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 1rem',
                borderRadius: '999px',
                background: cancelled
                  ? 'rgba(255, 23, 68, 0.08)'
                  : isComplete
                    ? 'rgba(0, 230, 118, 0.08)'
                    : 'rgba(0, 240, 255, 0.08)',
                border: `1px solid ${cancelled
                  ? 'rgba(255, 23, 68, 0.25)'
                  : isComplete
                    ? 'rgba(0, 230, 118, 0.25)'
                    : 'rgba(0, 240, 255, 0.25)'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: cancelled
                  ? 'var(--color-error)'
                  : isComplete
                    ? 'var(--color-success)'
                    : 'var(--color-cyan)'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: cancelled
                    ? 'var(--color-error)'
                    : isComplete
                      ? 'var(--color-success)'
                      : 'var(--color-cyan)',
                  animation: cancelled || isComplete ? 'none' : 'pulse-dot 2s ease-in-out infinite'
                }} />
                {cancelled ? 'Cancelled' : isComplete ? 'Complete' : 'Processing'}
              </span>
            </div>

            {/* Thumbnail Preview Area */}
            <div style={{
              width: '100%',
              height: '220px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(0, 240, 255, 0.1), rgba(20, 20, 28, 0.9))',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Pulsing frame lines */}
              <div style={{
                position: 'absolute',
                inset: '12px',
                border: `1px solid ${isComplete ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 240, 255, 0.15)'}`,
                borderRadius: '8px',
                animation: cancelled ? 'none' : 'pulse-frame 3s ease-in-out infinite'
              }} />

              {/* Center render icon */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                opacity: 0.6
              }}>
                <Scan size={48} weight="thin" color={isComplete ? 'var(--color-success)' : 'var(--color-cyan)'} style={{ animation: cancelled ? 'none' : 'pulse-frame 3s ease-in-out infinite' }} />
                <span className="mono-text" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
                  {isComplete ? 'RENDER COMPLETE' : 'RENDER PREVIEW'}
                </span>
              </div>
            </div>

            {/* Progress Section */}
            <div style={{ marginTop: '1.75rem' }}>

              {/* Percentage + ETA Row */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span className="mono-text" style={{
                    fontSize: '2.75rem',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    ...(isComplete
                      ? { color: 'var(--color-success)' }
                      : {
                          background: 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'transparent',
                        }),
                    lineHeight: 1,
                    transition: 'color 0.3s ease'
                  }}>
                    {displayProgress}
                  </span>
                  <span className="mono-text" style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)'
                  }}>%</span>
                </div>
                <span className="mono-text" style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.05em'
                }}>
                  {cancelled ? 'ABORTED' : isComplete ? 'DONE' : `ETA: ${formatEta(progress)}`}
                </span>
              </div>

              {/* Status Message */}
              <p className="mono-text" style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '1rem',
                letterSpacing: '0.03em',
                transition: 'opacity 0.3s ease',
                minHeight: '1.2em'
              }}>
                {cancelled ? 'Render cancelled by user.' : isComplete ? 'All tasks completed successfully.' : STATUS_MESSAGES[statusIdx]}
              </p>

              {/* Progress Bar Track */}
              <div style={{
                width: '100%',
                height: '6px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Progress Bar Fill */}
                <div style={{
                  width: `${displayProgress}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: cancelled
                    ? 'var(--color-error)'
                    : isComplete
                      ? 'var(--color-success)'
                      : 'linear-gradient(90deg, var(--color-purple), var(--color-cyan))',
                  position: 'relative',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Leading Edge Glow */}
                  {!isComplete && !cancelled && (
                    <div style={{
                      position: 'absolute',
                      right: '-2px',
                      top: '-4px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'var(--color-cyan)',
                      boxShadow: '0 0 12px var(--color-cyan), 0 0 24px rgba(0, 240, 255, 0.4)',
                      animation: 'pulse-dot 2s ease-in-out infinite'
                    }} />
                  )}
                </div>
              </div>

              {/* Step Indicators */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.75rem',
                fontSize: '0.65rem',
                letterSpacing: '0.04em'
              }}>
                {PIPELINE_STEPS.map((step, i) => (
                  <span key={step} className="mono-text" style={{
                    color: i <= activeStep ? (isComplete ? 'var(--color-success)' : 'var(--color-cyan)') : 'var(--color-text-muted)',
                    transition: 'color 0.4s ease'
                  }}>
                    {step}
                  </span>
                ))}
              </div>

            </div>

            {/* Cancel Render Button */}
            {!isComplete && !cancelled && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 23, 68, 0.06)',
                    border: '1px solid rgba(255, 23, 68, 0.2)',
                    color: 'var(--color-error)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 23, 68, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255, 23, 68, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 23, 68, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 23, 68, 0.2)';
                  }}
                >
                  <XCircle size={18} weight="bold" />
                  Cancel Render
                </button>
              </div>
            )}

            {/* View Result button when complete */}
            {isComplete && !cancelled && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <Link
                  href={`/job/${unwrappedParams.id}/result`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 2rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(138, 43, 226, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  View Result →
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}
