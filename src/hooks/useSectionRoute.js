import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  SECTION_IDS,
  canonicalSectionHash,
  parseSectionHash,
  sectionLinkTarget,
  sectionUrl,
} from '../lib/sections';

const HISTORY_KEY = '__portfolioRoute';
let entryCount = 0;

function entryKey() {
  return `portfolio-${Date.now().toString(36)}-${++entryCount}`;
}

function ownedState(key, section) {
  const previous = window.history.state;
  return {
    ...(previous && typeof previous === 'object' ? previous : {}),
    [HISTORY_KEY]: { key, section },
  };
}

function panelScrolls(element) {
  return element && /^(auto|scroll)$/.test(window.getComputedStyle(element).overflowY);
}

function capturePosition(content, saveScroll) {
  const focus = document.activeElement;
  const snapshot = {
    focus: focus instanceof HTMLElement && focus !== document.body &&
      focus !== document.documentElement ? {
      element: focus,
      id: focus.id,
      key: focus.getAttribute('data-focus-key'),
      href: focus.tagName === 'A' ? focus.getAttribute('href') : null,
    } : null,
  };
  if (!saveScroll) return snapshot;
  return {
    ...snapshot,
    mode: panelScrolls(content) ? 'panel' : 'document',
    documentX: window.scrollX,
    documentY: window.scrollY,
    panelX: content?.scrollLeft ?? 0,
    panelY: content?.scrollTop ?? 0,
    contentOffset: Math.max(0, -(content?.getBoundingClientRect().top ?? 0)),
  };
}

function isVisible(element, content) {
  if (!element?.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight ||
    rect.right <= 0 || rect.left >= window.innerWidth) return false;
  if (content?.contains(element) && panelScrolls(content)) {
    const panel = content.getBoundingClientRect();
    if (rect.bottom <= panel.top || rect.top >= panel.bottom) return false;
  }
  return true;
}

function restoreFocus(snapshot, main, content) {
  const saved = snapshot?.focus;
  let target = saved?.element;
  if (!isVisible(target, content) && saved?.id) target = document.getElementById(saved.id);
  if (!isVisible(target, content) && saved?.key) {
    target = [...(main?.querySelectorAll('[data-focus-key]') ?? [])]
      .find((element) => element.getAttribute('data-focus-key') === saved.key);
  }
  if (!isVisible(target, content) && saved?.href) {
    target = [...(main?.querySelectorAll('a[href]') ?? [])]
      .find((element) => element.getAttribute('href') === saved.href);
  }
  (isVisible(target, content) ? target : content ?? main)?.focus({ preventScroll: true });
}

function restorePosition(snapshot, content) {
  if (panelScrolls(content)) {
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    content.scrollTo({
      left: snapshot?.mode === 'panel' ? snapshot.panelX : 0,
      top: snapshot?.mode === 'panel' ? snapshot.panelY : snapshot?.contentOffset ?? 0,
      behavior: 'instant',
    });
  } else {
    if (content) {
      content.scrollTop = 0;
      content.scrollLeft = 0;
    }
    const fromPanel = snapshot?.mode === 'panel';
    const top = fromPanel && snapshot.panelY > 0
      ? window.scrollY + (content?.getBoundingClientRect().top ?? 0) + snapshot.panelY
      : fromPanel ? 0 : snapshot?.documentY ?? 0;
    window.scrollTo({
      left: fromPanel ? 0 : snapshot?.documentX ?? 0,
      top,
      behavior: 'instant',
    });
  }
}

/**
 * Attach contentRef to the active, focusable section and mainRef to <main>.
 * Each active section supplies id="section-heading" on a heading with tabIndex=-1.
 * onNavigate works both directly on an anchor and as a delegated content handler.
 * supportedSections restricts both initial hashes and clickable section routes.
 * restoreScroll=false leaves browser scroll behavior alone while preserving focus.
 */
export function useSectionRoute({
  mainRef,
  contentRef,
  supportedSections = SECTION_IDS,
  restoreScroll = true,
}) {
  const supportedKey = SECTION_IDS
    .filter((section) => section === 'home' || supportedSections.includes(section)).join('|');
  const supported = useMemo(() => supportedKey.split('|'), [supportedKey]);
  const [route, setRoute] = useState(() => ({
    section: parseSectionHash(window.location.hash, supported),
    key: null,
    kind: 'initial',
  }));
  const active = useRef(route);
  const positions = useRef(new Map());
  const locationSeen = useRef('');

  const savePosition = useCallback(() => {
    if (active.current.key) {
      positions.current.set(active.current.key, capturePosition(contentRef.current, restoreScroll));
    }
  }, [contentRef, restoreScroll]);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    if (restoreScroll) window.history.scrollRestoration = 'manual';

    const acceptLocation = (kind) => {
      const section = parseSectionHash(window.location.hash, supported);
      const canonical = canonicalSectionHash(window.location.hash, supported);
      const existing = window.history.state?.[HISTORY_KEY];
      const sameEntry = existing?.key === active.current.key;
      const normalizedUrl = `${window.location.pathname}${window.location.search}${canonical}`;
      const signature = `${existing?.key ?? ''}:${window.location.href}`;

      // A traversal emits popstate and hashchange. Commit it only once.
      if (kind !== 'initial' && signature === locationSeen.current) return;
      if (kind !== 'initial') savePosition();

      const key = existing?.key && existing.section === section &&
        !(sameEntry && kind !== 'initial')
        ? existing.key : entryKey();
      window.history.replaceState(ownedState(key, section), '', normalizedUrl);
      locationSeen.current = `${key}:${window.location.href}`;
      const next = { section, key, kind };
      active.current = next;
      setRoute(next);
    };

    const onLocation = () => acceptLocation('history');
    const onPageHide = () => savePosition();
    acceptLocation('initial');
    window.addEventListener('popstate', onLocation);
    window.addEventListener('hashchange', onLocation);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('popstate', onLocation);
      window.removeEventListener('hashchange', onLocation);
      window.removeEventListener('pagehide', onPageHide);
      if (restoreScroll) window.history.scrollRestoration = previousRestoration;
    };
  }, [savePosition, supported, restoreScroll]);

  useLayoutEffect(() => {
    if (!route.key || route.kind === 'initial') return;
    const content = contentRef.current;
    const main = mainRef.current;
    if (route.kind === 'navigate') {
      if (restoreScroll) restorePosition(null, content);
      main?.querySelector('#section-heading')?.focus({ preventScroll: true });
    } else {
      const snapshot = positions.current.get(route.key);
      if (restoreScroll) restorePosition(snapshot, content);
      restoreFocus(snapshot, main, content);
    }
  }, [route, contentRef, mainRef, restoreScroll]);

  const navigate = useCallback((section) => {
    if (!supported.includes(section) || section === active.current.section) return false;
    savePosition();
    const key = entryKey();
    window.history.pushState(ownedState(key, section), '', sectionUrl(window.location.href, section));
    locationSeen.current = `${key}:${window.location.href}`;
    const next = { section, key, kind: 'navigate' };
    active.current = next;
    setRoute(next);
    return true;
  }, [savePosition, supported]);

  const onNavigate = useCallback((event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor || anchor.hasAttribute('download') ||
      (anchor.target && anchor.target !== '_self')) return;
    const section = sectionLinkTarget(anchor.getAttribute('href'), window.location.href, supported);
    if (!section) return;
    event.preventDefault();
    navigate(section);
  }, [navigate, supported]);

  // A narrowed route set also stays safe during a live update of the prototype.
  const section = supported.includes(route.section) ? route.section : 'home';
  return { section, onNavigate, navigate };
}
