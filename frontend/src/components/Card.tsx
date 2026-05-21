import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = '', glow = false }: CardProps) {
  return (
    <div className={`glass-card ${glow ? 'active-glow' : ''} ${className}`}>
      {children}
    </div>
  );
}
