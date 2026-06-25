import React from "react";
import { motion } from "framer-motion";
import type { GameState, PlayerState } from "./types";
import { Avatar } from "./Avatar";
import { ScoreNum } from "./ScoreNum";
import { PlayingCard } from "./PlayingCard";
import { CardStack } from "./CardStack";

interface OpponentRowProps {
  opponents: PlayerState[];
  game: GameState;
  botThinking: boolean;
}

export const OpponentRow = ({
  opponents,
  game,
  botThinking,
}: OpponentRowProps) => {
  return (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto  pb-1">
      {opponents.map((opp) => {
        const isActive =
          game.phase === "playing" &&
          game.players[game.currentTurnIndex]?.id === opp.id;
        const isThinking = isActive && botThinking;
        const hasPlayed = game.currentTrick.some(
          (tc) => tc.playerId === opp.id,
        );
        const playedCard = game.currentTrick.find(
          (tc) => tc.playerId === opp.id,
        );
        return (
          <div
            key={opp.id}
            className="flex-1 min-w-[72px]  sm:min-w-0 flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-xl transition-all"
            style={{
              background: "#ffffff",
              border: isActive ? "1px solid #2563eb" : "1px solid #93c5fd",
              boxShadow: isActive
                ? "0 0 12px rgba(17,74,168,0.3)"
                : "0 0 6px rgba(59,130,246,0.15)",
            }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 w-full">
              <Avatar
                id={opp.id}
                name={opp.name}
                size={26}
                online={opp.isOnline}
              />
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[#020887] font-bold text-[10px] sm:text-xs leading-tight">
                  {opp.name}
                </span>
                <ScoreNum v={opp.totalScore} size="sm" />
              </div>
            </div>

            {opp.bid !== null && (
              <div className="flex flex-col   items-center gap-0.5 mt-0.5">
                <span className="text-yellow-400 text-[10px] sm:text-xs font-black">
                  Bid {opp.bid}
                </span>
                <span className="text-[#f72585] text-[8px] sm:text-[10px]">
                  {opp.tricksWon}✓
                </span>
              </div>
            )}

            {isThinking && !hasPlayed && (
              <div className="flex items-center gap-1  mt-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#00a6fb] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#00a6fb]  animate-bounce"
                  style={{ animationDelay: "100ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#00a6fb] animate-bounce"
                  style={{ animationDelay: "200ms" }}
                />
                <span className="hidden sm:inline bg-[#00a6fb]  text-[10px]">
                  thinking
                </span>
              </div>
            )}

            {hasPlayed && playedCard ? (
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                className="mt-0.5"
              >
                <PlayingCard card={playedCard.card} size="sm" />
              </motion.div>
            ) : (
              <div className="mt-0.5 flex flex-col items-center gap-0.5">
                <CardStack count={opp.hand.length} size="sm" />
                <span className="text-[9px] text-[#f0621b]">
                  {opp.hand.length} left
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
