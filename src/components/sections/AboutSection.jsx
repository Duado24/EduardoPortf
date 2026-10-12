export default function AboutSection() {
  return (
    <div className="about-composition">
      <div className="about-introduction">
        <p className="eyebrow">What you need to know</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>About me</h1>
        <p className="section-intro">
          <span className="copy-full">
          I’m a curious person who enjoys learning, building, and trying new things. Outside of tech, I love cats, listening to all kinds of music, and probably way too much Peruvian food.            </span>
          <span className="copy-compact">I build practical tools for education.</span>
        </p>
      </div>
      <ul className="about-notes" aria-label="Work and community">
        <li><span className="note-description">Instructional Design Assistant<br /></span><span className="note-context">Ensign College</span></li>
        <li><span className="note-description">Bilingual volunteer interpreter<br /></span><span className="note-context">Spanish & English</span></li>
      </ul>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
