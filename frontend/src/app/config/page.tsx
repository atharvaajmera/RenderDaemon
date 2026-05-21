'use client';

import React, { useState, useEffect } from 'react';
import { getProfiles, getWorkflows, Profile, Workflow } from '@/lib/api';
import { Card } from '@/components/Card';
import { Gear, SlidersHorizontal, Stack, TreeStructure } from '@phosphor-icons/react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gear color="var(--color-purple)" /> Configuration Manager
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Manage your rendering templates. Profiles define single rendering steps (like transcoding or audio extraction). 
          Workflows chain multiple profiles together into complex pipelines.
        </p>
      </div>

      {error && (
        <Card>
          <div style={{ color: 'var(--color-error)' }}>Failed to load configuration: {error}</div>
        </Card>
      )}

      {loading ? (
        <div className="scanner-bar-container" style={{ height: '2px', background: 'var(--color-bg-base)', borderRadius: '2px' }}>
          <div className="scanner-bar" />
        </div>
      ) : (
        <>
          <section>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TreeStructure color="var(--color-cyan)" /> Available Workflows
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {workflows.map(wf => (
                <Card key={wf.id} className="workflow-card" glow={true}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{wf.name}</h4>
                    <span className="mono-text" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                      {wf.id}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {wf.description}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Execution Steps</h5>
                    {wf.step_groups.map((group, idx) => (
                      <div key={idx} style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(0,0,0,0.2)', 
                        borderRadius: '6px',
                        borderLeft: `2px solid ${group.parallel ? 'var(--color-cyan)' : 'var(--color-purple)'}`
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Stack /> {group.parallel ? 'Parallel Execution' : 'Sequential Step'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {group.steps.map((step, sIdx) => (
                            <span key={sIdx} className="mono-text" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--color-bg-surface)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                              {step.profile_id}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal color="var(--color-purple)" /> Atomic Profiles
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {profiles.map(prof => (
                <Card key={prof.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{prof.name}</h4>
                    <span className="mono-text" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--color-cyan)' }}>
                      {prof.operation}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {prof.description}
                  </p>
                  
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px' }}>
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>PARAMETERS</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.875rem' }}>
                      {Object.entries(prof.parameters).map(([key, val]) => (
                        <React.Fragment key={key}>
                          <span className="mono-text" style={{ color: 'var(--color-text-secondary)' }}>{key}:</span>
                          <span className="mono-text" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
