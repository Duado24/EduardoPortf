import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const debugBalloon = new URLSearchParams(window.location.search).get('debug') === 'balloon';
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
  const [displaySection, setDisplaySection] = useState(section);
  const previousSectionRef = useRef(section);
  const contentTransitionRef = useRef(null);
  const previous = previousSectionRef.current;
  const globePair = (previous === 'home' || previous === 'about') && section === 'projects' ||
    previous === 'projects' && (section === 'home' || section === 'about');
  const holdContent = previous !== section ? globePair && animated && !motionPaused && !debugBalloon : Boolean(contentTransitionRef.current);
  const visibleSection = holdContent ? displaySection : section;
  const Section = sections[visibleSection];

  const onTransitionProgress = useCallback((progress) => {
    const transition = contentTransitionRef.current;
    if (!transition) return;
    transition.progress = progress;
    if (!transition.switched && progress >= 0.24) {
      transition.switched = true;
      setDisplaySection(transition.to);
    }
    const time = Math.max(0, Math.min(1, transition.switched ? (progress - transition.revealAt) / (1 - transition.revealAt) : progress / 0.20));
    const opacity = time * time * (3 - 2 * time);
    if (contentRef.current) {
      contentRef.current.style.opacity = String(transition.switched ? opacity : transition.opacity * (1 - opacity));
      contentRef.current.inert = !transition.switched || opacity < 0.15;
    }
    if (progress >= 1) {
      contentTransitionRef.current = null;
      contentRef.current?.style.removeProperty('opacity');
      if (contentRef.current) contentRef.current.inert = false;
      if (document.activeElement === mainRef.current) {
        requestAnimationFrame(() => contentRef.current?.querySelector('#section-heading')?.focus({ preventScroll: true }));
      }
    }
  }, []);

  useLayoutEffect(() => {
    const previous = previousSectionRef.current;
    previousSectionRef.current = section;
    if (previous === section) {
      if (!animated && contentTransitionRef.current) onTransitionProgress(1);
      return;
    }
    const fromGlobe = previous === 'home' || previous === 'about';
    const toGlobe = section === 'home' || section === 'about';
    const pair = fromGlobe && section === 'projects' || previous === 'projects' && toGlobe;
    if (pair && animated && !motionPaused && !debugBalloon) {
      contentTransitionRef.current = {
        to: section, switched: false, progress: 0,
        revealAt: mobileLayout ? 0.68 : 0.34,
        opacity: Number.parseFloat(contentRef.current?.style.opacity || '1'),
      };
      if (contentRef.current?.contains(document.activeElement)) mainRef.current?.focus({ preventScroll: true });
      if (contentRef.current) contentRef.current.inert = true;
    } else {
      contentTransitionRef.current = null;
      setDisplaySection(section);
      contentRef.current?.style.removeProperty('opacity');
      if (contentRef.current) contentRef.current.inert = false;
    }
  }, [section, animated, motionPaused, debugBalloon, mobileLayout, onTransitionProgress]);

  useLayoutEffect(() => {
    const transition = contentTransitionRef.current;
    if (transition) onTransitionProgress(transition.progress);
  }, [displaySection, onTransitionProgress]);

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
    <div className={`portfolio-shell state-${section} layout-${mobileLayout ? 'mobile' : 'desktop'}${motionEnabled ? ' motion-enabled' : ''}${debugBalloon ? ' debug-balloon' : ''}`}>
      <a className="skip-link" href="#main-content" onClick={skipToContent}>Skip to content</a>
      <Header section={section} onNavigate={onNavigate} />
      <main id="main-content" className="portfolio-main" ref={mainRef} tabIndex={-1}>
        <div className="visual-region" aria-hidden="true">
          <ParticleBoundary>
            <Suspense fallback={<div className="particle-loading" />}>
              <ParticleStage
                section={debugBalloon ? 'projects' : section === 'about' ? 'home' : section}
                visualSection={debugBalloon ? 'projects' : section}
                reducedMotion={reducedMotion}
                motionPaused={debugBalloon || motionPaused}
                onRendererChange={setRendererMode}
                onTransitionProgress={onTransitionProgress}
              />
            </Suspense>
          </ParticleBoundary>
        </div>
        <section
          className={`presentation-state state-${visibleSection}`}
          id={visibleSection}
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
