import { useEffect, useRef, useState } from 'react';
import { SECTION_NAV } from '../lib/sections';

export default function Header({ section, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 901px)');
    const close = () => setMenuOpen(false);
    wide.addEventListener('change', close);
    return () => wide.removeEventListener('change', close);
  }, []);

  function select(event) {
    const anchor = event.target.closest('a');
    if (!anchor) return;
    onNavigate(event);
    if (event.defaultPrevented) {
      setMenuOpen(false);
      if (anchor.hash === `#${section}`) menuButton.current?.focus();
    }
  }

  function handleKey(event) {
    if (event.key === 'Escape' && menuOpen) {
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      menuButton.current?.focus();
    }
  }

  const links = SECTION_NAV.map(({ id, label, href }) => (
    <a className="nav-link" href={href} key={id} aria-current={section === id ? 'page' : undefined}>{label}</a>
  ));

  return (
    <header className="site-header" onKeyDown={handleKey}>
      <nav aria-label="Main navigation" className="standard-nav" onClick={onNavigate}>{links}</nav>
      <button className="menu-toggle" type="button" ref={menuButton}
        aria-expanded={menuOpen} aria-controls="compact-navigation"
        onClick={() => setMenuOpen(open => !open)}>
        {menuOpen ? 'Close' : 'Menu'}<span aria-hidden="true">{menuOpen ? '−' : '+'}</span>
      </button>
      <nav id="compact-navigation" aria-label="Compact navigation" className="compact-nav"
        hidden={!menuOpen} onClick={select}>{links}</nav>
              <a className="identity" href="#home" onClick={onNavigate} aria-label="Eduardo Villanueva, Home">
        <span className="identity-mark" aria-hidden="true">EdViCo</span>
      </a>
    </header>
  );
}
