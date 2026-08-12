export const Contact = () => (
  <section
    id="contact"
    className="min-h-screen flex items-center justify-center bg-black text-gray-100"
  >
    <div className="max-w-lg w-full mx-auto p-8 rounded-xl border border-white/10 shadow-lg bg-black/80">
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 bg-clip-text text-transparent to-cyan-400 text-center">
        Contact Me
      </h2>
      <p className="text-gray-300 mb-8 text-center">
        Feel free to reach out for collaborations, questions, or just to connect!
      </p>
      <div className="flex flex-col gap-4 items-center">
        <a
          href="mailto:edjvc24@gmail.com"
          className="text-blue-400 hover:text-white transition-colors font-mono underline"
          target="_blank" rel="noopener noreferrer"
        >
          edjvc24@gmail.com
        </a>
        <a
          href="https://github.com/Duado24"
          className="text-blue-400 hover:text-white transition-colors font-mono underline"
          target="_blank" rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/edvico24"
          className="text-blue-400 hover:text-white transition-colors font-mono underline"
          target="_blank" rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a
          href="https://app.joinhandshake.com/profiles/sw6j2w"
          className="text-blue-400 hover:text-white transition-colors font-mono underline"
          target="_blank" rel="noopener noreferrer"
        >
          Handshake
        </a>
      </div>
    </div>
  </section>
);
