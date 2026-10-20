import { useRef, useState } from 'react';
import { autoCanvWorkflow, projects } from '../../data/portfolio';
import TemplateCarousel from '../templateCarousel/TemplateCarousel';
import './ProjectsSection.css';

const compactBuild = {
  autocanv: 'A local review interface with structured findings and formatting updates: preview, backup, approval, apply, and verify.',
  'canvas-generator': 'Presets and color controls for tabs and details, with preview and copyable Canvas-compatible HTML.',
  'ensign-templates': 'Reusable Canvas templates and components for instructional design, with attention to accessibility and usability.',
  cyberforce: 'Preparing database and Web/NFS infrastructure through Linux administration, networking, troubleshooting, and hardening.',
};

export default function ProjectsSection() {
  const [selectedId, setSelectedId] = useState(projects[0].id);
  const project = projects.find((entry) => entry.id === selectedId);
  const mediaDialog = useRef(null);
  const closeDialogButton = useRef(null);
  const tabRefs = useRef([]);
  const isTemplates = project.id === 'ensign-templates';
  const selectedIndex = projects.findIndex((entry) => entry.id === selectedId);

  function handleTabKey(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % projects.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + projects.length) % projects.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = projects.length - 1;
    else return;
    event.preventDefault();
    setSelectedId(projects[next].id);
    tabRefs.current[next]?.focus();
  }

  function openMedia() {
    mediaDialog.current?.showModal();
    closeDialogButton.current?.focus();
  }

  return (
    <div className="projects-composition projects-view" data-project={project.id}>
      <div className="projects-view-heading">
        <div>
          <p className="eyebrow">Selected work</p>
          <h1 className="section-heading" id="section-heading" tabIndex={-1}>Projects</h1>
        </div>
        <span className="projects-view-count" aria-hidden="true">{String(selectedIndex + 1).padStart(2, '0')} <span>/ {String(projects.length).padStart(2, '0')}</span></span>
      </div>
      <div className="projects-tabs" role="tablist" aria-label="Projects" aria-orientation="horizontal">
        {projects.map((entry, index) => (
          <button
            key={entry.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            type="button"
            className="projects-tab"
            role="tab"
            id={`project-tab-${entry.id}`}
            aria-selected={project.id === entry.id}
            aria-controls={`project-panel-${entry.id}`}
            tabIndex={project.id === entry.id ? 0 : -1}
            onClick={() => setSelectedId(entry.id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            <span className="projects-tab-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className="projects-tab-label">{entry.label}<span className="projects-tab-note">{entry.featured ? 'Flagship' : entry.id === 'ensign-templates' ? 'Professional work' : entry.status === 'In progress' ? 'In progress' : 'Design tool'}</span></span>
          </button>
        ))}
      </div>
      <label className="projects-select">
        <span>Choose a project</span>
        <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
          {projects.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </label>
      {projects.map((entry) => (
        <article className="projects-panel" id={`project-panel-${entry.id}`} key={entry.id}
          role="tabpanel" aria-labelledby={`project-tab-${entry.id}`} tabIndex={0} hidden={entry.id !== selectedId}>
          {entry.id === selectedId && <>
            {isTemplates ? <TemplateCarousel /> : project.media && <figure className="projects-preview">
              <button className="projects-preview-open" type="button" onClick={openMedia} aria-label={`Enlarge ${project.name} visual`}>
                <img src={`${import.meta.env.BASE_URL}${project.media.src}`} alt={project.media.alt}
                  width={project.media.width} height={project.media.height} decoding="async" />
                <span className="projects-preview-hint" aria-hidden="true">Expand <span>↗</span></span>
              </button>
              <figcaption>{project.media.caption}</figcaption>
              {project.featured && <ol className="projects-workflow" aria-label="AutoCanv workflow">
                {autoCanvWorkflow.map((step) => <li key={step.label}>{step.label}</li>)}
              </ol>}
            </figure>}
            <div className="projects-story">
              <div className="projects-identity">
                <p className="projects-badge">{project.status}</p>
                <h2>{project.name}</h2>
                <p className="projects-subtitle">{project.subtitle}</p>
              </div>
              <dl className="projects-details">
                <div className="projects-problem"><dt>The problem</dt><dd>{project.problem}</dd></div>
                <div><dt>{project.id === 'cyberforce' ? 'What I’m preparing' : 'What I built'}</dt><dd><span className="projects-copy-full">{project.built}</span><span className="projects-copy-compact">{compactBuild[project.id]}</span></dd></div>
              </dl>
              <ul className="projects-technologies" aria-label={`${project.name} technologies`}>
                {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
              </ul>
              <div className="projects-actions">
                {project.scope && <p className="projects-scope">{project.scope}</p>}
              </div>
              {!isTemplates && project.media && <p className="projects-compact-caption">{project.media.caption}</p>}
            </div>
          </>}
        </article>
      ))}
      <a className="projects-back" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
      {!isTemplates && project.media && (
        <dialog className="projects-media-dialog" ref={mediaDialog} aria-labelledby="projects-media-heading"
          onClick={(event) => { if (event.target === event.currentTarget) mediaDialog.current?.close(); }}>
          <div className="projects-media-header">
            <h2 id="projects-media-heading">{project.name}</h2>
            <div className="projects-media-actions">
              <a href={`${import.meta.env.BASE_URL}${project.media.src}`} target="_blank" rel="noopener noreferrer">Original <span aria-hidden="true">↗</span><span className="sr-only"> image, opens in a new tab</span></a>
              <button type="button" ref={closeDialogButton} onClick={() => mediaDialog.current?.close()}>Close <span aria-hidden="true">×</span></button>
            </div>
          </div>
          <img src={`${import.meta.env.BASE_URL}${project.media.src}`} alt={project.media.alt}
            width={project.media.width} height={project.media.height} />
          <p>{project.media.caption}</p>
        </dialog>
      )}
    </div>
  );
}
