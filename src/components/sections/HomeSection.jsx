import { profile } from '../../data/portfolio';

export default function HomeSection() {
  return (
    <div className="home-composition">
      <div className="home-identity">
        <p className="eyebrow">From Peru, to the world :D</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>
          {profile.name}
        </h1>
        
        <p className="role-line">
          
          <span className="copy-full">Software Engineer Student<br />Front-End · Back-End · Application Development</span>
          <span className="copy-compact">Software Engineering Student</span>
        </p>
      </div>
      <nav className="spatial-nav" aria-label="Explore the portfolio">
        <a className="destination destination-about" href="#about">
          <span className="destination-dot" aria-hidden="true" />About<span className="destination-arrow" aria-hidden="true">↗</span>
        </a>
        {['Projects', 'Journey', 'Skills', 'Contact'].map((label) => (
          <a
            className={`destination destination-${label.toLowerCase()}`}
            key={label}
            href={`#${label.toLowerCase()}`}
          >
            <span className="destination-dot" aria-hidden="true" />{label}<span className="destination-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>

      <p className="home-origin">Peru <span aria-hidden="true">→</span> Salt Lake City</p>
    </div>
  );
}
