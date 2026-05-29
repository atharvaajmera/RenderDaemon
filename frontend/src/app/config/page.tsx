'use client';

import React, { useState, useEffect } from 'react';
import { getProfiles, getWorkflows, Profile, Workflow } from '@/lib/api';
import { GearSix, TreeStructure, SlidersHorizontal, ArrowRight, HardDrives } from '@phosphor-icons/react';

export default function ConfigPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [p, w] = await Promise.all([getProfiles(), getWorkflows()]);
        setProfiles(p);
        setWorkflows(w);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#09090b] px-4 py-8 font-inter">
      <div className="w-full max-w-[1120px] flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
              <GearSix className="text-[#a1a1aa]" />
              Configuration Manager
            </h1>
            <p className="text-sm text-[#a1a1aa] mt-1 max-w-2xl">
              Manage your rendering templates. Profiles define single rendering steps (like transcoding). 
              Workflows chain multiple profiles together into complex pipelines.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-4">
            <span className="text-sm text-[#f87171]">Failed to load configuration: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-[#3b82f6] rounded-full animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            
            {/* Workflows Section */}
            <section>
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <TreeStructure size={20} className="text-white" />
                <h3 className="text-lg font-medium text-white">Available Workflows</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflows.map(wf => (
                  <div key={wf.id} className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-base font-semibold text-white">{wf.name}</h4>
                      <span className="font-mono text-[10px] uppercase text-[#a1a1aa] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {wf.id.substring(0, 8)}
                      </span>
                    </div>
                    <p className="text-sm text-[#a1a1aa] mb-5 flex-grow">
                      {wf.description}
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Pipeline Steps</span>
                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex flex-col gap-3">
                        {wf.step_groups.map((group, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-[#d4d4d8]">
                                {group.parallel ? 'Parallel Group' : `Step ${idx + 1}`}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {group.steps.map((step, sIdx) => (
                                <React.Fragment key={sIdx}>
                                  <div className="text-xs bg-[#27272a] text-[#e4e4e7] px-2 py-1 rounded-md border border-white/5 shadow-sm font-medium">
                                    {profiles.find(p => p.id === step.profile_id)?.name || step.profile_id}
                                  </div>
                                  {sIdx < group.steps.length - 1 && group.parallel && (
                                    <span className="text-[#a1a1aa] text-xs">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                            {idx < wf.step_groups.length - 1 && (
                              <div className="flex justify-center mt-1.5 mb-0.5">
                                <ArrowRight size={14} className="text-[#52525b]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Profiles Section */}
            <section>
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <SlidersHorizontal size={20} className="text-white" />
                <h3 className="text-lg font-medium text-white">Atomic Profiles</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map(prof => (
                  <div key={prof.id} className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-white">{prof.name}</h4>
                      <span className="text-[10px] uppercase font-medium text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded border border-[#3b82f6]/20">
                        {prof.operation}
                      </span>
                    </div>
                    <p className="text-xs text-[#a1a1aa] mb-4 h-8 overflow-hidden">
                      {prof.description}
                    </p>
                    
                    <div className="bg-[#09090b] rounded-lg border border-white/5 overflow-hidden">
                      <div className="px-3 py-1.5 bg-white/5 border-b border-white/5">
                        <span className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Parameters</span>
                      </div>
                      <div className="p-3">
                        <table className="w-full text-xs">
                          <tbody>
                            {Object.entries(prof.parameters).map(([key, val], i) => (
                              <tr key={key} className={i !== 0 ? 'border-t border-white/5' : ''}>
                                <td className="py-1.5 text-[#a1a1aa] font-mono pr-2">{key}</td>
                                <td className="py-1.5 text-white text-right break-all">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
      
      <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
