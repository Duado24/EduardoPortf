import { contactLinks } from '../../data/portfolio';

export default function ContactSection() {
  return (
    <div className="contact-composition">
      <div className="state-introduction contact-introduction">
        <p className="eyebrow">Start a conversation</p>
        <h1 className="section-heading" id="section-heading" tabIndex={-1}>Contact</h1>
      </div>
      <ul className="contact-list">
        {contactLinks.map((link, index) => (
          <li className={`contact-item contact-item-${index + 1}`} key={link.label}>
            <a className="contact-link" href={link.href} download={link.download}>
              <span className="contact-label">{link.label}</span>
              <span className="contact-value">{link.value}</span>
              <span className="contact-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <a className="back-home" href="#home"><span aria-hidden="true">←</span> Back to Home</a>
    </div>
  );
}
