'use client';

import { useEffect, useState } from 'react';
import { getProfiles, getWorkflows, getAllJobs } from '@/lib/api';
import { Card } from '@/components/Card';

export default function TestApiPage() {
  const [data, setData] = useState<any>({
    profiles: null,
    workflows: null,
    jobs: null,
    error: null,
  });

  useEffect(() => {
    async function testApi() {
      try {
        const profiles = await getProfiles();
        const workflows = await getWorkflows();
        const jobs = await getAllJobs();
        
        setData({ profiles, workflows, jobs, error: null });
      } catch (err: any) {
        setData((prev: any) => ({ ...prev, error: err.message }));
      }
    }
    testApi();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem' }}>API Connection Test</h1>
      
      {data.error ? (
        <Card>
          <h2 style={{ color: 'var(--color-error)' }}>Connection Failed</h2>
          <pre className="mono-text" style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{data.error}</pre>
        </Card>
      ) : (
        <>
          <Card>
            <h2>Profiles</h2>
            <pre className="mono-text" style={{ marginTop: '1rem' }}>{JSON.stringify(data.profiles, null, 2)}</pre>
          </Card>
          
          <Card>
            <h2>Workflows</h2>
            <pre className="mono-text" style={{ marginTop: '1rem' }}>{JSON.stringify(data.workflows, null, 2)}</pre>
          </Card>
          
          <Card>
            <h2>Jobs</h2>
            <pre className="mono-text" style={{ marginTop: '1rem' }}>{JSON.stringify(data.jobs, null, 2)}</pre>
          </Card>
        </>
      )}
    </div>
  );
}
