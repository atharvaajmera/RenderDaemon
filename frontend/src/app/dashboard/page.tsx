'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Job, getAllJobs, cancelJob } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusChip } from '@/components/StatusChip';
import { Plus, X, ArrowRight, CaretRight, CheckCircle, Clock, ChartLineUp } from '@phosphor-icons/react';

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
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#09090b] px-4 py-8 font-inter">
      
      {/* SaaS Page Wrapper */}
      <div className="w-full max-w-[1120px] flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Overview</h1>
            <p className="text-sm text-[#a1a1aa] mt-1">Monitor your rendering queue and system metrics.</p>
          </div>
          <Link 
            href="/create" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
          >
            <Plus weight="bold" />
            New Job
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Active Processes" 
            value={activeJobs} 
            icon={<ChartLineUp size={20} className="text-[#3b82f6]" />} 
          />
          <MetricCard 
            title="Completed" 
            value={completedJobs} 
            icon={<CheckCircle size={20} className="text-[#10b981]" />} 
          />
          <MetricCard 
            title="Total Jobs" 
            value={jobs.length} 
            icon={<Clock size={20} className="text-[#a1a1aa]" />} 
          />
        </div>

        {/* Job Queue Table */}
        <div className="flex flex-col bg-[#18181b] border border-white/5 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#18181b]">
            <h3 className="text-base font-medium text-white">Recent Activity</h3>
          </div>
          
          <div className="overflow-x-auto">
            {loading && jobs.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#a1a1aa]">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <ChartLineUp size={24} className="text-[#a1a1aa]" />
                </div>
                <h4 className="text-base font-medium text-white mb-1">No jobs yet</h4>
                <p className="text-sm text-[#a1a1aa] max-w-sm mb-6">You haven't submitted any rendering jobs. Create a new job to get started.</p>
                <Link 
                  href="/create" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus weight="bold" />
                  Create First Job
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#18181b]">
                    <th className="px-6 py-3 text-xs font-medium text-[#a1a1aa] uppercase tracking-wider w-1/4">Template</th>
                    <th className="px-6 py-3 text-xs font-medium text-[#a1a1aa] uppercase tracking-wider w-[15%]">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-[#a1a1aa] uppercase tracking-wider w-1/4">Progress</th>
                    <th className="px-6 py-3 text-xs font-medium text-[#a1a1aa] uppercase tracking-wider w-[15%]">Time</th>
                    <th className="px-6 py-3 text-xs font-medium text-[#a1a1aa] uppercase tracking-wider text-right w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#18181b]">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#e4e4e7]">{job.template_id}</span>
                          <Link href={`/job/${job.id}`} className="text-xs text-[#a1a1aa] hover:text-white transition-colors mt-0.5">
                            {job.id.substring(0, 8)}...
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SaaSStatusChip status={job.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full max-w-[200px] flex items-center gap-3">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                job.status === 'completed' ? 'bg-[#10b981]' : 
                                job.status === 'failed' || job.status === 'cancelled' ? 'bg-[#ef4444]' : 
                                'bg-[#3b82f6]'
                              }`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#a1a1aa] w-8">{Math.round(job.progress)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a1aa]">
                        {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(job.status === 'processing' || job.status === 'pending') && (
                            <button 
                              onClick={() => handleCancel(job.id)}
                              className="p-1.5 text-[#a1a1aa] hover:text-[#ef4444] hover:bg-white/5 rounded transition-colors"
                              title="Cancel Job"
                            >
                              <X weight="bold" size={16} />
                            </button>
                          )}
                          <Link 
                            href={`/job/${job.id}`} 
                            className="p-1.5 text-[#a1a1aa] hover:text-white hover:bg-white/5 rounded transition-colors flex items-center"
                          >
                            <CaretRight weight="bold" size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-white/10 transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[#a1a1aa]">{title}</span>
        {icon}
      </div>
      <span className="text-2xl font-semibold text-white">{value}</span>
    </div>
  );
}

function SaaSStatusChip({ status }: { status: string }) {
  const getStyle = () => {
    switch (status) {
      case 'processing': return 'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20';
      case 'completed': return 'bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20';
      case 'failed': return 'bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/20';
      case 'cancelled': return 'bg-white/5 text-[#a1a1aa] border-white/10';
      default: return 'bg-white/5 text-[#a1a1aa] border-white/10';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStyle()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
