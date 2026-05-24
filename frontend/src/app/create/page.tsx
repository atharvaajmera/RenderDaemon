'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, getWorkflows, uploadFile, submitJob, Profile, Workflow, OPERATION_META } from '@/lib/api';
import { Card } from '@/components/Card';
import { UploadSimple, FilmStrip, PaperPlaneRight, CircleNotch, CheckCircle, Image as ImageIcon, FileAudio, FileVideo, MagicWand, Stack } from '@phosphor-icons/react';

export default function CreateJobPage() {
  const router = useRouter();

  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  
  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  
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
      setUploadedFilePath(res.path);
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
        input_video_url: uploadedFilePath,
        template_id: selectedTemplate,
        // Passing empty strings for now as they are less relevant for the pure goal-based flow.
        dynamic_text: { top: '', bottom: '' }, 
      });
      // Redirect to the job tracking page
      router.push(`/job/${res.id}`);
    } catch (err: any) {
      setError("Failed to submit job: " + err.message);
      setIsSubmitting(false);
    }
  };

  // Resolve expected outputs for preview
  const expectedOutputs = useMemo(() => {
    if (!selectedTemplate) return [];
    
    const outputs: { label: string; icon: React.ReactNode; type: string }[] = [];
    
    const getIconForType = (type: string) => {
      switch(type) {
        case 'video': return <FileVideo size={24} color="var(--color-cyan)" />;
        case 'audio': return <FileAudio size={24} color="var(--color-purple)" />;
        case 'image': return <ImageIcon size={24} color="#00dbe9" />;
        case 'gif': return <MagicWand size={24} color="#b172fa" />;
        default: return <FilmStrip size={24} />;
      }
    };

    const wf = workflows.find(w => w.id === selectedTemplate);
    if (wf) {
      wf.step_groups.forEach(group => {
        group.steps.forEach(step => {
          const prof = profiles.find(p => p.id === step.profile_id);
          const op = prof ? prof.operation : step.profile_id;
          const meta = OPERATION_META[op];
          if (meta) {
            outputs.push({ label: meta.label, icon: getIconForType(meta.outputType), type: meta.outputType });
          }
        });
      });
      return outputs;
    }

    const prof = profiles.find(p => p.id === selectedTemplate);
    if (prof) {
      const meta = OPERATION_META[prof.operation];
      if (meta) {
        outputs.push({ label: meta.label, icon: getIconForType(meta.outputType), type: meta.outputType });
      }
    }
    
    return outputs;
  }, [selectedTemplate, workflows, profiles]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FilmStrip color="var(--color-purple)" /> Create Masterpiece
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Upload your raw video, select your goal, and let the daemon generate all required outputs.
        </p>
      </div>

      {error && (
        <Card>
          <div style={{ color: 'var(--color-error)', fontWeight: 600 }}>{error}</div>
        </Card>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Step 1: Upload */}
        <section>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--color-cyan)', fontSize: '0.875rem', fontWeight: 'bold' }}>1</span>
            Source Media
          </h3>
          <Card>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploadedFilePath && !isUploading && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: isDragging ? 'rgba(0, 240, 255, 0.02)' : 'rgba(0, 0, 0, 0.2)',
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
                  <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>Ingesting Media...</span>
                </>
              ) : uploadedFilePath ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <FilmStrip size={48} color="var(--color-success)" />
                    <CheckCircle size={20} color="var(--color-bg-base)" weight="fill" style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--color-success)', borderRadius: '50%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '1.125rem' }}>Upload Ready</span>
                    <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{uploadedFilePath}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadedFilePath(null); }}
                    style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'underline', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    Remove & Replace
                  </button>
                </>
              ) : (
                <>
                  <UploadSimple size={48} color="var(--color-text-muted)" />
                  <div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Drag & Drop master video here</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>or click to browse local files</span>
                  </div>
                </>
              )}
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </Card>
        </section>

        {/* Step 2: Choose Goal */}
        <section style={{ opacity: uploadedFilePath ? 1 : 0.5, transition: 'opacity 0.3s' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--color-purple)', fontSize: '0.875rem', fontWeight: 'bold' }}>2</span>
            Select Goal
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {workflows.map(wf => (
              <div 
                key={wf.id}
                onClick={() => uploadedFilePath && setSelectedTemplate(wf.id)}
                style={{
                  background: selectedTemplate === wf.id ? 'rgba(0, 240, 255, 0.08)' : 'rgba(20, 20, 28, 0.5)',
                  border: `1px solid ${selectedTemplate === wf.id ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  cursor: uploadedFilePath ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: selectedTemplate === wf.id ? '0 0 20px rgba(0, 240, 255, 0.15)' : 'none'
                }}
                onMouseOver={(e) => {
                  if (uploadedFilePath && selectedTemplate !== wf.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (uploadedFilePath && selectedTemplate !== wf.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {selectedTemplate === wf.id && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-cyan)' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Stack size={24} color={selectedTemplate === wf.id ? 'var(--color-cyan)' : 'var(--color-text-muted)'} />
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: selectedTemplate === wf.id ? 'white' : 'var(--color-text-primary)' }}>{wf.name}</h4>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{wf.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: Expected Outputs Preview */}
        {selectedTemplate && expectedOutputs.length > 0 && (
          <section style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.1)', color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 'bold' }}>3</span>
              Expected Outputs
            </h3>
            <Card glow={true}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {expectedOutputs.map((output, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                      {output.icon}
                    </div>
                    <span className="mono-text" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{output.label}</span>
                  </div>
                ))}
              </div>
            </Card>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          </section>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            type="submit"
            disabled={!uploadedFilePath || !selectedTemplate || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2.5rem',
              background: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
              color: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'var(--color-text-muted)' : 'white',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: 700,
              border: `1px solid ${(!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'transparent' : 'rgba(255,255,255,0.2)'}`,
              cursor: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (!uploadedFilePath || !selectedTemplate || isSubmitting) ? 'none' : '0 10px 30px -10px rgba(0, 240, 255, 0.5)'
            }}
            onMouseOver={(e) => {
              if (uploadedFilePath && selectedTemplate && !isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px -10px rgba(0, 240, 255, 0.6)';
              }
            }}
            onMouseOut={(e) => {
              if (uploadedFilePath && selectedTemplate && !isSubmitting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0, 240, 255, 0.5)';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <CircleNotch size={24} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                Submitting Pipeline...
              </>
            ) : (
              <>
                <PaperPlaneRight size={24} weight="bold" />
                Render Outputs
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
