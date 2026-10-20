import { useRef, useState } from 'react';
import { journeyNodes } from '../../data/portfolio';
import { journeyConnections, journeyStarPositions, mobileJourneyStarPositions } from '../../data/journeyLayout';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import JourneySky from '../journey/JourneySky';

export default function JourneySection() {
  const [selectedId, setSelectedId] = useState(journeyNodes[0].id);
  const starRefs = useRef(new Map());
  const mobileLayout = useMobileLayout();
  const starPositions = mobileLayout ? mobileJourneyStarPositions : journeyStarPositions;
  const entry = journeyNodes.find((item) => item.id === selectedId);
  const selectedIndex = journeyNodes.findIndex((item) => item.id === selectedId);
  const nextId = (offset) => journeyNodes[(selectedIndex + offset + journeyNodes.length) % journeyNodes.length].id;

  function handleStarKeyDown(event, index) {
    let targetIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = (index + 1) % journeyNodes.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = (index - 1 + journeyNodes.length) % journeyNodes.length;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = journeyNodes.length - 1;
    if (targetIndex === undefined) return;

    event.preventDefault();
    const target = journeyNodes[targetIndex];
    setSelectedId(target.id);
    starRefs.current.get(target.id)?.focus();
  }

  return (
    <div className="journey-composition">
      <div className="state-introduction journey-introduction">
        <p className="eyebrow">Peru → Utah · Work, study & service</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Journey</h1>
        <p className="journey-lede">A constellation of experiences that brought me here.</p>
      </div>
      <div className="journey-constellation-scene">
        <JourneySky />
        <svg className="journey-connection-art" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {journeyConnections.map(([from, to]) => {
            const start = starPositions[from];
            const end = starPositions[to];
            const connected = from === selectedId || to === selectedId;
            return (
              <path
                key={`${from}-${to}`}
                className={connected ? 'is-connected' : ''}
                d={`M ${start.x * 10} ${start.y * 6} L ${end.x * 10} ${end.y * 6}`}
              />
            );
          })}
        </svg>
        <ol
          className="journey-milestones"
          aria-label="Personal milestones, arranged thematically rather than chronologically"
          aria-describedby="journey-keyboard-help"
        >
          {journeyNodes.map((item, index) => {
            const position = starPositions[item.id];
            const selected = entry.id === item.id;
            return (
              <li key={item.id} style={{ '--star-x': `${position.x}%`, '--star-y': `${position.y}%` }}>
                <button
                  type="button"
                  className={`journey-star journey-star--${position.labelSide}${selected ? ' is-selected' : ''}`}
                  aria-label={`${item.title}, ${item.organization}, ${item.date}`}
                  aria-pressed={selected}
                  aria-controls="journey-story"
                  tabIndex={selected ? 0 : -1}
                  ref={(element) => element ? starRefs.current.set(item.id, element) : starRefs.current.delete(item.id)}
                  onKeyDown={(event) => handleStarKeyDown(event, index)}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="journey-star-point" aria-hidden="true" />
                  <span className="journey-star-label" aria-hidden="true">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="journey-sky-caption">Southern sky, inspired by Peru · an artistic composition, not a star chart</p>
      </div>
      <label className="journey-compact-control">
        <span className="sr-only">Choose a Journey milestone</span>
        <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
          {journeyNodes.map(item => <option key={item.id} value={item.id}>{item.title} · {item.date}</option>)}
        </select>
      </label>
      <p className="sr-only" id="journey-keyboard-help">Use the arrow keys to explore the milestone stars. Home and End move to the first and last milestone.</p>
      <article
        className="journey-story"
        id="journey-story"
        aria-labelledby="journey-story-heading"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="journey-story-heading">
          <p className="journey-story-index">Milestone {selectedIndex + 1} / {journeyNodes.length}</p>
          <h2 id="journey-story-heading">{entry.title}</h2>
          <p className="journey-story-date">{entry.date}</p>
          <p className="journey-story-organization">{entry.organization}</p>
          <p className="journey-story-description">
            <span className="copy-full">{entry.description}</span>
            <span className="copy-compact">{entry.compactDescription}</span>
          </p>
        </div>
        <nav className="journey-step-controls" aria-label="Journey milestone controls">
          <button type="button" onClick={() => setSelectedId(nextId(-1))}>← Previous</button>
          <button type="button" onClick={() => setSelectedId(nextId(1))}>Next →</button>
        </nav>
      </article>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
