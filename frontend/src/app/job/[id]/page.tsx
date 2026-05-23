'use client';

import Link from 'next/link';
import { Person, Scan } from '@phosphor-icons/react';
import React from 'react';

export default function JobProgressPage({ params }: { params: Promise<{ id: string }> }) {
  // Mock Job ID for visuals
  const unwrappedParams = React.use(params);
  const displayId = unwrappedParams.id ? "0x" + unwrappedParams.id.toUpperCase().substring(0, 6) : '0x8F9A2B';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
          <Scan size={24} weight="bold" color="var(--color-cyan)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>RenderDaemon</h1>
        </div>

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
        {/* Card Placeholder for Step 2 */}
        <div style={{
          width: '100%',
          maxWidth: '768px',
          height: '400px',
          border: '1px dashed rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)'
        }}>
          [ Glassmorphic Card Container ]
        </div>
      </main>

    </div>
  );
}
