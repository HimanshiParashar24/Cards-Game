import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card, PlayerState } from "./types";
import { PlayingCard } from "./PlayingCard";

interface PlayerHandProps {
  you: PlayerState;
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
  validCardKeys: Set<string>;
  isCardInteractable: boolean;
  isYourTurn: boolean;
  youHasPlayed: boolean;
  handleTouchStart: (card: Card) => (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  humanPlay: () => void;
}

export const PlayerHand = ({
  you,
  selectedCard,
  setSelectedCard,
  validCardKeys,
  isCardInteractable,
  isYourTurn,
  youHasPlayed,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  humanPlay,
}: PlayerHandProps) => {
  return (
    <div
      className="rounded-2xl p-2 md:p-3"
      style={{
        background: "#ffffff",
        border: "1px solid #0077b6 ",
        boxShadow: "0 0 12px #114aa8 ",
      }}
    >
      {you.hand.length === 0 ? (
        <div className="text-center text-gray-500 py-4 text-sm">
          No cards remaining
        </div>
      ) : (
        <div className="flex items-end justify-center flex-wrap gap-0.5 pb-1">
          <AnimatePresence>
            {you.hand.map((card, i) => {
              const isSel =
                selectedCard?.rank === card.rank &&
                selectedCard?.suit === card.suit;
              const key = `${card.rank}-${card.suit}`;
              const isValidToPlay = validCardKeys.has(key);
              return (
                <motion.div
                  key={key}
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    rotate: Math.random() * 10 - 5,
                  }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.5,
                    transition: { duration: 0.15 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: i * 0.03,
                  }}
                  style={{
                    marginLeft: i > 0 ? -10 : 0,
                    zIndex: isSel ? 50 : i,
                    position: "relative",
                    opacity: !isCardInteractable
                      ? 0.6
                      : isCardInteractable && !isValidToPlay
                        ? 0.4
                        : 1,
                    filter: !isCardInteractable
                      ? "grayscale(60%)"
                      : isCardInteractable && !isValidToPlay
                        ? "grayscale(60%)"
                        : "none",
                  }}
                >
                  <div
                    onTouchStart={
                      isCardInteractable ? handleTouchStart(card) : undefined
                    }
                    onTouchMove={isCardInteractable ? handleTouchMove : undefined}
                    onTouchEnd={isCardInteractable ? handleTouchEnd : undefined}
                    style={{ touchAction: "none" }}
                  >
                    <PlayingCard
                      card={card}
                      size="lg"
                      selected={isSel}
                      onClick={
                        isCardInteractable
                          ? () => {
                              setSelectedCard(card);
                              // We use setTimeout to allow state update or call humanPlay next tick
                              setTimeout(() => humanPlay(), 0);
                            }
                          : undefined
                      }
                      draggable={isCardInteractable}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "text/plain",
                          `${card.rank}-${card.suit}`,
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {isYourTurn && !youHasPlayed && (
        <div className="text-center mt-1 text-xs text-[#f06] font-semibold uppercase tracking-wider">
          {selectedCard
            ? `${selectedCard.rank} of ${selectedCard.suit} selected — Click a card to play it, or drag it onto the table`
            : "Click a card to play it, or drag it onto the table"}
        </div>
      )}
    </div>
  );
};
