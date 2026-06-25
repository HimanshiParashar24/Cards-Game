import React from "react";
import { PlayingCard } from "./PlayingCard";

interface CardStackProps {
  count?: number;
  size?: "xs" | "sm";
}

export const CardStack = ({ count = 3, size = "xs" }: CardStackProps) => {
  const n = Math.min(count, 13);
  const cardW = size === "xs" ? 28 : 40;
  const cardH = size === "xs" ? 40 : 56;
  if (n === 0) return <span className="text-gray-500 text-xs">No cards</span>;
  return (
    <div
      className="relative"
      style={{ height: cardH + 8, width: cardW + (n - 1) * 5 }}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: i * 5, bottom: 0, zIndex: i }}
        >
          <PlayingCard faceDown size={size} />
        </div>
      ))}
    </div>
  );
};
