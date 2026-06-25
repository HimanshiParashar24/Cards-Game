import React, { memo } from "react";
import type { Card, Suit } from "./types";

interface PlayingCardProps {
  card?: Card;
  size?: "xs" | "sm" | "md" | "lg";
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const PlayingCard = memo(
  ({
    card,
    size = "md",
    faceDown = false,
    selected = false,
    onClick,
    draggable = false,
    onDragStart,
  }: PlayingCardProps) => {
    const sizeMap = {
      xs: { w: 28, h: 40, rs: 8, ss: 7 },
      sm: { w: 40, h: 56, rs: 11, ss: 10 },
      md: { w: 56, h: 80, rs: 14, ss: 13 },
      lg: { w: 66, h: 96, rs: 17, ss: 15 },
    };
    const { w, h, rs, ss } = sizeMap[size];
    const isRed = card && (card.suit === "hearts" || card.suit === "diamonds");
    const sym: Record<Suit, string> = {
      spades: "♠",
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
    };

    const wrapperStyle: React.CSSProperties = {
      display: "inline-block",
      flexShrink: 0,
      cursor: draggable ? "grab" : onClick ? "pointer" : "default",
      borderRadius: 6,
      boxShadow: selected
        ? "0 0 30px rgba(239,68,68,1), 0 0 50px rgba(239,68,68,0.6)"
        : "0 4px 10px rgba(0,0,0,0.35)",
      transform: selected ? "translateY(-0.020px) scale(1.05)" : "translateY(0)",
      transition: "all 0.2s ease",
      willChange: "transform, box-shadow",
    };

    if (faceDown) {
      return (
        <div style={wrapperStyle} onClick={onClick}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <rect
              x={1}
              y={1}
              width={w - 2}
              height={h - 2}
              rx={4}
              fill="#1e3a5f"
              stroke="#3b6ea8"
              strokeWidth={1}
            />
            <rect
              x={3}
              y={3}
              width={w - 6}
              height={h - 6}
              rx={3}
              fill="none"
              stroke="#2d5a94"
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
            <text
              x={w / 2}
              y={h / 2 + 3}
              textAnchor="middle"
              fill="#2d5a94"
              fontSize={rs + 4}
              fontFamily="serif"
            >
              ♦
            </text>
          </svg>
        </div>
      );
    }
    if (!card) return null;

    const isFace = ["J", "Q", "K"].includes(card.rank);
    const faceGlyph = card.rank === "J" ? "♟" : card.rank === "Q" ? "♛" : "♚";
    const col = isRed ? "#a4133c" : "#111827";
    const faceBg = isRed ? "#fff5f5" : "#f0f4ff";
    const faceCol = isRed ? "#991b1b" : "#1e3a8a";

    return (
      <div
        style={wrapperStyle}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect
            x={1}
            y={1}
            width={w - 2}
            height={h - 2}
            rx={4}
            fill="white"
            stroke="#d1d5db"
            strokeWidth={1}
          />
          {selected && (
            <rect
              x={1}
              y={1}
              width={w - 2}
              height={h - 2}
              rx={4}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2.5}
            />
          )}
          <text
            x={4}
            y={rs + 2}
            fill={col}
            fontSize={rs}
            fontWeight="700"
            fontFamily="Arial,sans-serif"
          >
            {card.rank}
          </text>
          <text
            x={4}
            y={rs * 2 + 1}
            fill={col}
            fontSize={rs - 1}
            fontFamily="serif"
          >
            {sym[card.suit]}
          </text>
          {isFace ? (
            <>
              <rect
                x={5}
                y={rs * 2 + 4}
                width={w - 10}
                height={h - rs * 2 - rs - 6}
                rx={2}
                fill={faceBg}
              />
              <text
                x={w / 2}
                y={h / 2 + 2}
                textAnchor="middle"
                fill={faceCol}
                fontSize={ss * 2.3}
                fontFamily="serif"
                fontWeight="bold"
              >
                {faceGlyph}
              </text>
              <text
                x={w / 2}
                y={h / 2 + ss * 1.8}
                textAnchor="middle"
                fill={col}
                fontSize={ss * 0.9}
                fontFamily="serif"
              >
                {sym[card.suit]}
              </text>
            </>
          ) : (
            <text
              x={w / 2}
              y={h / 2 + ss * 0.5}
              textAnchor="middle"
              fill={col}
              fontSize={ss * 2}
              fontFamily="serif"
            >
              {sym[card.suit]}
            </text>
          )}
          <text
            x={w - 4}
            y={h - 4}
            textAnchor="end"
            fill={col}
            fontSize={rs - 1}
            fontWeight="700"
            fontFamily="Arial,sans-serif"
            transform={`rotate(180,${w - 4},${h - 4})`}
          >
            {card.rank}
          </text>
        </svg>
      </div>
    );
  },
);

PlayingCard.displayName = "PlayingCard";
