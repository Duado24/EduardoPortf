// Content is grounded in the supplied project source, resume, and approved brief.
// Dates, public repositories, and outcomes remain omitted when unverified.
export const profile = {
  name: 'Eduardo Villanueva Cornejo',
  role: 'Software Engineering Student · Front-End Developer · Automation & Systems',
  location: 'Salt Lake City',
  email: 'edjvc24@gmail.com',
};

export const projects = [
  {
    id: 'autocanv',
    name: 'AutoCanv',
    label: 'AutoCanv',
    subtitle: 'Canvas course QA & automation',
    status: 'Personal project · Prototype',
    featured: true,
    problem:
      'Canvas course QA involves content, links, accessibility, and formatting checks.',
    built:
      'I built a local review interface with structured findings and guarded formatting updates: preview, backup, apply, and verify.',
    scope:
      'Supported formatting corrections require review and approval.',
    technologies: ['React', 'Vite', 'Python', 'FastAPI', 'Canvas REST API'],
    media: {
      src: 'project-media/AutoCanvT.png',
      width: 1440,
      height: 960,
      alt: 'AutoCanv tab scanner with offline synthetic demonstration content, review counts, and a searchable content list.',
      caption: 'Actual UI · offline demonstration with synthetic content',
    },
  },
  {
    id: 'canvas-generator',
    name: 'Canvas HTML Generator',
    label: 'HTML Generator',
    subtitle: 'Reusable LMS component design',
    status: 'Canvas component design tool',
    problem:
      'Course components need consistent markup and flexible content and styling.',
    built:
      'I built presets and color controls for tabs and details components, with an on-demand preview and copyable Canvas-compatible HTML.',
    technologies: ['Google Apps Script', 'JavaScript', 'HTML', 'CSS'],
    media: {
      src: 'project-media/canvas-generator.webp',
      width: 1440,
      height: 1060,
      alt: 'Canvas HTML Generator with layout controls, a three-tab sample preview, and generated HTML.',
      caption: 'Actual generator UI · built-in sample content',
    },
  },
  {
    id: 'ensign-templates',
    name: 'Ensign Canvas Template System',
    label: 'Ensign Templates',
    subtitle: 'Consistent course content patterns',
    status: 'Professional work',
    problem:
      'Course content needs clear instructions and consistent, responsive layouts.',
    built:
      'I create reusable Canvas templates and components in my Instructional Design Assistant role, with attention to accessibility and usability.',
    technologies: ['HTML', 'CSS', 'Canvas LMS', 'Responsive design'],
    media: {
      src: 'project-media/ensign-template.webp',
      width: 1440,
      height: 960,
      alt: 'Local tab pattern preview using the supplied AutoCanv formatter styles and synthetic sample text.',
      caption: 'AutoCanv formatter pattern · sample content',
    },
  },
  {
    id: 'cyberforce',
    name: 'DOE CyberForce Infrastructure',
    label: 'CyberForce',
    subtitle: 'Systems & infrastructure preparation',
    status: 'In progress',
    problem:
      'Competition preparation requires understanding services, access controls, and system baselines.',
    built:
      'I am preparing database and Web/NFS infrastructure through Linux administration, networking, troubleshooting, and hardening.',
    technologies: ['Linux', 'Nginx', 'NFS', 'Networking'],
    media: {
      src: 'project-media/cyberforce-diagram.svg',
      width: 1280,
      height: 720,
      alt: 'Conceptual CyberForce preparation responsibilities: database systems, Nginx, NFS, Linux administration, networking, and system hardening.',
      caption: 'In progress · conceptual infrastructure responsibilities',
    },
  },
];

export const autoCanvWorkflow = [
  { label: 'Scan', description: 'Review Canvas course content.' },
  { label: 'Findings', description: 'Inspect structured issues.' },
  { label: 'Preview', description: 'Review a supported correction.' },
  { label: 'Apply', description: 'Back up, then confirm the change.' },
  { label: 'Verify', description: 'Check the updated content.' },
];

