import { useEffect, useRef, useState } from 'react';
import './TemplateCarousel.css';

export default function TemplateCarousel() {
  const rootRef = useRef(null);
  const instanceRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    let disposed = false;
    let sizeObserver;
    let fitObserver;

    // Load the supplied library and content only when Ensign is first selected.
    async function mount() {
      try {
        const [{ createTemplateCarousel }, { TEMPLATES }] = await Promise.all([
          import('./templateCarousel.js'), import('./templates.data.js'),
        ]);
        if (disposed || !root.isConnected) return;
        if (root.clientWidth === 0) {
          sizeObserver = new ResizeObserver(() => {
            if (root.clientWidth > 0) {
              sizeObserver.disconnect();
              mount();
            }
          });
          sizeObserver.observe(root);
          return;
        }
        instanceRef.current = createTemplateCarousel(root, {
          templates: TEMPLATES,
          height: 340,
          onChange: (_template, index) => {
            const slides = root.querySelectorAll('.tc-slide');
            slides.forEach((slide, position) => {
              slide.dataset.stack = position === index ? 'current'
                : position === (index - 1 + slides.length) % slides.length ? 'previous'
                : position === (index + 1) % slides.length ? 'next' : 'hidden';
            });
          },
        });

        // The user approved a smaller preview to retain every inline control in
        // the fixed desktop viewport. The supplied carousel and data stay intact.
        const slot = root.parentElement;
        const viewport = root.querySelector('.tc-viewport');
        const bar = root.querySelector('.tc-bar');
        const fit = () => {
          if (root.closest('.layout-mobile')) {
            root.style.setProperty('--tc-h', '340px');
            return;
          }
          const rootBounds = root.getBoundingClientRect();
          const available = slot.clientHeight;
          const controls = bar.getBoundingClientRect().bottom - rootBounds.top - viewport.clientHeight;
          const height = Math.max(180, Math.min(340, available - controls - 8));
          root.style.setProperty('--tc-h', `${Math.floor(height)}px`);
        };
        fitObserver = new ResizeObserver(fit);
        [slot, bar].forEach(element => fitObserver.observe(element));
        fit();
      } catch (error) {
        console.error('Failed to mount Ensign template carousel:', error);
        if (!disposed) setLoadError(true);
      }
    }
    mount();

    return () => {
      disposed = true;
      sizeObserver?.disconnect();
      fitObserver?.disconnect();
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div className="projects-template-library">
      <div className="projects-template-carousel" ref={rootRef} />
      {loadError && <p role="status">Templates could not load. Refresh to try again.</p>}
    </div>
  );
}
