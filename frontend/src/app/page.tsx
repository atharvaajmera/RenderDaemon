'use client';

import Link from 'next/link';
import { FileArrowUp, FilmStrip, Image as ImageIcon, Subtitles, Gif } from '@phosphor-icons/react';

export default function LandingPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflowX: 'hidden',
      backgroundImage: `url('/vibrant-mesh-bg.png')`,
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white'
    }}>
       {/* Landing Page specific header */}
       <header style={{ 
          padding: '1.5rem 2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
       }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem' }}>
            <span style={{ color: 'white' }}>RenderDaemon</span>
          </div>
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
             <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login</Link>
             <Link href="/create" style={{ 
               padding: '0.5rem 1rem', 
               background: 'var(--color-cyan)', 
               color: '#002022', 
               borderRadius: '8px', 
               textDecoration: 'none', 
               fontSize: '0.875rem', 
               fontWeight: 600,
               textTransform: 'uppercase',
               letterSpacing: '0.05em'
             }}>
               Start Rendering
             </Link>
          </nav>
       </header>

       <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Hero Section */}
          <section style={{ 
            position: 'relative', 
            width: '100%', 
            minHeight: '90vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '6rem 2rem 4rem',
            overflow: 'hidden'
          }}>
            {/* Gradient transition overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(19,19,19,0.4), rgba(19,19,19,0.8))', zIndex: 0 }} />
            
            {/* Decorative floating pills */}
            <div className="floating-pill" style={{ top: '25%', left: '10%', width: '128px', height: '40px', transform: 'rotate(30deg)', animationDuration: '4s' }} />
            <div className="floating-pill" style={{ bottom: '33%', right: '15%', width: '96px', height: '32px', transform: 'rotate(-15deg)', animationDuration: '5s' }} />
            <div className="floating-pill" style={{ top: '33%', right: '10%', width: '64px', height: '24px', transform: 'rotate(45deg)', animationDuration: '6s' }} />

            <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2rem' }}>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 1rem', borderRadius: '999px', border: '1px solid rgba(0,238,252,0.5)', background: 'rgba(0,238,252,0.2)', backdropFilter: 'blur(12px)', boxShadow: '0 0 10px rgba(0,238,252,0.3)' }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-cyan)', boxShadow: '0 0 8px var(--color-cyan)', animation: 'pulse 2s infinite' }} />
                 <span className="mono-text" style={{ fontSize: '0.875rem', color: 'white' }}>System V2.4 is Live</span>
              </div>

              <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.1, maxWidth: '900px', letterSpacing: '-0.02em', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                Render, transform, and <span style={{ background: 'linear-gradient(to right, var(--color-cyan), #7df4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>automate</span> media workflows.
              </h2>
              
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                One upload. Infinite outputs. Production-ready assets in seconds. The sophisticated framework for modern creators.
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                 <Link href="/create" style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   padding: '1rem 2rem', 
                   background: 'rgba(0,0,0,0.4)', 
                   border: '1px solid var(--color-cyan)', 
                   color: 'var(--color-cyan)', 
                   borderRadius: '12px', 
                   fontSize: '0.875rem', 
                   fontWeight: 600, 
                   textTransform: 'uppercase', 
                   letterSpacing: '0.05em',
                   textDecoration: 'none', 
                   backdropFilter: 'blur(12px)',
                   boxShadow: '0 0 20px rgba(0,238,252,0.4)', 
                   transition: 'all 0.2s' 
                 }} className="btn-hover-cyan">
                   Start Creating
                 </Link>
                 <Link href="/config" style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   padding: '1rem 2rem', 
                   background: 'rgba(255,255,255,0.1)', 
                   border: '1px solid rgba(255,255,255,0.2)', 
                   color: 'white', 
                   borderRadius: '12px', 
                   fontSize: '0.875rem', 
                   fontWeight: 600, 
                   textTransform: 'uppercase', 
                   letterSpacing: '0.05em',
                   textDecoration: 'none', 
                   backdropFilter: 'blur(12px)',
                   transition: 'all 0.2s' 
                 }} className="btn-hover-glass">
                   Explore Templates
                 </Link>
              </div>
            </div>
          </section>

          {/* Value Prop Section */}
          <section style={{ 
            width: '100%', 
            maxWidth: '1280px', 
            padding: '6rem 2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative',
            zIndex: 10,
            background: 'rgba(16, 16, 20, 0.2)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '2rem',
            marginBottom: '4rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>One Upload → Multi-Output</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                Upload your master file once, and let the daemon generate every format your project demands instantly.
              </p>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
              
              {/* Central Source */}
              <div style={{ position: 'relative', zIndex: 10, background: 'rgba(53, 53, 52, 0.5)', backdropFilter: 'blur(12px)', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(0,238,252,0.5)', boxShadow: '0 0 20px rgba(0,238,252,0.2)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,238,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileArrowUp size={32} color="var(--color-cyan)" weight="fill" />
                </div>
                <span className="mono-text" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Original Upload</span>
              </div>

              {/* Outputs Cluster */}
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '280px', margin: '0 auto' }} className="outputs-cluster">
                
                <div className="output-item">
                  <FilmStrip size={24} color="var(--color-cyan)" />
                  <span className="mono-text" style={{ fontSize: '0.75rem' }}>Compressed Video</span>
                </div>
                
                <div className="output-item">
                  <ImageIcon size={24} color="#00dbe9" />
                  <span className="mono-text" style={{ fontSize: '0.75rem' }}>Thumbnail Pack</span>
                </div>
                
                <div className="output-item">
                  <Subtitles size={24} color="var(--color-cyan)" />
                  <span className="mono-text" style={{ fontSize: '0.75rem' }}>Subtitle Version</span>
                </div>
                
                <div className="output-item">
                  <Gif size={24} color="#00dbe9" />
                  <span className="mono-text" style={{ fontSize: '0.75rem' }}>Preview GIF</span>
                </div>
              </div>
            </div>
          </section>
       </main>
       
       <footer style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '2rem', textAlign: 'center', background: '#0e0e0e' }}>
          <p className="mono-text" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>© 2026 RenderDaemon. Professional Media Automation.</p>
       </footer>

       <style>{`
         @keyframes pulse {
           0% { opacity: 0.5; box-shadow: 0 0 0 0 rgba(0, 238, 252, 0.4); }
           70% { opacity: 1; box-shadow: 0 0 0 10px rgba(0, 238, 252, 0); }
           100% { opacity: 0.5; box-shadow: 0 0 0 0 rgba(0, 238, 252, 0); }
         }
         @keyframes float-pulse {
           0% { opacity: 0.6; transform: scale(0.95) rotate(var(--rot)); }
           50% { opacity: 1; transform: scale(1.05) rotate(var(--rot)); }
           100% { opacity: 0.6; transform: scale(0.95) rotate(var(--rot)); }
         }
         .floating-pill {
           position: absolute;
           background: linear-gradient(135deg, rgba(0, 240, 255, 0.4), rgba(138, 43, 226, 0.4));
           filter: blur(20px);
           border-radius: 999px;
           z-index: 0;
           animation-name: float-pulse;
           animation-iteration-count: infinite;
           animation-timing-function: ease-in-out;
         }
         
         .btn-hover-cyan:hover {
           transform: translateY(-2px);
           box-shadow: 0 0 30px rgba(0,238,252,0.6) !important;
           background: rgba(0,238,252,0.1) !important;
         }
         .btn-hover-glass:hover {
           background: rgba(255,255,255,0.2) !important;
         }

         .output-item {
           background: rgba(26, 26, 26, 0.6);
           backdrop-filter: blur(12px);
           border: 1px solid rgba(255,255,255,0.1);
           padding: 0.75rem 1rem;
           border-radius: 12px;
           display: flex;
           align-items: center;
           gap: 1rem;
           transition: all 0.3s ease;
           cursor: default;
         }
         .output-item:hover {
           background: rgba(53, 53, 52, 0.8);
           border-color: rgba(0,238,252,0.5);
           transform: translateX(-8px);
         }
         
         @media (min-width: 768px) {
           .outputs-cluster {
             margin: 0;
           }
         }
       `}</style>
    </div>
  );
}
