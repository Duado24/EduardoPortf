import { useRef, useState } from 'react';
import { autoCanvWorkflow, projects } from '../../data/portfolio';

export default function ProjectsSection() {
  const [selectedId, setSelectedId] = useState(projects[0].id);
  const project = projects.find((entry) => entry.id === selectedId);
  const mediaDialog = useRef(null);

  return (
    <div className="projects-composition" data-project={project.id}>
      <div className="state-introduction projects-introduction">
        <p className="eyebrow">Selected work</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Projects</h1>
      </div>
      <div className="project-selector" role="group" aria-label="Choose a project">
        {projects.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="project-option"
            aria-pressed={project.id === entry.id}
            aria-controls="active-project"
            onClick={() => setSelectedId(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <label className="compact-control">
        <span className="sr-only">Choose a project</span>
        <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
          {projects.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </label>
      {project.media && (
        <figure className="project-evidence" key={project.id}>
          <button className="evidence-open" type="button" onClick={() => mediaDialog.current?.showModal()}
            aria-label={`Enlarge ${project.name} visual`}>
          <img
            src={`${import.meta.env.BASE_URL}${project.media.src}`}
            alt={project.media.alt}
            width={project.media.width}
            height={project.media.height}
            decoding="async"
          />
          </button>
          <figcaption>{project.media.caption}</figcaption>
        </figure>
      )}
      <article
        className={`project-summary${project.featured ? ' project-featured' : ''}`}
        id="active-project"
        aria-labelledby="active-project-heading"
        aria-live="polite"
      >
        <p className="project-status">{project.status}</p>
        <h2 id="active-project-heading">{project.name}</h2>
        <p className="project-subtitle">{project.subtitle}</p>
        <dl className="project-details">
          <div><dt>Problem</dt><dd>{project.problem}</dd></div>
          <div><dt>Built</dt><dd>{project.built}</dd></div>
        </dl>
        {project.featured && (
          <ol className="project-workflow" aria-label="AutoCanv workflow">
            {autoCanvWorkflow.map((step) => <li key={step.label}>{step.label}</li>)}
          </ol>
        )}
        {project.scope && <p className="project-scope">{project.scope}</p>}
        <ul className="tech-tags" aria-label={`${project.name} technologies`}>
          {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
      </article>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
      {project.media && (
        <dialog className="media-dialog" ref={mediaDialog} aria-labelledby="media-dialog-heading">
          <div className="media-dialog-header">
            <h2 id="media-dialog-heading">{project.name}</h2>
            <button type="button" onClick={() => mediaDialog.current?.close()} autoFocus>Close <span aria-hidden="true">×</span></button>
          </div>
          <img src={`${import.meta.env.BASE_URL}${project.media.src}`} alt={project.media.alt}
            width={project.media.width} height={project.media.height} />
          <p>{project.media.caption}</p>
        </dialog>
      )}
    </div>
  );
}
