import { useEffect, useRef, useState } from 'react';
import { skillGroups } from '../../data/portfolio';
import './SkillsSection.css';

const pad = (value) => String(value).padStart(2, '0');

// The knight and his fire are drawn by the shared particles (watchTarget.js); this page
// holds the inventory and tells the particles which flame tint to show.
export default function SkillsSection({ onSkillFlame }) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef([]);
  const group = skillGroups[selected];

  useEffect(() => {
    onSkillFlame?.(skillGroups[0].flame, false);
  }, [onSkillFlame]);

  function select(index) {
    setSelected(index);
    onSkillFlame?.(skillGroups[index].flame, true);
  }

  function handleTabKey(event, index) {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % skillGroups.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + skillGroups.length) % skillGroups.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = skillGroups.length - 1;
    else return;
    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="skills-composition campfire">
      <div className="state-introduction skills-introduction">
        <p className="eyebrow">Tools & practice</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Skills</h1>
        <p className="campfire-lede">A quiet checkpoint to rest, sharpen the tools, and choose what comes next.</p>
      </div>
      <div className="campfire-inventory">
        <p className="campfire-inventory-head"><span>Inventory</span><span>{pad(skillGroups.length)}</span></p>
        <div className="campfire-tabs" role="tablist" aria-label="Skill categories" aria-orientation="vertical">
          {skillGroups.map((entry, index) => (
            <button
              type="button"
              role="tab"
              id={`skill-tab-${index}`}
              aria-selected={index === selected}
              aria-controls="skill-panel"
              tabIndex={index === selected ? 0 : -1}
              ref={(element) => { tabRefs.current[index] = element; }}
              onClick={() => select(index)}
              onKeyDown={(event) => handleTabKey(event, index)}
              key={entry.name}
            >
              <span className="campfire-tab-number">{pad(index + 1)}</span>
              <span className="campfire-tab-name">{entry.name}</span>
              <span className="campfire-tab-short" aria-hidden="true">{entry.short}</span>
            </button>
          ))}
        </div>
        <div className="campfire-detail" role="tabpanel" id="skill-panel" aria-labelledby={`skill-tab-${selected}`}>
          <ul className="campfire-chips" key={selected}>
            {group.skills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </div>
      </div>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
