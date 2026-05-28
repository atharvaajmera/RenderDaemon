'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Job, getAllJobs, cancelJob } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusChip } from '@/components/StatusChip';
import { PlusIcon, XIcon, ArrowRightIcon } from '@phosphor-icons/react';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    
    const interval = setInterval(() => {
      fetchJobs(false);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getAllJobs();
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setJobs(jobs.map(job => job.id === id ? { ...job, status: 'cancelled' } : job));
    try {
      await cancelJob(id);
      fetchJobs(false);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      fetchJobs(false);
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'processing' || j.status === 'pending').length;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0F0F0F] px-4 py-8">
      
      {/* Dashboard Wrapper (The "Box" with the colorful background) */}
      <div className="w-full max-w-[1280px] flex flex-col items-center rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative pb-16"
           style={{
             backgroundImage: "url('/vibrant-mesh-bg.png')",
             backgroundSize: 'cover',
             backgroundPosition: 'center',
           }}>
           


        {/* Metrics & Queue Section */}
        <div className="w-full flex flex-col gap-12 px-4 md:px-12">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`glass-panel p-8 rounded-3xl flex flex-col ${activeJobs > 0 ? 'glow-border' : ''}`}>
            <span className="font-label-sm text-label-sm text-secondary-container uppercase mb-2">Active Processes</span>
            <span className="font-headline-xl text-5xl font-bold text-white">{activeJobs}</span>
          </div>
          <div className="glass-panel p-8 rounded-3xl flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Completed Today</span>
            <span className="font-headline-xl text-5xl font-bold text-white">{jobs.filter(j => j.status === 'completed').length}</span>
          </div>
          <div className="glass-panel p-8 rounded-3xl flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Total Jobs</span>
            <span className="font-headline-xl text-5xl font-bold text-white">{jobs.length}</span>
          </div>
        </div>

        {/* Job List */}
        <div className="glass-panel p-8 rounded-[32px]">
          <h3 className="font-headline-md text-2xl font-bold text-white mb-8">Queue Status</h3>
          
          {loading && jobs.length === 0 ? (
            <div className="scanner-bar-container h-[2px] bg-white/10 rounded-full">
              <div className="scanner-bar"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant font-body-lg">
              No jobs found. The daemon is waiting.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map(job => (
                <div 
                  key={job.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_auto] items-center gap-4 p-6 glass-panel !bg-white/5 rounded-2xl hover:!bg-white/10 transition-all hover:-translate-y-1"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{job.template_id}</span>
                    <Link href={`/job/${job.id}`} className="font-label-sm text-xs text-on-surface-variant hover:text-secondary-container transition-colors">
                      {job.id.substring(0, 8)}...
                    </Link>
                  </div>

                  <div className="w-full">
                    <ProgressBar progress={job.progress} label={job.status === 'processing' ? 'Rendering...' : undefined} />
                  </div>

                  <div className="flex justify-center">
                    <StatusChip status={job.status} />
                  </div>

                  <div className="font-label-sm text-sm text-on-surface-variant text-right">
                    {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {(job.status === 'processing' || job.status === 'pending') && (
                      <button 
                        onClick={() => handleCancel(job.id)}
                        className="p-2 text-on-surface-variant hover:text-status-error transition-colors rounded-lg"
                        title="Cancel Job"
                      >
                        <XIcon weight="bold" size={20} />
                      </button>
                    )}
                    <Link 
                      href={`/job/${job.id}`} 
                      className="p-2 text-secondary-container bg-secondary-container/10 hover:bg-secondary-container/20 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <ArrowRightIcon weight="bold" size={20} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
