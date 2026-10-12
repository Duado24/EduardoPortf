import { useState } from 'react';
import { journeyNodes } from '../../data/portfolio';

export default function JourneySection() {
  const [selectedId, setSelectedId] = useState(journeyNodes[0].id);
  const entry = journeyNodes.find((item) => item.id === selectedId);

  return (
    <div className="journey-composition">
      <div className="state-introduction journey-introduction">
        <p className="eyebrow">Work, study & service</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Journey</h1>
      </div>
      <ol className="journey-nodes" aria-label="Explore my journey">
        {journeyNodes.map((item, index) => (
          <li className={`journey-node-item journey-node-${index + 1}`} key={item.id}>
            <button
              type="button"
              className="journey-node"
              aria-pressed={entry.id === item.id}
              aria-controls="journey-detail"
              onClick={() => setSelectedId(item.id)}
              onFocus={() => setSelectedId(item.id)}
            >
              <span className="journey-node-index" aria-hidden="true">0{index + 1}</span>
              <span className="journey-node-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <label className="compact-control">
        <span className="sr-only">Explore my journey</span>
        <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
          {journeyNodes.map(item => <option key={item.id} value={item.id}>{item.label} · {item.date}</option>)}
        </select>
      </label>
      <article
        className="journey-detail"
        id="journey-detail"
        aria-labelledby="journey-detail-heading"
        aria-live="polite"
      >
        <p className="journey-date">{entry.date}</p>
        <h2 id="journey-detail-heading">{entry.title}</h2>
        <p className="journey-organization">{entry.organization}</p>
        <p className="journey-description"><span className="copy-full">{entry.description}</span><span className="copy-compact">{entry.compactDescription}</span></p>
      </article>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
