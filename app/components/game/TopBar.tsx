import React from "react";
import { Logo } from "./Logo";

interface TopBarProps {
  setShowRules: (show: boolean) => void;
}

export const TopBar = ({ setShowRules }: TopBarProps) => {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 md:px-5 md:py-2.5 relative"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors hover:bg-white/10 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <svg
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex flex-col leading-tight">
          <div className="flex flex-row items-center gap-4">
            <span className="text-[#0077b6] text-[12px] font-bold underline uppercase tracking-widest">
              Room ID
            </span>
            <span className="text-[#ff6700] font-bold text-xs">CB1234</span>
          </div>
          <span className="text-[#76c893] text-xs font-semibold">
            ● Online: 4
          </span>
        </div>
      </div>

      <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
        <Logo compact />
      </div>
      <div className="md:hidden">
        <Logo compact />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowRules(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-lg text-[#ff6700] underline text-xs font-semibold hover:bg-white/10 transition-colors"
          style={{
            background: "#f8f9fb",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <svg
            width={13}
            height={13}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Rules
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff6700] cursor-pointer"
          style={{
            background: "#f7f9f9",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <svg
            width={13}
            height={13}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </div>
    </div>
  );
};
