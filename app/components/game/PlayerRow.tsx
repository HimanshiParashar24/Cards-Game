import React from "react";
import { motion } from "framer-motion";
import type { GameState, PlayerState } from "./types";
import { Avatar } from "./Avatar";
import { ScoreNum } from "./ScoreNum";
import { PlayingCard } from "./PlayingCard";

interface PlayerRowProps {
  you: PlayerState;
  isYourTurn: boolean;
  youHasPlayed: boolean;
  botThinking: boolean;
  game: GameState;
}

export const PlayerRow = ({
  you,
  isYourTurn,
  youHasPlayed,
  botThinking,
  game,
}: PlayerRowProps) => {
  const playedCard = game.currentTrick.find((tc) => tc.playerId === you.id);

  return (
    <div
      className="rounded-xl p-2 flex items-center gap-3 transition-all"
      style={{
        background:
          "radial-gradient(ellipse at top, #76c893 50%, #34a0a4 85%, #1a759f 100%)",
        border: isYourTurn ? "2px solid #1a759f" : "1px solid #1e96fc",
        boxShadow: isYourTurn
          ? "0 0 12px rgba(59,130,246,0.35)"
          : "0 0 6px rgba(59,130,246,0.15)",
      }}
    >
      <Avatar id={you.id} name={you.name} size={44} online />
      <div>
        <div className="text-[#ffffff] font-bold text-sm">{you.name}</div>
        <ScoreNum v={you.totalScore} size="lg" />
      </div>
      {you.bid !== null && (
        <div className="ml-2 flex flex-col items-start">
          <span className="text-[#d62828] underline decoration-2 text-sm font-black">
            Bid: {you.bid}
          </span>
          <span className="text-[#3d348b] hover:underline decoration-2 underline-offset-3  font-bold text-xs">
            Won: {you.tricksWon}
          </span>
        </div>
      )}
      {isYourTurn && !youHasPlayed && (
        <span className="ml-2 text-[#072ac8] text-xs font-bold uppercase tracking-wider animate-pulse">
          Your Turn
        </span>
      )}
      {!isYourTurn && botThinking && game.phase === "playing" && (
        <span className="ml-2 text-[#ffbc42] text-xs">waiting...</span>
      )}
      {game.phase === "trick_result" && (
        <span className="ml-2 text-[#fca311] text-xs font-bold">
          Trick resolving...
        </span>
      )}
      {youHasPlayed && playedCard && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="ml-2 flex items-center gap-1.5"
        >
          <PlayingCard card={playedCard.card} size="sm" />
        </motion.div>
      )}
      <div className="ml-auto text-xs text-[#14213d] font-semibold">
        {you.hand.length} cards
      </div>
    </div>
  );
};
