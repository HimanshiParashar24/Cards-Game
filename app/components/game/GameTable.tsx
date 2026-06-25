import React from "react";
import { motion } from "framer-motion";
import type { GameState, Suit } from "./types";
import { CARDS_PER_HAND, TARGET_SCORE } from "./types";
import { PlayingCard } from "./PlayingCard";

interface GameTableProps {
  tableRef: React.RefObject<HTMLDivElement | null>;
  dragOverTable: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  game: GameState;
  trumpIsRed: boolean;
  trumpSym: Record<Suit, string>;
  botThinking: boolean;
  activeBotId: string | null;
}

export const GameTable = ({
  tableRef,
  dragOverTable,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  game,
  trumpIsRed,
  trumpSym,
  botThinking,
  activeBotId,
}: GameTableProps) => {
  return (
    <div
      ref={tableRef}
      className="rounded-4xl p-3 flex flex-col gap-2  transition-all"
      style={{
        background:
          "radial-gradient(ellipse at top, #76c893 10%, #34a0a4 60%, #1a759f 100%)",
        border: dragOverTable ? "3px solid #bd7847" : "4px solid #60495a",
        boxShadow: dragOverTable ? "0 0 16px #bd7847" : "none",
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col ">
          <span className="text-[#edf2fb] text-xs uppercase tracking-wider">
            Round
          </span>
          <span className="text-white font-black text-lg leading-tight">
            {game.currentRound} / {game.totalRounds}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#edf2fb] text-xs uppercase tracking-wider">
            Trump
          </span>
          <span
            className="font-black text-2xl"
            style={{ color: trumpIsRed ? "#c9184a" : "#e2e8f0" }}
          >
            {trumpSym[game.trumpSuit ?? "spades"]}
          </span>
        </div>
        <div className="flex flex-col  items-center">
          <span className="text-[#edf2fb] text-xs uppercase tracking-wider">
            Trick
          </span>
          <span className="text-white font-black text-lg leading-tight">
            {game.completedTricks.length +
              (game.currentTrick.length > 0 ? 1 : 0)}{" "}
            / {CARDS_PER_HAND}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[#edf2fb] text-xs uppercase tracking-wider">
            Target
          </span>
          <span className="text-white font-black text-lg leading-tight">
            {TARGET_SCORE} pts
          </span>
        </div>
      </div>

      {/* Current trick on table */}
      <div className="flex  items-center justify-center gap-3 min-h-[90px] flex-wrap py-1">
        {game.currentTrick.length === 0 ? (
          <span className="text-[#c9184a] text-sm italic">
            {game.phase === "playing"
              ? botThinking && activeBotId
                ? `${game.players.find((p) => p.id === activeBotId)?.name} is thinking...`
                : game.lastTrickWinner
                  ? `${game.players.find((p) => p.id === game.lastTrickWinner)?.name} leads...`
                  : "Play a card to start..."
              : game.phase === "trick_result"
                ? "Trick complete..."
                : "Waiting..."}
          </span>
        ) : (
          game.currentTrick.map((tc, i) => {
            const pName = game.players.find((p) => p.id === tc.playerId)?.name;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  delay: i * 0.05,
                }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[#edf2fb] text-xs">{pName}</span>
                <PlayingCard card={tc.card} size="md" />
              </motion.div>
            );
          })
        )}
      </div>

      {game.phase === "trick_result" && (
        <div className="text-center py-1">
          <span
            className="text-sm font-bold px-3 py-1 rounded-full animate-pulse"
            style={{
              background: "rgba(251,191,36,0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            {game.winnerMessage || "Resolving trick..."}
          </span>
        </div>
      )}
    </div>
  );
};
