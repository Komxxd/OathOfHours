import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import navSound from '../assets/audio/nomagician-ui-button-sound-cancel-back-exit-continue-467877.mp3';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleMenuClick = (path, stateOptions) => {
        const audio = new Audio(navSound);
        audio.volume = 0.6;
        audio.play().catch(() => { });
        setTimeout(() => navigate(path, stateOptions), 300);
    };

    // Generate embers for atmospheric effect
    useEffect(() => {
        const container = document.getElementById('souls-bg');
        if (!container) return;

        let embers = [];
        const createEmber = () => {
            const ember = document.createElement('div');
            ember.classList.add('ember');
            ember.style.left = `${Math.random() * 100}vw`;
            ember.style.animationDuration = `${5 + Math.random() * 10}s`;
            // Vary depths and speeds
            ember.style.transform = `scale(${Math.random() * 0.5 + 0.5})`;

            container.appendChild(ember);
            embers.push(ember);

            setTimeout(() => {
                if (container.contains(ember)) {
                    ember.remove();
                    embers = embers.filter(e => e !== ember);
                }
            }, 15000);
        };

        const interval = setInterval(createEmber, 300);

        // Initial burst
        for (let i = 0; i < 30; i++) {
            setTimeout(createEmber, Math.random() * 2000);
        }

        return () => {
            clearInterval(interval);
            embers.forEach(e => e.remove());
        };
    }, []);

    return (
        <div id="souls-bg" className="flex-1 flex flex-col items-center justify-center min-h-screen w-full relative souls-bg overflow-hidden cursor-default selection:bg-transparent -mt-[73px]">

            {/* Rolling Atmospheric Fog Layers */}
            <div className="fog-layer fog-layer-1" />
            <div className="fog-layer fog-layer-2" />

            {/* Dark overlay mask to focus center */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,5,0.95)_80%)] pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-6">

                {/* Title */}
                <div className="relative mb-16 sm:mb-28 w-full flex flex-col items-center">
                    <h1 className="text-[1.8rem] xs:text-[2.2rem] sm:text-5xl md:text-[7.5rem] font-souls-title text-center tracking-[0.05em] md:tracking-[0.15em] leading-tight md:leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-10 whitespace-nowrap"
                        style={{
                            background: 'linear-gradient(to bottom, #ffffff 0%, #fdf5d3 40%, #cbaa64 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        OATH
                        <span className="text-xl xs:text-2xl sm:text-3xl md:text-[4.5rem] align-middle mx-2 md:mx-8 tracking-wider opacity-90 inline-block"
                            style={{
                                background: 'linear-gradient(to bottom, #fdf5d3 0%, #a88e52 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            OF
                        </span>
                        HOURS
                    </h1>

                    {/* Metallic underline embellishment */}
                    <div className="absolute -bottom-6 sm:-bottom-8 flex w-full justify-center">
                        <div className="w-[80vw] md:w-[700px] h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-[#cbaa64]/60 to-transparent blur-[1px] absolute" />
                        <div className="w-[60vw] md:w-[500px] h-[0.5px] sm:h-[1px] bg-gradient-to-r from-transparent via-[#ffffff]/70 to-transparent absolute" />
                    </div>
                </div>

                {/* Menu Options */}
                <div className="flex flex-col items-center gap-4 sm:gap-6 mt-8 sm:mt-16 font-souls text-base sm:text-xl md:text-2xl tracking-[0.15em] sm:tracking-[0.2em] w-full">

                    <button
                        onClick={() => handleMenuClick('/auth', { state: { isSignUp: false } })}
                        className="text-[#a89f91] hover:text-[#ffd700] hover:scale-105 transition-all duration-500 group relative py-1 sm:py-2 px-6 sm:px-8 flex flex-col items-center"
                    >
                        RETURNING SOUL
                        {/* Glow indicator on hover */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[20px] sm:h-[30px] bg-white/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </button>

                    <button
                        onClick={() => handleMenuClick('/auth', { state: { isSignUp: true } })}
                        className="text-[#a89f91] hover:text-[#ffd700] hover:scale-105 transition-all duration-500 group relative py-1 sm:py-2 px-6 sm:px-8 flex flex-col items-center"
                    >
                        NEW SOUL
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[20px] sm:h-[30px] bg-white/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </button>

                </div>
            </div>
        </div>
    );
};

export default LandingPage;
