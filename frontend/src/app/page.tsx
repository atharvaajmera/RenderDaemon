'use client';

import Link from 'next/link';
import { FileArrowUpIcon, FilmStripIcon, ImageIcon, SubtitlesIcon, Gif, ArrowRight, ArrowDown } from '@phosphor-icons/react';
const currentYear = new Date().getFullYear();

export default function LandingPage() {
  return (
    <div 
      className="bg-background text-on-surface font-body-md min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container" 
      style={{
        backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uiLkNweclgSdNA49eqhQQ-ZFmn2n59s4LzxIjH5NhaSFuYzF8ZTrdUZ1wDHiIajhjUjbLtj7si0iINlNF3F5R5d2QaxqsVwUBecnAam32kNupFBn7k_lSvK6EiDYut4P0os44Gnn7TWaZWLvm6Vv5Wzs5DhZQNxaJF2mIKHjd-4TTh1Drrc58YXWWD8My3AW5K3wYcDqgK3zCFlh0nKOW4OFJTi347UOuBAWI89iZYADJEmZ7J-iseK8sk')", 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundAttachment: 'fixed'
      }}
    >

      <main className="flex-grow flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16 px-gutter-mobile md:px-gutter-desktop overflow-hidden bg-cover bg-center px-4">
          {/* Overlay to ensure text readability against background */}
          <div className="relative z-10 max-w-container-max-width w-full flex flex-col items-center text-center space-y-8 mt-12 glass-panel p-8 md:p-16 rounded-[40px] bg-surface-dim/40">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary-container/30 bg-secondary-container/10 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_theme('colors.secondary-container')] animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-secondary-container">System V2.4 is Live</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl md:text-[64px] md:leading-[72px] text-on-surface max-w-4xl tracking-tighter">
              Render, transform, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary-container">automate</span> media workflows.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              One upload. Infinite outputs. Production-ready assets in seconds. The sophisticated framework for modern creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
              <Link href="/create" className="bg-gradient-to-r from-primary-container to-inverse-primary text-white font-label-sm text-label-sm px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(138,43,226,0.4)] hover:shadow-[0_0_30px_rgba(138,43,226,0.6)] transition-all transform hover:-translate-y-1 uppercase tracking-wider text-center">
                Start Creating
              </Link>
              <Link href="/config" className="glass-panel text-on-surface hover:bg-white/5 font-label-sm text-label-sm px-8 py-4 rounded-xl transition-all uppercase tracking-wider text-center">
                Explore Templates
              </Link>
            </div>
          </div>
        </section>

        {/* Visual Value Prop Section: One Upload -> Multi-Output */}
        <section className="w-full max-w-container-max-width mx-auto py-24 px-gutter-mobile md:px-gutter-desktop flex flex-col items-center relative">
          <div className="text-center mb-16">
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">One Upload → Multi-Output</h3>
            <p className="font-body-md text-body-md max-w-xl mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-white">Upload your master file once, and let the daemon generate every format your project demands instantly.</p>
          </div>
          <div className="relative w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            {/* Central Source */}
            <div className="relative z-10 glass-panel p-8 rounded-3xl flex flex-col items-center gap-4 w-48 bg-surface-container-highest/40 glow-border">
              <div className="w-20 h-20 rounded-full bg-primary-container/30 flex items-center justify-center">
                <FileArrowUpIcon size={36} className="text-primary" weight="fill" />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase text-center">Original Upload</span>
            </div>
            
            {/* Connection Visual (Arrow for mobile/desktop) */}
            <div className="md:hidden">
              <ArrowDown size={36} className="text-secondary-container" />
            </div>
            <div className="hidden md:block">
              <ArrowRight size={48} className="text-secondary-container" />
            </div>
            
            {/* Outputs Cluster */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 hover:bg-surface-variant/40 transition-all transform hover:scale-105">
                <FilmStripIcon size={24} className="text-secondary-container" />
                <span className="font-label-sm text-label-sm text-on-surface">Compressed Video</span>
              </div>
              <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 hover:bg-surface-variant/40 transition-all transform hover:scale-105">
                <ImageIcon size={24} className="text-primary" />
                <span className="font-label-sm text-label-sm text-on-surface">Thumbnail Pack</span>
              </div>
              <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 hover:bg-surface-variant/40 transition-all transform hover:scale-105">
                <SubtitlesIcon size={24} className="text-tertiary" />
                <span className="font-label-sm text-label-sm text-on-surface">Subtitle Version</span>
              </div>
              <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 hover:bg-surface-variant/40 transition-all transform hover:scale-105">
                <Gif size={24} className="text-secondary-container" />
                <span className="font-label-sm text-label-sm text-on-surface">Preview GIF</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/10 py-8 text-center mt-12 bg-transparent backdrop-blur-md">
        <p className="font-label-sm text-label-sm text-on-surface-variant">© {currentYear} RenderDaemon.</p>
      </footer>
    </div>
  );
}
