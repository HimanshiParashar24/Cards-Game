

"use client";

import React, { useEffect, useState } from "react";

interface FirstPageProps {
  onPlay: () => void;
}

const FirstPage: React.FC<FirstPageProps> = ({ onPlay }) => {
  const [loading, setLoading] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }

        @keyframes rotateCard {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          50% {
            transform: perspective(1000px) rotateY(180deg);
          }
          100% {
            transform: perspective(1000px) rotateY(360deg);
          }
        }

        @keyframes pulseGlow {
          0%,100% {
            box-shadow:
              0 0 25px rgba(255,255,255,.4),
              0 0 60px rgba(255,255,255,.25);
          }
          50% {
            box-shadow:
              0 0 60px rgba(255,255,255,.9),
              0 0 120px rgba(255,255,255,.6);
          }
        }

        @keyframes buttonGlow {
          0%,100% {
            box-shadow:
              0 0 20px #39ff14,
              0 0 50px #39ff14;
          }
          50% {
            box-shadow:
              0 0 40px #39ff14,
              0 0 90px #39ff14;
          }
        }

        @keyframes sparkle {
          from {
            transform: translateY(0px);
            opacity: .2;
          }
          to {
            transform: translateY(-200px);
            opacity: 1;
          }
        }

        @keyframes cardLeft {
          0%,100% {
            transform: rotate(-18deg) translateY(0);
          }
          50% {
            transform: rotate(-10deg) translateY(-25px);
          }
        }

        @keyframes cardRight {
          0%,100% {
            transform: rotate(18deg) translateY(0);
          }
          50% {
            transform: rotate(10deg) translateY(25px);
          }
        }

        .main-card {
          animation:
            rotateCard 5s ease-in-out 1,
            pulseGlow 3s infinite;
        }

        .play-btn {
       animation: buttonGlow 2s infinite;
     }
        .bg-card-left {
          animation: cardLeft 8s ease-in-out infinite;
        }

        .bg-card-right {
          animation: cardRight 8s ease-in-out infinite;
        }

        .sparkle {
          animation: sparkle linear infinite;
        }
      `}</style>

      <div className="relative h-screen overflow-hidden bg-[#021230]">

        {/* Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#003A8C_0%,#021230_70%)]" />

        {/* Light Rays */}
        <div className="absolute left-1/2 top-0 h-full w-[700px] -translate-x-1/2 bg-gradient-to-b from-blue-400/20 to-transparent blur-3xl pointer-events-none" />

        {/* Floating Particles */}
        {[...Array(40)].map((_, i) => (
          <span
            key={i}
            className="sparkle absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              bottom: "-20px",
              animationDuration: `${6 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          />
        ))}

        {/* Header */}
        <div className="absolute top-0 z-50 flex h-20 w-full items-center justify-between border-b border-white/10 px-8">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              ♠
            </div>

            <span className="text-xl font-bold text-white">
              Minus Plus
            </span>
          </div>

        </div>

        {/* Floating Cards */}
        <div className="bg-card-left absolute left-[8%] top-[22%] h-64 w-44 rounded-3xl border border-blue-300/20 bg-blue-900/10 backdrop-blur-md pointer-events-none">
          <div className="flex h-full items-center justify-center text-[120px] text-white/10">
            ♠
          </div>
        </div>

        <div className="bg-card-right absolute right-[10%] top-[20%] h-64 w-44 rounded-3xl border border-blue-300/20 bg-blue-900/10 backdrop-blur-md pointer-events-none">
          <div className="flex h-full items-center justify-center text-[120px] text-white/10">
            ♦
          </div>
        </div>

        <div className="bg-card-left absolute bottom-[12%] left-[10%] h-64 w-44 rounded-3xl border border-blue-300/20 bg-blue-900/10 backdrop-blur-md pointer-events-none">
          <div className="flex h-full items-center justify-center text-[120px] text-white/10">
            ♥
          </div>
        </div>

        <div className="bg-card-right absolute bottom-[12%] right-[10%] h-64 w-44 rounded-3xl border border-blue-300/20 bg-blue-900/10 backdrop-blur-md pointer-events-none">
          <div className="flex h-full items-center justify-center text-[120px] text-white/10">
            ♣
          </div>
        </div>

        {/* Main Section */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center pt-30">

          {/* Main Card */}
          <div className="main-card relative h-[300px] w-[220px] rounded-[20px] bg-white shadow-[0_0_80px_rgba(255,255,255,.7)]">

            <div className="absolute inset-0 rounded-[40px] border border-white/70" />

            <div className="flex h-full flex-col items-center justify-center">

              <div className="mb-4 text-[60px] text-[#071330]">
                ♠
              </div>

              <h1 className="text-[40px] font-black leading-none text-[#30cd14]">
                MINUS
              </h1>

              <h2 className="mt-2 text-[32px] font-bold tracking-[12px] text-[#1976D2]">
                PLUS
              </h2>

              <div className="mt-10 w-[190px]">

                <div className="h-3 overflow-hidden rounded-full bg-[#071330]">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#39FF14] via-[#00E5FF] to-[#00E5FF] transition-all duration-300"
                    style={{
                      width: `${loading}%`,
                    }}
                  />
                </div>

                <p className="mt-4 text-center text-sm font-semibold tracking-[4px] text-[#071330]">
                  LOADING...
                </p>
              </div>
            </div>
          </div>

          {/* Platform Glow */}
          <div className="absolute bottom-[180px] h-10 w-[450px] rounded-full bg-cyan-400/30 blur-2xl pointer-events-none" />

          {/* Play Button */}
          <button
            onClick={onPlay}
            disabled={loading < 100}
            className={`
              play-btn
              mt-10
              h-[65px]
              w-[250px]
              rounded-[28px]
              border-4
              text-[32px]
              font-black
              text-white
              transition-all
              ${loading < 100 
                ? "border-gray-500 bg-gray-600 opacity-50 cursor-not-allowed" 
                : "border-[#77ff77] bg-gradient-to-b from-[#53ff38] via-[#1fd61f] to-[#0ea90e] hover:scale-105 active:scale-95 cursor-pointer"}
            `}
          >
           PLAY
          </button>

          {/* Features Panel */}
          <div className="mt-12 w-[900px] rounded-3xl border border-white/10 bg-[#061c48]/90 backdrop-blur-xl">

            <div className="grid grid-cols-3">

              <div className="border-r border-white/10 p-8">
                <div className="mb-3 text-4xl">👥</div>

                <h3 className="text-2xl font-bold text-white">
                  MULTIPLAYER
                </h3>

                <p className="mt-2 text-white/70">
                  Play real-time matches with players worldwide
                </p>
              </div>

              <div className="border-r border-white/10 p-8">
                <div className="mb-3 text-4xl">🛡️</div>

                <h3 className="text-2xl font-bold text-white">
                  COMPETE
                </h3>

                <p className="mt-2 text-white/70">
                  Climb the leaderboard and prove your skill
                </p>
              </div>

              <div className="p-8">
                <div className="mb-3 text-4xl">👑</div>

                <h3 className="text-2xl font-bold text-white">
                  DOMINATE
                </h3>

                <p className="mt-2 text-white/70">
                  Outsmart opponents and become champion
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default FirstPage;