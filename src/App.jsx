import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import ParticleBoundary from './components/ParticleBoundary';
import HomeSection from './components/sections/HomeSection';
import AboutSection from './components/sections/AboutSection';
import ProjectsSection from './components/sections/ProjectsSection';
import JourneySection from './components/sections/JourneySection';
import SkillsSection from './components/sections/SkillsSection';
import ContactSection from './components/sections/ContactSection';
import { useSectionRoute } from './hooks/useSectionRoute';
import { useMotionPreferences } from './hooks/useMotionPreferences';
import { useMobileLayout } from './hooks/useMobileLayout';

const ParticleStage = lazy(() => import('./components/ParticleStage'));
const sections = {
  home: HomeSection,
  about: AboutSection,
  projects: ProjectsSection,
  journey: JourneySection,
  skills: SkillsSection,
  contact: ContactSection,
};

export default function App() {
  const mainRef = useRef(null);
  const contentRef = useRef(null);
  const mobileLayout = useMobileLayout();
  const { section, onNavigate, navigate } = useSectionRoute({
    mainRef,
    contentRef,
    restoreScroll: mobileLayout,
  });
  const systemReducedMotion = useMotionPreferences();
  const [motionEnabled, setMotionEnabled] = useState(false);
  const reducedMotion = systemReducedMotion && !motionEnabled;
  const [motionPaused, setMotionPaused] = useState(false);
  const [rendererMode, setRendererMode] = useState('static');
  const animated = rendererMode === 'webgl' || rendererMode === 'canvas';
  const Section = sections[section];

  useEffect(() => {
    const label = section === 'home' ? 'Software & Automation' : section[0].toUpperCase() + section.slice(1);
    document.title = `Eduardo Villanueva — ${label}`;
  }, [section]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key !== 'Escape' || event.defaultPrevented ||
        event.target.closest('input, textarea, select, [contenteditable], dialog, video')) return;
      navigate('home');
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [navigate]);

  function skipToContent(event) {
    event.preventDefault();
    mainRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className={`portfolio-shell state-${section} layout-${mobileLayout ? 'mobile' : 'desktop'}${motionEnabled ? ' motion-enabled' : ''}`}>
      <a className="skip-link" href="#main-content" onClick={skipToContent}>Skip to content</a>
      <Header section={section} onNavigate={onNavigate} />
      <main id="main-content" className="portfolio-main" ref={mainRef} tabIndex={-1}>
        <div className="visual-region" aria-hidden="true">
          <ParticleBoundary>
            <Suspense fallback={<div className="particle-loading" />}>
              <ParticleStage
                section={section}
                reducedMotion={reducedMotion}
                motionPaused={motionPaused}
                onRendererChange={setRendererMode}
              />
            </Suspense>
          </ParticleBoundary>
        </div>
        <section
          className="presentation-state"
          id={section}
          aria-labelledby="section-heading"
          ref={contentRef}
          tabIndex={-1}
          onClick={onNavigate}
        >
          <Section />
        </section>
      </main>
      <footer className="site-footer">
        <span className="footer-location"><span className="status-dot" aria-hidden="true" /><span className="footer-location-full">Salt Lake City, Utah</span><span className="footer-location-compact">Salt Lake City</span></span>
        <button
          type="button"
          className="motion-toggle"
          aria-pressed={animated && !reducedMotion ? motionPaused : undefined}
          disabled={!reducedMotion && !animated}
          title={reducedMotion ? 'Your system prefers reduced motion. Enable animation for this visit.' : undefined}
          onClick={() => reducedMotion ? setMotionEnabled(true) : setMotionPaused((paused) => !paused)}
        >
          <span className="motion-indicator" aria-hidden="true" />
          {reducedMotion ? 'Enable motion' : !animated ? 'Static view' : motionPaused ? 'Resume motion' : 'Pause motion'}
        </button>
      </footer>
    </div>
  );
}
