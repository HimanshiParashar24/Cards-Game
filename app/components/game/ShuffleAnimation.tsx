import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import type { Suit, Rank } from "./types";
import { SUITS, RANKS } from "./types";

export const ShuffleAnimation = () => {
  const cards = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        suit: SUITS[Math.floor(Math.random() * 4)] as Suit,
        rank: RANKS[Math.floor(Math.random() * 13)] as Rank,
      })),
    [],
  );

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.75), rgba(0,0,0,0.95))",
      }}
    >
      <div className="relative w-72 h-72 flex items-center justify-center">
        {cards.map((c) => (
          <motion.div
            key={c.id}
            initial={{
              opacity: 0,
              scale: 0.5,
              rotate: Math.random() * 40 - 20,
              x: Math.random() * 160 - 80,
              y: Math.random() * 160 - 80,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              x: 0,
              y: 0,
              transition: { type: "spring", stiffness: 180, damping: 18 },
            }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
            style={{ position: "absolute" }}
          >
            <PlayingCard card={c} size="md" />
          </motion.div>
        ))}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute -bottom-8 text-white font-black text-lg tracking-widest uppercase"
          style={{ textShadow: "0 2px 8px rgba(255,255,255,0.4)" }}
        >
          Shuffling...
        </motion.p>
      </div>
    </motion.div>
  );
};
