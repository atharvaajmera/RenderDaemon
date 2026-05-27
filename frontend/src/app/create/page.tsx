'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, getWorkflows, uploadFile, submitJob, Profile, Workflow, OPERATION_META } from '@/lib/api';
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
        dynamic_text: { top: '', bottom: '' }, 
      });
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
        case 'video': return <FileVideo size={20} className="text-secondary-container" />;
        case 'audio': return <FileAudio size={20} className="text-primary" />;
        case 'image': return <ImageIcon size={20} className="text-tertiary" />;
        case 'gif': return <MagicWand size={20} className="text-primary-container" />;
        default: return <FilmStrip size={20} className="text-on-surface-variant" />;
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

  const isReady = uploadedFilePath && selectedTemplate && !isSubmitting;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0F0F0F] px-4 py-8">

      {/* Page Wrapper */}
      <div
        className="w-full max-w-[1280px] flex flex-col rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative pb-12"
        style={{
          backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uiLkNweclgSdNA49eqhQQ-ZFmn2n59s4LzxIjH5NhaSFuYzF8ZTrdUZ1wDHiIajhjUjbLtj7si0iINlNF3F5R5d2QaxqsVwUBecnAam32kNupFBn7k_lSvK6EiDYut4P0os44Gnn7TWaZWLvm6Vv5Wzs5DhZQNxaJF2mIKHjd-4TTh1Drrc58YXWWD8My3AW5K3wYcDqgK3zCFlh0nKOW4OFJTi347UOuBAWI89iZYADJEmZ7J-iseK8sk')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >

        {/* Page Header */}
        <div className="w-full px-6 md:px-12 pt-10 pb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <FilmStrip size={32} className="text-primary-container" weight="duotone" />
            Create Masterpiece
          </h2>
          <p className="text-on-surface-variant mt-2 text-base max-w-xl">
            Upload your raw video, select your goal, and let the daemon generate all required outputs.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 md:mx-12 mb-6 glass-panel !border-status-error/30 rounded-2xl px-6 py-4">
            <span className="text-status-error font-semibold text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-6 md:px-12">

          {/* Step 1: Upload */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container/15 text-secondary-container text-xs font-bold">1</span>
              Source Media
            </h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploadedFilePath && !isUploading && fileInputRef.current?.click()}
              className={`glass-panel rounded-2xl p-8 md:p-12 flex flex-col items-center gap-4 text-center transition-all cursor-pointer ${
                isDragging
                  ? '!border-secondary-container/60 !bg-secondary-container/5'
                  : uploadedFilePath
                    ? '!border-status-success/30 cursor-default'
                    : 'hover:!border-white/20'
              }`}
            >
              <input 
                type="file" 
                accept="video/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />

              {isUploading ? (
                <>
                  <CircleNotch size={48} className="text-secondary-container animate-spin" />
                  <span className="text-secondary-container font-semibold">Ingesting Media...</span>
                </>
              ) : uploadedFilePath ? (
                <>
                  <div className="relative">
                    <FilmStrip size={48} className="text-status-success" />
                    <CheckCircle size={20} weight="fill" className="text-status-success absolute -bottom-1 -right-1" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-status-success font-semibold text-lg">Upload Ready</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">{uploadedFilePath}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadedFilePath(null); }}
                    className="text-on-surface-variant text-sm underline hover:text-status-error transition-colors mt-1"
                  >
                    Remove &amp; Replace
                  </button>
                </>
              ) : (
                <>
                  <UploadSimple size={48} className="text-on-surface-variant" />
                  <div>
                    <span className="text-lg font-semibold text-on-surface block mb-1">Drag & Drop master video here</span>
                    <span className="text-on-surface-variant text-sm">or click to browse local files</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Step 2: Choose Goal */}
          <section className={`transition-opacity duration-300 ${uploadedFilePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container/20 text-primary-container text-xs font-bold">2</span>
              Select Goal
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workflows.map(wf => {
                const isSelected = selectedTemplate === wf.id;
                return (
                  <div 
                    key={wf.id}
                    onClick={() => uploadedFilePath && setSelectedTemplate(wf.id)}
                    className={`glass-panel rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden group ${
                      isSelected
                        ? '!border-secondary-container/50 !bg-secondary-container/10 shadow-[0_0_20px_rgba(0,238,252,0.1)]'
                        : 'hover:!border-white/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-secondary-container" />
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <Stack size={22} className={isSelected ? 'text-secondary-container' : 'text-on-surface-variant'} />
                      <h4 className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-on-surface'}`}>{wf.name}</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{wf.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 3: Expected Outputs Preview */}
          {selectedTemplate && expectedOutputs.length > 0 && (
            <section className="animate-[fadeIn_0.3s_ease]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-status-success/15 text-status-success text-xs font-bold">3</span>
                Expected Outputs
              </h3>
              <div className="glass-panel glow-border rounded-2xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {expectedOutputs.map((output, idx) => (
                    <div key={idx} className="flex items-center gap-3 glass-panel !bg-white/5 rounded-xl px-4 py-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {output.icon}
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface">{output.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Submit */}
          <div className="flex justify-end mt-2 pb-2">
            <button 
              type="submit"
              disabled={!isReady}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all ${
                isReady
                  ? 'bg-gradient-to-r from-primary-container to-inverse-primary text-white shadow-[0_0_20px_rgba(138,43,226,0.4)] hover:shadow-[0_0_30px_rgba(138,43,226,0.6)] hover:-translate-y-0.5'
                  : 'bg-white/5 text-on-surface-variant border border-transparent cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={22} className="animate-spin" />
                  Submitting Pipeline...
                </>
              ) : (
                <>
                  <PaperPlaneRight size={22} weight="bold" />
                  Render Outputs
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