export const journey = [
  {
    id: 'lima-education',
    label: 'Lima · coursework',
    compactDescription: 'International Business foundations before software engineering.',
    title: 'International Business',
    organization: 'Universidad de Lima · Peru',
    date: '2023',
    description:
      'Foundational coursework before transitioning toward software engineering.',
  },
  {
    id: 'net-axes',
    label: 'Net Axes · sales',
    compactDescription: 'Client communication and practical problem-solving.',
    title: 'Sales Advisor',
    organization: 'Net Axes S.A.C',
    date: 'January 2022 — December 2023',
    description:
      'Built customer communication experience in a sales role.',
  },
  {
    id: 'ensign-education',
    label: 'Ensign · study',
    compactDescription: 'Bachelor of Applied Science · expected 2029.',
    title: 'Software Engineering',
    organization: 'Ensign College',
    date: 'Expected 2029',
    description:
      'Bachelor of Applied Science, with studies in software development, algorithms, and data analysis.',
  },
  {
    id: 'ensign-work',
    label: 'Ensign · work',
    compactDescription: 'Canvas templates, HTML/CSS, accessibility, and usability.',
    title: 'Instructional Design Assistant',
    organization: 'Ensign College',
    date: 'April 2025 — Present',
    description:
      'Create reusable Canvas templates and layouts with HTML/CSS, with attention to accessibility and usability.',
  },
  {
    id: 'volunteer',
    label: 'Volunteer',
    compactDescription: 'Spanish–English translation and interpretation.',
    title: 'Volunteer Interpreter',
    organization: 'No More A Stranger Foundation',
    date: 'Undated volunteer experience',
    description:
      'Help Spanish-speaking immigrants communicate through translation and interpretation.',
  },
  {
    id: 'cyberforce-preparation',
    label: 'CyberForce · prep',
    compactDescription: 'Database and Web/NFS preparation · in progress.',
    title: 'DOE CyberForce',
    organization: 'Infrastructure preparation',
    date: '2026 · In progress',
    description:
      'Preparing database and Web/NFS systems through administration, service baselining, access controls, and troubleshooting.',
  },
];

export const journeyNodes = journey;

// `flame` tints the Skills fire and its light on the knight (sRGB, 0–1) when the category is selected.
export const skillGroups = [
  {
    name: 'Front-end development',
    short: 'Front-end',
    flame: [1, 0.7, 0.42],
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Responsive design'],
  },
  {
    name: 'Software & automation',
    short: 'Software',
    flame: [1, 0.48, 0.42],
    skills: ['Python', 'Google Apps Script', 'REST APIs', 'Canvas API', 'Automation tools'],
  },
  {
    name: 'UX & accessibility',
    short: 'UX',
    flame: [1, 0.84, 0.56],
    skills: ['Accessible web design', 'Semantic HTML', 'Responsive layouts', 'Usability review', 'Canvas LMS design'],
  },
  {
    name: 'Systems & cybersecurity',
    short: 'Systems',
    flame: [0.62, 0.74, 1],
    skills: ['Linux', 'Nginx', 'NFS', 'Networking', 'System administration', 'Security fundamentals'],
  },
  {
    name: 'Tools',
    short: 'Tools',
    flame: [0.92, 0.56, 0.78],
    skills: ['Git', 'GitHub', 'Vite', 'VS Code', 'Microsoft Office', 'Canvas LMS'],
  },
];

export const contactLinks = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { label: 'GitHub', value: 'Duado24', href: 'https://github.com/Duado24' },
  { label: 'LinkedIn', value: 'Eduardo Villanueva', href: 'https://linkedin.com/in/edvico24/' },
  { label: 'Resume', value: 'Download résumé · PDF', href: './eduardo-villanueva-resume.pdf', download: 'Eduardo-Villanueva-Resume.pdf' },
];
