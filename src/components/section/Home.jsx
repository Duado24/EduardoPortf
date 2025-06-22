import { RevealOnScroll } from "../RevealOnScroll";

export const Home = () => {
    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative"
        >
            <RevealOnScroll>
                <div className="text-center z-10 px-4">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent leading-right">
                        Hi, I'm Eduardo Villanueva
                    </h1>
                    <h3 className="text-4xl md:text-4xl font-bold mb-6 text-white text-center">
                        Welcome to my Portfolio
                    </h3>
                    <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
                        I'm a full stack developer and software engineering student with a passion
                        for building practical and thoughtful web applications.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <a href="#Projects" className="bg-blue-500 text-white py-3 px-6 rounded font-medium transition hover:bg-white hover:text-blue-500"
                        >
                            View Projects
                        </a>
                        <a href="#Contact" className="bg-blue-500 text-white py-3 px-6 rounded font-medium transition hover:bg-white hover:text-blue-500"
                        >
                            Contact Me
                        </a>

                    </div>
                </div>
            </RevealOnScroll>
        </section>
    );
};