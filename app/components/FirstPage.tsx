"use client";

import React, { useEffect, useState } from "react";

const FirstPage : React.FC = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes pageEntrance {
          from {
            opacity: 0;
            transform: scale(1.03);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes cardRotate {
          0% {
            transform: perspective(1200px) rotateY(0deg) translateY(0px);
          }
          50% {
            transform: perspective(1200px) rotateY(180deg) translateY(-18px);
          }
          100% {
            transform: perspective(1200px) rotateY(360deg) translateY(0px);
          }
        }

        @keyframes float {
          0%,100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes glowPulse {
          0%,100% {
            box-shadow:
              0 0 25px rgba(118,200,147,.35),
              0 0 50px rgba(52,160,164,.25);
          }
          50% {
            box-shadow:
              0 0 50px rgba(118,200,147,.6),
              0 0 90px rgba(52,160,164,.45);
          }
        }

        @keyframes buttonReveal {
          from {
            opacity: 0;
            transform: scale(.7) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%,100% {
            box-shadow:
              0 0 20px rgba(30,96,145,.45),
              0 0 40px rgba(22,138,173,.3);
          }
          50% {
            box-shadow:
              0 0 40px rgba(30,96,145,.85),
              0 0 80px rgba(22,138,173,.55);
          }
        }

        @keyframes particleFloat {
          from {
            transform: translateY(0px);
            opacity: .2;
          }
          50% {
            opacity: 1;
          }
          to {
            transform: translateY(-120px);
            opacity: .1;
          }
        }

        @keyframes bgCardMove {
          0% {
            transform: translateY(0px) rotate(-15deg);
          }
          50% {
            transform: translateY(-30px) rotate(-8deg);
          }
          100% {
            transform: translateY(0px) rotate(-15deg);
          }
        }

        @keyframes bgCardMove2 {
          0% {
            transform: translateY(0px) rotate(15deg);
          }
          50% {
            transform: translateY(40px) rotate(25deg);
          }
          100% {
            transform: translateY(0px) rotate(15deg);
          }
        }

        .page-enter {
          animation: pageEntrance 1.2s ease forwards;
        }

        .main-card {
          animation:
            cardRotate 5s ease-in-out forwards,
            glowPulse 2.5s infinite;
          transform-style: preserve-3d;
        }

        .play-btn {
          animation:
            buttonReveal .8s ease forwards,
            float 3s ease-in-out infinite,
            pulseGlow 2s infinite;
        }

        .particle {
          animation: particleFloat linear infinite;
        }

        .bg-card-1 {
          animation: bgCardMove 8s ease-in-out infinite;
        }

        .bg-card-2 {
          animation: bgCardMove2 10s ease-in-out infinite;
        }
      `}</style>

      <div className="relative w-full h-screen overflow-hidden bg-[#168AAD] page-enter">

        {/* Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#34A0A4_0%,transparent_50%)] opacity-40" />

        {/* Blur Orbs */}
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-[#76C893]/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-[#1E6091]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[120px]" />

        {/* Floating Background Cards */}
        <div className="bg-card-1 absolute left-[8%] top-[18%] h-52 w-36 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl rotate-[-15deg]" />

        <div className="bg-card-2 absolute right-[10%] top-[20%] h-60 w-40 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl rotate-[-15deg]" />

        <div className="bg-card-1 absolute bottom-[15%] left-[20%] h-40 w-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md rotate-[-12deg]" />

        <div className="bg-card-2 absolute bottom-[18%] right-[18%] h-44 w-32 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md rotate-[-10deg]" />

        {/* Sparkle Particles */}
        {[...Array(30)].map((_, i) => (
          <span
            key={i}
            className="particle absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}

        {/* Main Content */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center px-6">

          {/* Premium Rotating Card */}
          <div
            className="
              main-card
              relative
              h-[320px]
              w-[220px]
              rounded-3xl
              border
              border-white/40
              bg-white/90
              backdrop-blur-xl
              shadow-[0_30px_80px_rgba(0,0,0,0.35)]
              transition-all
              duration-500
              hover:scale-105
            "
          >
            {/* Reflection */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -left-20 top-0 h-full w-20 rotate-12 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-md" />
            </div>

            {/* Card Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">

              <div className="mb-4 text-7xl">♠</div>

              <h1 className="bg-gradient-to-r from-[#1E6091] to-[#34A0A4] bg-clip-text text-center text-4xl font-extrabold text-transparent">
                CARD
              </h1>

              <h2 className="text-xl font-bold tracking-[6px] text-[#168AAD]">
                MASTER
              </h2>

              <div className="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-[#1E6091] to-[#76C893]" />
            </div>

            {/* Glow Border */}
            <div className="absolute inset-0 rounded-3xl border border-white/50" />
          </div>

             {/* Play Button Reveal */}
             (
               <button
                 className="
                   play-btn
                   mt-12
                   rounded-2xl
                   border
                   border-[#14532d]
                   px-12
                   py-4
                   text-xl
                   font-bold
                   text-white
                   transition-all
                   duration-300
                   hover:scale-110
                   hover:shadow-[0_0_40px_rgba(34,197,94,0.7)]
                   active:scale-95
                 "
                 style={{
                   background:
                     "linear-gradient(135deg,#14532d,#166534,#22c55e)",
                 }}
               >
                  PLAY
               </button>
             )

          {/* Subtitle */}
          <p className="mt-8 max-w-xl text-center text-white/80">
            Enter the ultimate multiplayer card arena. Challenge players,
            compete in real-time matches, and dominate the leaderboard with
            style.
          </p>
        </div>
      </div>
    </>
  );
};

export default FirstPage;