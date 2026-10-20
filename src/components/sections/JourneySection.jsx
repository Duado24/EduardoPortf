import { useRef } from 'react';
import { journeyNodes } from '../../data/portfolio';
import { journeyConstellations } from '../../data/journeyConstellations';
import { CONS } from '../../data/astronomyCatalog';
import './JourneySection.css';

export default function JourneySection({ journeyView, onJourneyView }) {
  const { index, lang, reveal } = journeyView;
  const refs = useRef([]);
  const selected = journeyConstellations[index];
  const entry = journeyNodes.find(node => node.id === selected.id);
  const select = (index) => onJourneyView({ ...journeyView, index, reveal: false });
  function keyDown(event, i) {
    const next = { ArrowRight: (i + 1) % 6, ArrowDown: (i + 1) % 6, ArrowLeft: (i + 5) % 6, ArrowUp: (i + 5) % 6, Home: 0, End: 5 }[event.key];
    if (next === undefined) return;
    event.preventDefault(); select(next); refs.current[next]?.focus();
  }
  return <div className="journey-recovered">
    <div className="journey-heading">
      <p className="eyebrow">Peru &rarr; Utah &middot; Work, study &amp; service</p>
      <h1 id="section-heading" tabIndex={-1}>Journey</h1>
      <p>A constellation of experiences that brought me here.</p>
      </div>
    <article className="journey-card" id="journey-story" aria-live="polite" aria-atomic="true">
      <p className="journey-card-index">0{index + 1} / 06 &nbsp; &middot; &nbsp; {lang === 'es' ? CONS[selected.con].es : CONS[selected.con].n}</p>
      <h2>{entry.title}</h2>
      <p className="journey-card-organization">{entry.organization}</p>
      <p className="journey-card-date">{entry.date}</p>
      <p className="journey-card-description">{entry.description}</p>
      <div className="journey-card-note"><span>{selected.nick[lang]}</span><p>{selected.note}</p>
      {reveal && <p>Yacana and Uñallamacha: stylized interpretations of the llama and baby llama in the Milky Way’s dark clouds.</p>}</div>
    </article>
    <nav className="journey-tabs" aria-label="Journey milestones, arranged thematically">
      {journeyConstellations.map((item, i) => {
        const node = journeyNodes.find(node => node.id === item.id);
        return <button key={item.id} ref={el => { refs.current[i] = el; }} type="button" aria-pressed={i === index} aria-controls="journey-story" tabIndex={i === index ? 0 : -1} onClick={() => select(i)} onKeyDown={event => keyDown(event, i)}>
          <span>0{i + 1} &middot; {lang === 'es' ? CONS[item.con].es : CONS[item.con].n}</span><strong>{node.title}</strong>
        </button>;
      })}
    </nav>
    <div className="journey-tools">
      <button type="button" onClick={() => onJourneyView({ ...journeyView, lang: lang === 'en' ? 'es' : 'en' })}>Names: {lang === 'en' ? 'English' : 'Español'}</button>
      <button type="button" aria-pressed={reveal} onClick={() => onJourneyView({ ...journeyView, index: 0, reveal: !reveal })}>{reveal ? 'Hide' : 'Reveal'} Inca dark constellations</button>
      <details><summary>About this sky</summary><div><p>Cataloged stars and constellation lines; personal milestone associations. This is a tour of the celestial sphere, not the sky at one place or time. The dark llama outlines are stylized.</p><a href="https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx" target="_blank" rel="noreferrer">Astronomy and cultural context: IAU</a></div></details>
    </div>
    <a className="back-home" href="#home"><span aria-hidden="true">&larr;</span> Back to Home</a>
  </div>;
}
