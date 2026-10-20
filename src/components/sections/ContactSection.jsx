import { useEffect, useState } from 'react';
import { contactLinks } from '../../data/portfolio';
import { BOARD_MESSAGE, boardLayout, HOVER_SPAN, hoverCell } from '../../particles/boardTarget.js';
import './ContactSection.css';

const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

function useBoardLayout() {
  const [layout, setLayout] = useState(() => boardLayout({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    const update = () => setLayout(boardLayout({ width: window.innerWidth, height: window.innerHeight }));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return layout;
}

// The board's dots are the shared particles (boardTarget.js). This page lays a
// transparent layer exactly over them to track the pointer, snaps the hover block to
// the letter grid, and tells the particles which cells to glitch.
export default function ContactSection({ onBoardHover }) {
  const layout = useBoardLayout();
  const [cell, setCell] = useState(null);

  useEffect(() => () => onBoardHover?.({ on: false }), [onBoardHover]);

  function track(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const [col, row] = hoverCell(layout,
      Math.floor((event.clientX - bounds.left) / layout.cellW),
      Math.floor((event.clientY - bounds.top) / layout.cellH));
    if (cell?.[0] === col && cell?.[1] === row) return;
    setCell([col, row]);
    onBoardHover?.({ col, row, on: true });
  }

  function release(event) {
    if (event.type === 'pointerup' && event.pointerType !== 'touch') return;
    setCell(null);
    onBoardHover?.({ on: false });
  }

  const boardStyle = {
    '--board-x': `${layout.left}px`,
    '--board-y': `${layout.top}px`,
    '--board-w': `${layout.width}px`,
    '--board-h': `${layout.height}px`,
  };

  return (
    <div className="contact-composition board-composition" style={boardStyle}>
      <div className="state-introduction board-introduction">
        <p className="eyebrow">Start a conversation</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Contact</h1>
      </div>
      <div
        className="board"
        role="img"
        aria-label={`A board of dotted letters. Lit letters spell: ${BOARD_MESSAGE.join(' ').toLowerCase()}`}
        onPointerMove={track}
        onPointerDown={track}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
      >
        {cell && (
          <span
            className="board-block"
            aria-hidden="true"
            style={{
              left: `${(cell[0] - (HOVER_SPAN[0] - 1) / 2) * layout.cellW}px`,
              top: `${(cell[1] - (HOVER_SPAN[1] - 1) / 2) * layout.cellH}px`,
              width: `${HOVER_SPAN[0] * layout.cellW}px`,
              height: `${HOVER_SPAN[1] * layout.cellH}px`,
            }}
          />
        )}
      </div>
      <ul className="board-links">
        {contactLinks.map((link, index) => (
          <li className={`board-link board-link-${corners[index]}`} key={link.label}>
            <a href={link.href} download={link.download}>
              <span className="board-link-label">{link.label}</span>
              <span className="board-link-value">{link.value}<span className="board-link-arrow" aria-hidden="true">↗</span></span>
            </a>
          </li>
        ))}
      </ul>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
