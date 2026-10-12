import { useState } from 'react';
import { skillGroups } from '../../data/portfolio';

export default function SkillsSection() {
  const [selectedGroup, setSelectedGroup] = useState(0);
  return (
    <div className="skills-composition">
      <div className="state-introduction skills-introduction">
        <p className="eyebrow">Tools & practice</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Skills</h1>
      </div>
      <label className="compact-control">
        <span className="sr-only">Choose a skill category</span>
        <select value={selectedGroup} onChange={event => setSelectedGroup(Number(event.target.value))}>
          {skillGroups.map((group, index) => <option key={group.name} value={index}>{group.name}</option>)}
        </select>
      </label>
      <p className="compact-skill-summary" aria-live="polite">{skillGroups[selectedGroup].skills.slice(0, 3).join(' · ')}</p>
      <div className="skills-grid">
        {skillGroups.map((group, index) => (
          <section className={`skill-group skill-group-${index + 1}`} aria-labelledby={`skill-group-${index}`} key={group.name}>
            <h2 id={`skill-group-${index}`}>{group.name}</h2>
            <ul className="skill-list">
              {group.skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
