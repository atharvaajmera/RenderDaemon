import React from 'react';
import { CircleNotchIcon, CheckCircleIcon, XCircleIcon, ProhibitIcon, ClockIcon } from '@phosphor-icons/react';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface StatusChipProps {
  status: JobStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { color: 'var(--color-text-muted)', icon: ClockIcon, bg: 'rgba(255, 255, 255, 0.1)', text: 'PENDING' };
      case 'processing':
        return { color: 'var(--color-cyan)', icon: CircleNotchIcon, bg: 'var(--color-cyan-glow)', text: 'PROCESSING', spin: true };
      case 'completed':
        return { color: 'var(--color-success)', icon: CheckCircleIcon, bg: 'rgba(0, 230, 118, 0.15)', text: 'COMPLETED' };
      case 'failed':
        return { color: 'var(--color-error)', icon: XCircleIcon, bg: 'rgba(255, 23, 68, 0.15)', text: 'FAILED' };
      case 'cancelled':
        return { color: 'var(--color-text-secondary)', icon: ProhibitIcon, bg: 'rgba(152, 140, 160, 0.2)', text: 'CANCELLED' };
      default:
        return { color: 'var(--color-text-primary)', icon: ClockIcon, bg: 'rgba(255, 255, 255, 0.1)', text: 'UNKNOWN' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.375rem', 
        padding: '0.25rem 0.75rem', 
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: '0.75rem',
        fontWeight: 600,
        border: `1px solid ${config.color}`,
        boxShadow: status === 'processing' ? `0 0 8px ${config.bg}` : 'none'
      }}
    >
      <Icon weight="bold" className={config.spin ? 'animate-spin' : ''} style={config.spin ? { animation: 'spin 1.5s linear infinite' } : {}} />
      <span className="mono-text">{config.text}</span>
      {config.spin && (
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      )}
    </div>
  );
}
