import React from "react";
import { motion } from "framer-motion";
import type { GameState } from "./types";
import { Avatar } from "./Avatar";
import { ScoreNum } from "./ScoreNum";

interface RoundResultModalProps {
  showRoundModal: boolean;
  game: GameState;
  startNextRound: () => void;
}

export const RoundResultModal = ({
  showRoundModal,
  game,
  startNextRound,
}: RoundResultModalProps) => {
  if (!showRoundModal || game.phase !== "round_result") return null;

  const lastResult = game.roundResults[game.roundResults.length - 1];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "#0b1e13",
          border: "1px solid rgba(91,219,111,0.3)",
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">🃏</div>
          <div className="text-white font-black text-xl">
            {game.winnerMessage}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Round {game.currentRound} complete
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {lastResult &&
            game.players.map((p) => {
              const bid = lastResult.bids[p.id] ?? 0;
              const won = lastResult.tricksWon[p.id] ?? 0;
              const score = lastResult.scores[p.id] ?? 0;
              const met = won >= bid;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar id={p.id} name={p.name} size={28} />
                    <span className="text-white text-sm font-semibold">
                      {p.name}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: met
                          ? "rgba(91,219,111,0.15)"
                          : "rgba(255,107,107,0.15)",
                        color: met ? "#5BDB6F" : "#FF6B6B",
                      }}
                    >
                      {won}/{bid} {met ? "✓" : "✗"}
                    </span>
                  </div>
                  <ScoreNum v={score} size="sm" />
                </div>
              );
            })}
        </div>
        <button
          onClick={startNextRound}
          className="w-full py-3 rounded-xl font-black text-white text-base transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          style={{
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            boxShadow: "0 4px 18px rgba(34,197,94,0.35)",
          }}
        >
          {game.currentRound >= game.totalRounds
            ? "See Final Results"
            : `Next Round →`}
        </button>
      </motion.div>
    </div>
  );
};
