import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/white_full.png";

interface AuthLayoutProps {
  children: React.ReactNode;
  quote?: string;
}

const MESSAGES = [
  {
    title: "Scale Without Limits",
    subtitle: "Automate your workflows and focus on what matters most. We handle the heavy lifting while you grow."
  },
  {
    title: "Insight Driven Growth",
    subtitle: "Make data-backed decisions with our advanced analytics engine and predict your next big win."
  },
  {
    title: "Connect Your World",
    subtitle: "Seamlessly integrate with your favorite tools and create a unified ecosystem for your business."
  }
];

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  quote = "A WISE QUOTE",
}) => {
  const [currentMsg, setCurrentMsg] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMsg((prev) => (prev + 1) % MESSAGES.length);
        setIsTransitioning(false);
      }, 600);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Panel - Visual/Abstract */}
      <div className="sticky top-0 h-screen hidden w-[45%] lg:flex items-center justify-center p-6">
        <div className="absolute inset-4 overflow-hidden rounded-[2.5rem] bg-[#1a3a2e] shadow-2xl">
          {/* Animated Background Waves - Lightened and Smoothed */}
          <div className="absolute inset-0 z-0 overflow-hidden">
             {/* Smoother, Lighter Base Gradient */}
             <div className="absolute inset-0 bg-gradient-to-br from-[#1e4638] via-[#1a3a2e] to-[#122d22]" />
             
             {/* Larger, Softer Glowing Blobs */}
             <div className="absolute -top-[10%] -left-[10%] w-[100%] h-[100%] bg-[#2d6a4f]/20 rounded-full blur-[140px] animate-[pulse_15s_infinite]" />
             <div className="absolute top-[15%] -right-[15%] w-[80%] h-[80%] bg-[#ff5722]/5 rounded-full blur-[120px] animate-[pulse_10s_infinite] delay-1000" />
             <div className="absolute -bottom-[20%] left-[5%] w-[90%] h-[90%] bg-[#1e4638]/40 rounded-full blur-[160px] animate-[pulse_12s_infinite] delay-2000" />
             
             {/* Enhanced Mesh Gradient for Smoothness */}
             <div className="absolute inset-0 opacity-60 mix-blend-overlay bg-[radial-gradient(at_top_right,rgba(45,106,79,0.2)_0%,transparent_60%),radial-gradient(at_bottom_left,rgba(255,87,34,0.1)_0%,transparent_60%)]" />
             
             {/* Subtle surface texture (noise or light overlay) */}
             <div className="absolute inset-0 opacity-[0.03] bg-[url('')]" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex h-full flex-col justify-between p-14 text-white">
            <div className="flex items-center space-x-3">
              {/* <div className="h-[1px] w-10 bg-white/30" />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70">
                {quote}
              </span>
              <div className="h-[1px] w-10 bg-white/30" /> */}
            </div>

            <div className="max-w-md space-y-8">
              <div className={`transition-all duration-700 ease-in-out transform ${isTransitioning ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <h1 className="text-6xl font-['Playfair_Display'] text-white/70 font-medium leading-[1.1] tracking-tight mb-6 drop-shadow-sm">
                  {MESSAGES[currentMsg].title}
                </h1>
                <p className="text-lg text-white/50 font-light leading-relaxed max-w-[90%]">
                  {MESSAGES[currentMsg].subtitle}
                </p>
              </div>
              
              {/* Progress Indicator */}
              <div className="flex gap-2 pt-4">
                {MESSAGES.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${i === currentMsg ? 'w-8 bg-white/50' : 'w-2 bg-white/10'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col items-center justify-center px-8 py-12 lg:w-[55%] min-h-screen light bg-white">
        <div className="w-full max-w-[420px] space-y-10">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start">
             <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center  shadow-lg shadow-[#122D22]/20">
                   <img src={logo} alt="Logo" className="w-12 h-12" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight text-[#0A1A14]">VaakuOS</span>
                </div>
             </Link>
          </div>

          <div className="bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

