import React from "react";
import { TARGET_SCORE } from "./types";

interface LogoProps {
  compact?: boolean;
}

export const Logo = ({ compact = false }: LogoProps) => (
  <div className="flex flex-col items-center">
    {!compact && (
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center font-black text-white text-sm">
          ♠
        </div>
        <svg width={48} height={32} viewBox="0 0 48 32">
          <rect
            x={1}
            y={1}
            width={20}
            height={30}
            rx={3}
            fill="white"
            stroke="#ccc"
            strokeWidth={1}
          />
          <text
            x={4}
            y={14}
            fill="#111"
            fontSize={10}
            fontWeight="700"
            fontFamily="Arial"
          >
            A
          </text>
          <text
            x={10}
            y={26}
            fill="#111"
            fontSize={12}
            textAnchor="middle"
            fontFamily="serif"
          >
            ♠
          </text>
          <rect
            x={27}
            y={1}
            width={20}
            height={30}
            rx={3}
            fill="white"
            stroke="#ccc"
            strokeWidth={1}
          />
          <text
            x={30}
            y={14}
            fill="#DC2626"
            fontSize={10}
            fontWeight="700"
            fontFamily="Arial"
          >
            K
          </text>
          <text
            x={37}
            y={26}
            fill="#DC2626"
            fontSize={12}
            textAnchor="middle"
            fontFamily="serif"
          >
            ♥
          </text>
        </svg>
        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center font-black text-white text-sm">
          B
        </div>
      </div>
    )}
    <div className="flex items-center">
      <span
        className="font-black tracking-wide"
        style={{
          color: "#0077b6",
          fontSize: compact ? 18 : 26,
          textShadow: "0 2px 8px rgba(91,219,111,0.4)",
        }}
      >
        Minus
      </span>
      <span
        className="font-black mx-0.5"
        style={{ color: "white", fontSize: compact ? 18 : 26 }}
      >
        {" "}
      </span>
      <span
        className="font-black tracking-wide"
        style={{
          color: "#FF6B6B",
          fontSize: compact ? 18 : 26,
          textShadow: "0 2px 8px rgba(255,107,107,0.4)",
        }}
      >
        Plus
      </span>
    </div>
    {!compact && (
      <div className="text-gray-500 text-xs uppercase tracking-widest mt-0.5 border-t border-b border-white/10 px-4 py-0.5">
        ♠ Spades are always trump · First to {TARGET_SCORE} pts wins
      </div>
    )}
  </div>
);
