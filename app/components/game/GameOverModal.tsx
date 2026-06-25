import React from "react";
import { motion } from "framer-motion";
import type { GameState, PlayerState } from "./types";
import { ScoreNum } from "./ScoreNum";

interface GameOverModalProps {
  showGameOverModal: boolean;
  game: GameState;
  sortedPlayers: PlayerState[];
  newGame: () => void;
}

export const GameOverModal = ({
  showGameOverModal,
  game,
  sortedPlayers,
  newGame,
}: GameOverModalProps) => {
  if (!showGameOverModal || game.phase !== "game_over") return null;

  const winner = game.players.find((p) => p.id === game.gameWinnerId);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 12 }}
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "#0b1a2e",
          border: "1px solid rgba(99,102,241,0.4)",
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">
            {game.gameWinnerId === "you" ? "🏆" : "😔"}
          </div>
          <div className="text-white font-black text-2xl">
            {game.gameWinnerId === "you"
              ? "You Won!"
              : `${winner?.name ?? "Someone"} Wins!`}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Game over after {game.roundResults.length} rounds
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {sortedPlayers.map((p, rank) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{
                background:
                  rank === 0
                    ? "rgba(250,204,21,0.1)"
                    : "rgba(255,255,255,0.04)",
                border: rank === 0 ? "1px solid rgba(250,204,21,0.3)" : "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {["🥇", "🥈", "🥉", "4️⃣"][rank]}
                </span>
                <span className="text-white font-bold text-sm">{p.name}</span>
              </div>
              <ScoreNum v={p.totalScore} size="sm" />
            </div>
          ))}
        </div>
        <button
          onClick={newGame}
          className="w-full py-3 rounded-xl font-black text-white text-base transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          style={{
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            boxShadow: "0 4px 18px rgba(99,102,241,0.4)",
          }}
        >
          🔄 Play Again
        </button>
      </motion.div>
    </div>
  );
};
