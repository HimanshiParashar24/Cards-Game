import React from "react";

interface RulesModalProps {
  showRules: boolean;
  setShowRules: (show: boolean) => void;
}

export const RulesModal = ({ showRules, setShowRules }: RulesModalProps) => {
  if (!showRules) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={() => setShowRules(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "#0d2a1a",
          border: "1px solid rgba(91,219,111,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black text-xl">
            How to Play — Call Breaker
          </h3>
          <button
            onClick={() => setShowRules(false)}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {[
            [
              "🎯",
              "Before each round, every player bids how many tricks they'll win (min 1).",
            ],
            [
              "♠",
              "Spades are always the trump suit — they beat all other suits.",
            ],
            [
              "🃏",
              "On your turn, play any card. You MUST follow the led suit if you have it.",
            ],
            [
              "🏆",
              "The highest trump wins the trick. If no trump is played, the highest card of the led suit wins.",
            ],
            [
              "✅",
              "Meet or beat your bid → you earn points equal to your bid.",
            ],
            [
              "❌",
              "Fall short of your bid → you lose points equal to your bid.",
            ],
            ["🏅", "First player to reach 40 points wins the game!"],
            ["🤖", "Bot opponents bid and play automatically."],
          ].map(([icon, text], i) => (
            <li key={i} className="flex gap-3 text-gray-300 text-sm">
              <span className="text-base flex-shrink-0">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
