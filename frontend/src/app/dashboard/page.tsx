'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { StatusChip, JobStatus } from '@/components/StatusChip';
import { ProgressBar } from '@/components/ProgressBar';
import { PlusIcon, XIcon, TrashIcon } from '@phosphor-icons/react';

interface Job {
  id: string;
  template: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for now, eventually this will fetch from the Go backend.
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setJobs([
        { id: 'job-1234', template: 'Marketing Video', status: 'processing', progress: 45, createdAt: new Date().toISOString() },
        { id: 'job-5678', template: 'Social Media Reel', status: 'completed', progress: 100, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'job-9012', template: 'Tutorial Intro', status: 'pending', progress: 0, createdAt: new Date(Date.now() - 60000).toISOString() },
        { id: 'job-3456', template: 'Product Showcase', status: 'failed', progress: 12, createdAt: new Date(Date.now() - 7200000).toISOString() },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCancel = (id: string) => {
    // Optimistic UI update
    setJobs(jobs.map(job => job.id === id ? { ...job, status: 'cancelled' } : job));
  };

  const activeJobs = jobs.filter(j => j.status === 'processing' || j.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Render Queue</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Overview of your current and past rendering jobs.</p>
        </div>
        <Link 
          href="/create"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--color-purple)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px 0 rgba(138, 43, 226, 0.39)'
          }}
        >
          <PlusIcon weight="bold" />
          New Masterpiece
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <Card glow={activeJobs > 0}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Jobs</span>
            <span className="mono-text" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-cyan)' }}>{activeJobs}</span>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Completed Today</span>
            <span className="mono-text" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{jobs.filter(j => j.status === 'completed').length}</span>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Jobs</span>
            <span className="mono-text" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{jobs.length}</span>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Jobs</h3>
        
        {loading ? (
          <div className="scanner-bar-container" style={{ height: '2px', background: 'var(--color-bg-base)', borderRadius: '2px' }}>
            <div className="scanner-bar" />
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No jobs found. Create one to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map(job => (
              <div 
                key={job.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>{job.template}</span>
                  <Link href={job.status === 'completed' ? `/share/${job.id}` : `/job/${job.id}`} className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'underline' }}>
                    {job.id}
                  </Link>
                </div>

                <div style={{ width: '100%' }}>
                  <ProgressBar progress={job.progress} label={job.status === 'processing' ? 'Rendering...' : undefined} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <StatusChip status={job.status} />
                </div>

                <div className="mono-text" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                  {new Date(job.createdAt).toLocaleTimeString()}
                </div>

                <div>
                  {(job.status === 'processing' || job.status === 'pending') && (
                    <button 
                      onClick={() => handleCancel(job.id)}
                      style={{ 
                        padding: '0.5rem', 
                        color: 'var(--color-text-secondary)',
                        transition: 'color 0.2s',
                        borderRadius: '4px'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--color-error)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                      title="Cancel Job"
                    >
                      <XIcon weight="bold" size={20} />
                    </button>
                  )}
                  {job.status === 'completed' && (
                    <Link href={`/share/${job.id}`} style={{ padding: '0.5rem', color: 'var(--color-cyan)' }}>
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
