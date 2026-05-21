import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  // Ensure progress is bounded
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="progress-container" style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          <span>{label}</span>
          <span className="mono-text">{clampedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div 
        style={{ 
          height: '8px', 
          width: '100%', 
          backgroundColor: 'var(--color-bg-base)', 
          borderRadius: '4px', 
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}
      >
        <div 
          style={{ 
            height: '100%', 
            width: `${clampedProgress}%`, 
            background: 'linear-gradient(90deg, var(--color-purple), var(--color-cyan))',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px var(--color-cyan-glow)'
          }}
        />
      </div>
    </div>
  );
}
