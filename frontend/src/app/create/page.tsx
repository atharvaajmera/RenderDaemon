'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, getWorkflows, uploadFile, submitJob, Profile, Workflow } from '@/lib/api';
import { Card } from '@/components/Card';
import { UploadSimple, FilmStrip, PaperPlaneRight, CircleNotch } from '@phosphor-icons/react';

export default function CreateJobPage() {
  const router = useRouter();

  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  
  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  
  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const [p, w] = await Promise.all([getProfiles(), getWorkflows()]);
        setProfiles(p);
        setWorkflows(w);
      } catch (err: any) {
        setError("Failed to load templates: " + err.message);
      }
    }
    loadTemplates();
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadFile(file);
      setUploadedFilePath(res.tempFilePath);
    } catch (err: any) {
      setError("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFilePath) {
      setError("Please upload a video file first.");
      return;
    }
    if (!selectedTemplate) {
      setError("Please select a template.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await submitJob({
        template: selectedTemplate,
        inputs: {
          inputPath: uploadedFilePath,
          topText: topText,
          bottomText: bottomText
        }
      });
      // Redirect to the job tracking page
      router.push(`/job/${res.jobId}`);
    } catch (err: any) {
      setError("Failed to submit job: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FilmStrip color="var(--color-purple)" /> Create Masterpiece
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Upload your raw video, select a rendering template, and let the daemon do the heavy lifting.
        </p>
      </div>

      {error && (
        <Card>
          <div style={{ color: 'var(--color-error)', fontWeight: 600 }}>{error}</div>
        </Card>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Step 1: Upload */}
        <Card>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>1. Upload Video</h3>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploadedFilePath && !isUploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-cyan)' : 'var(--color-border)'}`,
              borderRadius: '8px',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: isDragging ? 'rgba(0, 240, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
              cursor: (uploadedFilePath || isUploading) ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <input 
              type="file" 
              accept="video/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />

            {isUploading ? (
              <>
                <CircleNotch size={48} color="var(--color-cyan)" className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>Uploading to Temp Storage...</span>
              </>
            ) : uploadedFilePath ? (
              <>
                <FilmStrip size={48} color="var(--color-success)" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '1.125rem' }}>Upload Complete</span>
                  <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{uploadedFilePath}</span>
                </div>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setUploadedFilePath(null); }}
                  style={{ marginTop: '0.5rem', color: 'var(--color-error)', fontSize: '0.875rem', textDecoration: 'underline' }}
                >
                  Remove & Replace
                </button>
              </>
            ) : (
              <>
                <UploadSimple size={48} color="var(--color-text-muted)" />
                <div>
                  <span style={{ fontSize: '1.125rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Drag & Drop your video here</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>or click to browse from your computer</span>
                </div>
              </>
            )}
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </Card>

        {/* Step 2: Configuration */}
        <Card>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>2. Job Configuration</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Select Template</label>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-border)',
                  color: 'white',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="">-- Choose a workflow or profile --</option>
                <optgroup label="Workflows">
                  {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </optgroup>
                <optgroup label="Atomic Profiles">
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Top Overlay Text (Optional)</label>
              <input 
                type="text" 
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="e.g. BREAKING NEWS"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-border)',
                  color: 'white',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Bottom Overlay Text (Optional)</label>
              <input 
                type="text" 
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="e.g. Subscribe for more!"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-border)',
                  color: 'white',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit"
            disabled={!uploadedFilePath || !selectedTemplate || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              backgroundColor: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'var(--color-bg-surface)' : 'var(--color-purple)',
              color: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'var(--color-text-muted)' : 'white',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: 600,
              border: `1px solid ${(!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'var(--color-border)' : 'var(--color-purple)'}`,
              cursor: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'none' : '0 4px 14px 0 rgba(138, 43, 226, 0.39)'
            }}
          >
            {isSubmitting ? (
              <>
                <CircleNotch size={24} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                Submitting...
              </>
            ) : (
              <>
                <PaperPlaneRight weight="bold" />
                Dispatch to Queue
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
