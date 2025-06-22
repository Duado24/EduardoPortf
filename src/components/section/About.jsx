import { RevealOnScroll } from "../RevealOnScroll";

export const About = () => {

    const frontendSkills = ["React", "TailwindCSS", "Html", "TypeScritpt", "Vue", "JavaScript"];
    const backendSkills = ["Node.js", "Phyton", "AWS", "GraphQL", "C#", "Java", "SQL",];

    return (
        <section id="about" className="min-h-screen flex items-center py-20
        ">
            <RevealOnScroll>
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 bg-clip-text text-transparent to-cyan-400 text-center">
                    {" "}
                    About Me
                </h2>
                <div className="glass rounded-xl p-8 border-white/10 border hover:-translate-y-1 transition-all">
                    <p className="text-gray-300 mb-6">
                        I enjoy working across the stack to bring ideas to life, from designing intuitive user
                        interfaces to building reliable backend systems. I'm always looking for ways to write
                        cleaner code, streamline development, and create smoother, more meaningful experiences for users.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl p-6 hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold rb-4">
                                Frontend
                                <div className="flex flex-wrap gap-2">
                                    {frontendSkills.map((tech, key) => (
                                        <span key={key} className="bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full text-sm hover:bg-blue-500/20
                                                            hover:shadow-[0_2px_8px_rgba(59,130,2246,0.2)] transition
                                            "
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </h3>
                        </div>

                        <div className="rounded-xl p-6 hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold rb-4">
                                Backend
                                <div className="flex flex-wrap gap-2">
                                    {backendSkills.map((tech, key) => (
                                        <span key={key} className="bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full text-sm hover:bg-blue-500/20
                                                            hover:shadow-[0_2px_8px_rgba(59,130,2246,0.2)] transition
                                            "
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="p-6 rounded-xl border-white/10 border hover:-translate-y-1 transition-all">
                        <h3 className="text-xl font-bold mb-4">
                            Education
                        </h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li className="text-left">
                                <strong> B.S in Software Engineer </strong> <br /> Ensign College (2025-2029)
                            </li>
                            <li className="text-left">
                                Relevant Coursework: Data Structures, Web Development, Cloud Computing...
                            </li>
                        </ul>
                    </div>
                    <div className="p-6 rounded-xl border-white/10 border hover:-translate-y-1 transition-all">
                        <h3 className="text-xl font-bold mb-4">
                            Work Experience
                        </h3>
                        <div className="space-y-4 text-gray-300">
                            <div>
                                <h4 className="font-semibold">
                                    Software Enginner at Ensign College (2025 - Present)
                                </h4>
                                <p>
                                    Developed adn maintained microservices for cloud-based applications.
                                </p>
                            </div>
                            <br/>
                            <div>
                                <h4 className="font-semibold">
                                    Intern at ABC Corp
                                </h4>
                                <p>
                                    Assisted in building front-end components and integration REST APIs
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                </RevealOnScroll>
        </section>
    );
};