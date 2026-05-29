'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, getWorkflows, uploadFile, submitJob, Profile, Workflow, OPERATION_META } from '@/lib/api';
import { UploadSimple, FilmStrip, CircleNotch, CheckCircle, Image as ImageIcon, FileAudio, FileVideo, MagicWand, Plus, X, ArrowRight } from '@phosphor-icons/react';

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

  const expectedOutputs = useMemo(() => {
    if (!selectedTemplate) return [];
    
    const outputs: { label: string; icon: React.ReactNode; type: string }[] = [];
    
    const getIconForType = (type: string) => {
      switch(type) {
        case 'video': return <FileVideo size={20} className="text-[#3b82f6]" />;
        case 'audio': return <FileAudio size={20} className="text-[#10b981]" />;
        case 'image': return <ImageIcon size={20} className="text-[#f59e0b]" />;
        case 'gif': return <MagicWand size={20} className="text-[#8b5cf6]" />;
        default: return <FilmStrip size={20} className="text-[#a1a1aa]" />;
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
  const selectedWorkflow = workflows.find(w => w.id === selectedTemplate);

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#09090b] px-4 py-8 font-inter">
      <div className="w-full max-w-[1000px] flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Create Job</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">Configure a new rendering task.</p>
        </div>

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-4">
            <span className="text-sm text-[#f87171]">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Step 1: Upload */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-medium text-white mb-4">1. Source Media</h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !uploadedFilePath && !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-white/40 bg-white/5'
                    : uploadedFilePath
                      ? 'border-[#10b981]/30 bg-[#10b981]/5 cursor-default'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
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
                    <CircleNotch size={32} className="text-white animate-spin mb-3" />
                    <span className="text-sm font-medium text-white">Uploading file...</span>
                  </>
                ) : uploadedFilePath ? (
                  <>
                    <CheckCircle size={32} className="text-[#10b981] mb-3" weight="fill" />
                    <span className="text-sm font-medium text-white mb-1">Upload complete</span>
                    <span className="text-xs text-[#a1a1aa] font-mono">{uploadedFilePath}</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadedFilePath(null); setSelectedTemplate(''); }}
                      className="mt-4 text-xs font-medium text-[#ef4444] hover:text-[#f87171] flex items-center gap-1"
                    >
                      <X size={14} /> Remove and replace
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3">
                      <UploadSimple size={20} className="text-[#a1a1aa]" />
                    </div>
                    <span className="text-sm font-medium text-white mb-1">Click to upload</span>
                    <span className="text-xs text-[#a1a1aa]">or drag and drop video file</span>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Select Goal */}
            <div className={`bg-[#18181b] border border-white/5 rounded-xl p-6 shadow-sm transition-opacity ${uploadedFilePath ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <h3 className="text-base font-medium text-white mb-4">2. Select Template</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workflows.map(wf => (
                  <div 
                    key={wf.id}
                    onClick={() => uploadedFilePath && setSelectedTemplate(wf.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate === wf.id
                        ? 'border-white bg-white/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{wf.name}</span>
                      {selectedTemplate === wf.id && <CheckCircle size={16} className="text-white" weight="fill" />}
                    </div>
                    <p className="text-xs text-[#a1a1aa] line-clamp-2">{wf.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar / Summary */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-base font-medium text-white mb-4">Summary</h3>
              
              <div className="flex-1 flex flex-col gap-6">
                
                {/* File Info */}
                <div>
                  <span className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-2 block">Source</span>
                  {uploadedFilePath ? (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <FilmStrip size={16} className="text-[#a1a1aa]" />
                      <span className="truncate font-mono text-xs">{uploadedFilePath}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#a1a1aa] italic">No file selected</span>
                  )}
                </div>

                {/* Template Info */}
                <div>
                  <span className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-2 block">Template</span>
                  {selectedWorkflow ? (
                    <div className="text-sm text-white">{selectedWorkflow.name}</div>
                  ) : (
                    <span className="text-sm text-[#a1a1aa] italic">No template selected</span>
                  )}
                </div>

                {/* Expected Outputs */}
                <div>
                  <span className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-2 block">Expected Outputs</span>
                  {expectedOutputs.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {expectedOutputs.map((output, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-white bg-white/5 px-2 py-1.5 rounded-md border border-white/5">
                          {output.icon}
                          <span className="text-xs">{output.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-[#a1a1aa] italic">Select a template to view</span>
                  )}
                </div>

              </div>

              {/* Submit Button */}
              <div className="mt-8 pt-4 border-t border-white/5">
                <button 
                  onClick={handleSubmit}
                  disabled={!isReady}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isReady
                      ? 'bg-white text-black hover:bg-gray-200 shadow-sm'
                      : 'bg-white/5 text-[#a1a1aa] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Initialize Render
                      <ArrowRight size={16} weight="bold" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
