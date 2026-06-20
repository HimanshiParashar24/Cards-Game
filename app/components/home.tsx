

"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { redirect } from "react-router";
import WinEffect from "./WinEffect";


// ─────────────────────────────────────────────────────────────────────────────
// SOUND ENGINE (synthetic – no external files needed)
// ─────────────────────────────────────────────────────────────────────────────
type SoundName =
  | "cardPlay"
  | "trickWin"
  | "bidPlaced"
  | "roundEnd"
  | "gameWin"
  | "gameLose"
  | "shuffle"
  | "toast";

let audioCtx: AudioContext | null = null;



//const shuffleAudio = new Audio("/sound/shufflesound.mp3");

function getAudioContext(): AudioContext {

   
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}


function noiseBurst(
  duration: number,
  volume: number,
  ctx: AudioContext,
  now: number,
) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  source.connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);
}

function playSound(name: SoundName) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (name) {
      
        case "cardPlay": {
        const audio = new Audio("/CardsT.mp3");
        audio.onloadeddata = () => {};
        audio.onerror = () => {};
          audio.play()
          .then(() => console.log("audio playing"))
          .catch((err) => console.log("play failed", err));
      
        break;
      }

      case "trickWin": {
        console.log("NEW TRICK WIN SOUND");
        const audio = new Audio("/sound/TrickW.wav");
        audio.volume = 0.8;
        audio.play().catch(console.error);
        break;
      }


      case "bidPlaced": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case "roundEnd": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case "gameWin": {
         const audio = new Audio("/sound/WinS.wav");
         audio.volume = 1;
       
         audio.loop = true; // 🔥 sound repeat hoga
       
         audio.play().catch(console.error);
       
         // ⏱️ stop after 4 seconds
         setTimeout(() => {
           audio.pause();
           audio.currentTime = 0;
         }, 10000);
       
         break;
       }
       
         case "gameLose": {
           const audio = new Audio("/sound/LoseS.wav");
           audio.volume = 1;
           audio.play().catch(console.error);
           break;
         }


        case "shuffle": {
         console.log("shuffle called");
       
         const audio = new Audio("/sound/shufflesound.mp3");
         audio.play().catch(console.error);
       
         break;
         }
      
        case "toast": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  } catch {
    // Audio not supported or blocked – silently ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
type GamePhase =
  | "bidding"
  | "playing"
  | "trick_result"
  | "round_result"
  | "game_over";

interface Card {
  rank: Rank;
  suit: Suit;
}
interface PlayedCard {
  card: Card;
  playerId: string;
}

interface PlayerState {
  id: string;
  name: string;
  totalScore: number;
  roundScore: number;
  hand: Card[];
  isHuman: boolean;
  isOnline: boolean;
  bid: number | null;
  tricksWon: number;
}

interface TrickRecord {
  plays: PlayedCard[];
  winnerId: string;
}

interface RoundResult {
  round: number;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  scores: Record<string, number>;
}

interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  trumpSuit: Suit;
  players: PlayerState[];
  currentTurnIndex: number;
  currentTrick: PlayedCard[];
  completedTricks: TrickRecord[];
  roundResults: RoundResult[];
  lastTrickWinner: string | null;
  winnerMessage: string;
  gameWinnerId: string | null;
  biddingIndex: number;
  turnToken: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const RANK_VALUE: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};
const TARGET_SCORE = 40;
const TOTAL_ROUNDS = 5;
const CARDS_PER_HAND = 13;
//const TRUMP_SUIT: Suit = "spades";
const BOT_DELAYS = { think: 1000, play: 1200, bid: 1000 };
const TRICK_RESULT_DELAY = 2000;

// ─────────────────────────────────────────────────────────────────────────────
// DECK ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealHands(numPlayers: number, cardsEach: number): Card[][] {
  const deck = shuffle(buildDeck());
  return Array.from({ length: numPlayers }, (_, i) =>
    deck.slice(i * cardsEach, (i + 1) * cardsEach),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRICK RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────
function trickWinner(plays: PlayedCard[], trump: Suit): string {
  if (plays.length === 0) return "";
  const ledSuit = plays[0].card.suit;
  let best = plays[0];
  for (let i = 1; i < plays.length; i++) {
    const challenger = plays[i];
    const bestIsTrump = best.card.suit === trump;
    const chalIsTrump = challenger.card.suit === trump;

    if (chalIsTrump && !bestIsTrump) {
      best = challenger;
    } else if (bestIsTrump && !chalIsTrump) {
      // best stays
    } else if (chalIsTrump && bestIsTrump) {
      if (RANK_VALUE[challenger.card.rank] > RANK_VALUE[best.card.rank])
        best = challenger;
    } else {
      const chalIsLed = challenger.card.suit === ledSuit;
      const bestIsLed = best.card.suit === ledSuit;
      if (chalIsLed && !bestIsLed) {
        best = challenger;
      } else if (chalIsLed && bestIsLed) {
        if (RANK_VALUE[challenger.card.rank] > RANK_VALUE[best.card.rank])
          best = challenger;
      }
    }
  }
  return best.playerId;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function calculateRoundScore(bid: number, tricksWon: number): number {
  if (tricksWon >= bid) return bid;
  return -bid;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT AI
// ─────────────────────────────────────────────────────────────────────────────
function getValidCards(hand: Card[], trick: PlayedCard[], trump: Suit): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = trick[0].card.suit;
  const sameSuit = hand.filter((c) => c.suit === ledSuit);
  if (sameSuit.length > 0) return sameSuit;
  return hand;
}

function botBid(hand: Card[], trump: Suit): number {
  let estimate = 0;
  const trumpCards = hand.filter((c) => c.suit === trump);
  const highTrump = trumpCards.filter((c) => RANK_VALUE[c.rank] >= 11);
  estimate += highTrump.length;
  const highNonTrump = hand.filter(
    (c) => c.suit !== trump && RANK_VALUE[c.rank] >= 13,
  );
  estimate += highNonTrump.length;
  return Math.max(1, Math.min(estimate, 8));
}

function botDecide(
  hand: Card[],
  trump: Suit,
  trick: PlayedCard[],
  bid: number,
  tricksWon: number,
): Card {
  const valid = getValidCards(hand, trick, trump);
  const needsMore = tricksWon < bid;
  if (needsMore) {
    const trumpInValid = valid.filter((c) => c.suit === trump);
    if (trumpInValid.length > 0) {
      return trumpInValid.sort(
        (a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank],
      )[0];
    }
    return valid.sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank])[0];
  }
  return valid.sort((a, b) => RANK_VALUE[a.rank] - RANK_VALUE[b.rank])[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────
function createInitialState(): GameState {
  const hands = dealHands(4, CARDS_PER_HAND);
  const players: PlayerState[] = [
    {
      id: "you",
      name: "You",
      totalScore: 0,
      roundScore: 0,
      hand: hands[0],
      isHuman: true,
      isOnline: true,
      bid: null,
      tricksWon: 0,
    },
    {
      id: "rohan",
      name: "Rohan",
      totalScore: 0,
      roundScore: 0,
      hand: hands[1],
      isHuman: false,
      isOnline: true,
      bid: null,
      tricksWon: 0,
    },
    {
      id: "aman",
      name: "Aman",
      totalScore: 0,
      roundScore: 0,
      hand: hands[2],
      isHuman: false,
      isOnline: true,
      bid: null,
      tricksWon: 0,
    },
    {
      id: "sneha",
      name: "Sneha",
      totalScore: 0,
      roundScore: 0,
      hand: hands[3],
      isHuman: false,
      isOnline: true,
      bid: null,
      tricksWon: 0,
    },
  ];
  return {
    phase: "bidding",
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    trumpSuit: "spades",
    players,
    currentTurnIndex: 0,
    currentTrick: [],
    completedTricks: [],
    roundResults: [],
    lastTrickWinner: null,
    winnerMessage: "",
    gameWinnerId: null,
    biddingIndex: 0,
    turnToken: "init",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG PLAYING CARD
// ─────────────────────────────────────────────────────────────────────────────
const PlayingCard = memo(
  ({
    card,
    size = "md",
    faceDown = false,
    selected = false,
    onClick,
    draggable = false,
    onDragStart,
  }: {
    card?: Card;
    size?: "xs" | "sm" | "md" | "lg";
    faceDown?: boolean;
    selected?: boolean;
    onClick?: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  }) => {
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

    const shadow = selected ? "0 0 12px #facc15" : "0 3px 8px rgba(0,0,0,0.5)";

      const wrapperStyle: React.CSSProperties = {
        display: "inline-block",
        flexShrink: 0,
        cursor: draggable ? "grab" : onClick ? "pointer" : "default",
        borderRadius: 6,
         boxShadow: selected
           ? "0 0 30px rgba(239,68,68,1), 0 0 50px rgba(239,68,68,0.6)"
           : "0 4px 10px rgba(0,0,0,0.35)",
         
         transform: selected
           ? "translateY(-0.020px) scale(1.05)"
           : "translateY(0)",
      
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

// ─────────────────────────────────────────────────────────────────────────────
// SHUFFLE ANIMATION
// ─────────────────────────────────────────────────────────────────────────────
const ShuffleAnimation = () => {
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

// ─────────────────────────────────────────────────────────────────────────────
// CARD STACK
// ─────────────────────────────────────────────────────────────────────────────
const CardStack = ({
  count = 3,
  size = "xs",
}: {
  count?: number;
  size?: "xs" | "sm";
}) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR, SCORE, LOGO
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  you: { bg: "#2d1b4e", border: "#b794f4", text: "#b794f4" },
  rohan: { bg: "#1a3a5c", border: "#63b3ed", text: "#63b3ed" },
  aman: { bg: "#1a2c1a", border: "#68d391", text: "#68d391" },
  sneha: { bg: "#3d1a1a", border: "#fc8181", text: "#fc8181" },
};

const Avatar = ({
  id,
  name,
  size = 44,
  online = false,
}: {
  id: string;
  name: string;
  size?: number;
  online?: boolean;
}) => {
  const c = AVATAR_COLORS[id] || {
    bg: "#2a2a3e",
    border: "#a0aec0",
    text: "#a0aec0",
  };
  const initials = name === "You" ? "YO" : name.slice(0, 2).toUpperCase();
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full flex items-center justify-center font-bold"
        style={{
          width: size,
          height: size,
          background: c.bg,
          border: `2px solid ${c.border}`,
          color: c.text,
          fontSize: size * 0.33,
        }}
      >
        {initials}
      </div>
      {online && (
        <div
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: "#48bb78",
            border: "2px solid #071510",
          }}
        />
      )}
    </div>
  );
};

const ScoreNum = ({ v, size = "lg" }: { v: number; size?: "sm" | "lg" }) => (
  <span
    style={{
      color: v >= 0 ? "#5BDB6F" : "#FF6B6B",
      fontWeight: 900,
      fontSize: size === "lg" ? 20 : 13,
    }}
  >
    {v >= 0 ? "+" : ""}
    {v}
  </span>
);

const Logo = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex flex-col items-center">
    {!compact && (
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center font-black text-white text-sm">
          ♠
        </div>
        <svg width={48} height={32} viewBox="0 0 48 32">
          <rect
            x={1}
            y={1}
            width={20}
            height={30}
            rx={3}
            fill="white"
            stroke="#ccc"
            strokeWidth={1}
          />
          <text
            x={4}
            y={14}
            fill="#111"
            fontSize={10}
            fontWeight="700"
            fontFamily="Arial"
          >
            A
          </text>
          <text
            x={10}
            y={26}
            fill="#111"
            fontSize={12}
            textAnchor="middle"
            fontFamily="serif"
          >
            ♠
          </text>
          <rect
            x={27}
            y={1}
            width={20}
            height={30}
            rx={3}
            fill="white"
            stroke="#ccc"
            strokeWidth={1}
          />
          <text
            x={30}
            y={14}
            fill="#DC2626"
            fontSize={10}
            fontWeight="700"
            fontFamily="Arial"
          >
            K
          </text>
          <text
            x={37}
            y={26}
            fill="#DC2626"
            fontSize={12}
            textAnchor="middle"
            fontFamily="serif"
          >
            ♥
          </text>
        </svg>
        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center font-black text-white text-sm">
          B
        </div>
      </div>
    )}
    <div className="flex items-center">
      <span
        className="font-black tracking-wide"
        style={{
          color: "#0077b6",
          fontSize: compact ? 18 : 26,
          textShadow: "0 2px 8px rgba(91,219,111,0.4)",
        }}
      >
        CALL
      </span>
      <span
        className="font-black mx-0.5"
        style={{ color: "white", fontSize: compact ? 18 : 26 }}
      >
        {" "}
      </span>
      <span
        className="font-black tracking-wide"
        style={{
          color: "#FF6B6B",
          fontSize: compact ? 18 : 26,
          textShadow: "0 2px 8px rgba(255,107,107,0.4)",
        }}
      >
        BREAKER
      </span>
    </div>
    {!compact && (
      <div className="text-gray-500 text-xs uppercase tracking-widest mt-0.5 border-t border-b border-white/10 px-4 py-0.5">
        ♠ Spades are always trump · First to {TARGET_SCORE} pts wins
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({
  msg,
  type,
}: {
  msg: string;
  type: "success" | "error" | "info";
}) => {
  const colors = { success: "#5BDB6F", error: "#FF6B6B", info: "#818cf8" };
  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-white text-sm pointer-events-none"
      style={{
        background: "rgba(10,10,20,0.95)",
        border: `1px solid ${colors[type]}`,
        boxShadow: `0 4px 24px ${colors[type]}44`,
        color: colors[type],
      }}
    >
      {msg}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BID MODAL
// ─────────────────────────────────────────────────────────────────────────────

    const BidModal = ({
    players,
    biddingIndex,
    onBid,
    selectedTrump,
    setSelectedTrump,
  }: {
    players: PlayerState[];
    biddingIndex: number;
    onBid: (bid: number) => void;
    selectedTrump: Suit | null;
    setSelectedTrump: React.Dispatch<
      React.SetStateAction<Suit | null>
    >;
  }) => {
   const [selectedBid, setSelectedBid] = useState<number>(
    selectedTrump ? 5 : 1
   );
    const currentBidder = players[biddingIndex];
    if (!currentBidder) return null;

  const isHuman = currentBidder.isHuman;
  const humanPlayer = players.find((p) => p.isHuman);
  const humanHand = humanPlayer?.hand ?? [];
  const placedBids = players.filter((p) => p.bid !== null);

  const BID_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const mustBidFiveOrMore = !!selectedTrump;
  useEffect(() => {
  if (selectedTrump) {
    setSelectedBid(5);
  }
  }, [selectedTrump]);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="w-full bg-white shadow-2xl shadow-blue-400 scrollbar-hide max-w-md rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        style={{
          background: "",
          border: "1px solid rgba(91,219,111,0.35)",
        }}
      >
        <div className="text-center ">
          <div className="text-3xl mb-1">🃏</div>
          <div className="text-[#023e7d] font-black  text-xl">
            Place Your Bid !
          </div>
          <div className="text-[#00a6fb] text-sm mt-1">
            {isHuman
              ? "How many tricks will you win this round?"
              : `${currentBidder.name} is bidding...`}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
            Bidding ({placedBids.length} / {players.length} done)
          </div>
          {players.map((p, idx) => {
            const isDone = p.bid !== null;
            const isCurrent = idx === biddingIndex;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                style={{
                  background: isCurrent
                    ? "rgba(59,130,245,0.15)"
                    : "#e9ecef",
                    
                  border: isCurrent
                    ? "1px solid rgba(59,130,245,0.15)"
                    : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <Avatar id={p.id} name={p.name} size={28} />
                  <span className="text-[#0353a4]  text-sm font-semibold">
                    {p.name}
                  </span>
                  {isCurrent && !isDone && (
                    <span className="text-[#00a6fb] text-xs animate-pulse">
                      ● now
                    </span>
                  )}
                </div>
                {isDone ? (
                  <span className="text-[#ef8354] font-black text-base">
                    {p.bid}
                  </span>
                ) : isCurrent && !p.isHuman ? (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#00a6fb] animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#00a6fb]  animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#00a6fb]  animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                ) : (
                  <span className="text-gray-600 text-sm">—</span>
                )}
              </div>
            );
          })}
        </div>

        {isHuman && humanHand.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[#0353a4] font-bold text-xs uppercase tracking-wider">
              Select a Trump Card
            </div>
            <div
              className="flex flex-wrap justify-center gap-1 scrollbar-hide scroll-slick max-h-32 overflow-y-auto p-2 rounded-xl"
              style={{
                background: "#e9ecef",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
                    
              {humanHand.map((card) => (
              <motion.div
                  key={`${card.rank}-${card.suit}`}
                  animate={{
                    y: selectedTrump === card.suit ? -2 : 0,
                    scale: selectedTrump === card.suit ? 1.01 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                  }}
                >
                  <PlayingCard
                    card={card}
                    size="sm"
                    selected={selectedTrump === card.suit}
                    onClick={() => setSelectedTrump(card.suit)}
                  />
                </motion.div>
                    ))}
                   </div>
                  
            <p className="text-[#c9184a] text-[10px] text-center font-bold">
             {selectedTrump
               ? `Selected Trump: ${selectedTrump.toUpperCase()}`
               : "Click on any card to select the trump"}
           </p>
          </div>
        )}


        {isHuman ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="text-[#0353a4] text-xs font-bold tracking-wider">
                YOUR BID{" "}
                <span className="text-[#00a6fb] ">(min 1 - max 8)</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
    
                    {BID_OPTIONS.map((b) => (
                      <button
                        key={b}
                        disabled={mustBidFiveOrMore && b < 5}
                       
                        onClick={() => {
                       if (mustBidFiveOrMore && b < 5) return;
                        
                          playSound("bidPlaced");
                          setSelectedBid(b);
                        }}
                    className="py-3 rounded-xl font-black text-lg transition-all active:scale-95"
                    style={{
                      opacity: mustBidFiveOrMore && b < 5 ? 0.4 : 1,
                      cursor: mustBidFiveOrMore && b < 5 ? "not-allowed" : "pointer",
                      background:
                        selectedBid === b
                          ? "rgba(59,130,245,0.15)"
                          : "#e9ecef",
                      border:
                        selectedBid === b
                          ? "2px solid #00a6fb"
                          : "1px solid rgba(255,255,255,0.12)",
                      color: selectedBid === b ? "#00a6fb" : "#4a4e69",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="text-center text-gray-400 text-xs mt-1">
                ♠ Spades are trump. Higher bid = higher risk & reward.
              </div>
            </div>
             <button
              disabled={false}
              onClick={() => {
                 const trumpSuit = selectedTrump ?? "spades";
               
                 onBid(selectedBid);
               }}
              className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:brightness-110 cursor-pointer active:scale-95"
              style={{
                background: "linear-gradient(135deg,#00a6fb,#0353a4)",
                boxShadow: "0 4px 18px rgba(34,197,94,0.35)",
              }}
            >
              Bid {selectedBid} Trick{selectedBid !== 1 ? "s" : ""}
            </button> 

          </>
        ) : null}
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GAME COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CallBreakerGame() {
  const [game, setGame] = useState<GameState>(createInitialState);
  const [selectedTrump, setSelectedTrump] = useState<Suit | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false); // new flag for game over modal visibility
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDealing, setIsDealing] = useState(true); // start with shuffle on load
  const [dragOverTable, setDragOverTable] = useState(false);
  const [ghostCard, setGhostCard] = useState<{
    card: Card;
    x: number;
    y: number;
  } | null>(null);

  const botTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dealingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickResultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  
 

  // ── Toast wrapper with sound ──────────────────────────────────────────────
  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" = "info") => {
      setToast({ msg, type });
      playSound("toast");
      setTimeout(() => setToast(null), 2200);
    },
    [],
  );

  const checkGameWinner = useCallback(
    (players: PlayerState[]): string | null => {
      const winner = players.find((p) => p.totalScore >= TARGET_SCORE);
      if (winner) return winner.id;
      return null;
    },
    [],
  );

  // ── Resolve a completed trick from current state ─────────────────────────
  const resolveTrickFromState = useCallback(
    (prev: GameState): GameState => {
      const trick = prev.currentTrick;
      const winnerId = trickWinner(trick, prev.trumpSuit);
      const winnerName =
        prev.players.find((p) => p.id === winnerId)?.name ?? "?";

      const updatedPlayers = prev.players.map((p) =>
        p.id === winnerId ? { ...p, tricksWon: p.tricksWon + 1 } : p,
      );
      const trickRecord: TrickRecord = { plays: trick, winnerId };
      const newCompleted = [...prev.completedTricks, trickRecord];
      const allTricksDone = newCompleted.length === CARDS_PER_HAND;

      let nextState: GameState = {
        ...prev,
        players: updatedPlayers,
        currentTrick: [],
        completedTricks: newCompleted,
        lastTrickWinner: winnerId,
        winnerMessage: `${winnerName} wins the trick!`,
        turnToken: prev.turnToken + 1,
        phase: "playing",
      };

      if (allTricksDone) {
        const bids: Record<string, number> = {};
        const tricksWon: Record<string, number> = {};
        const scores: Record<string, number> = {};
        for (const p of updatedPlayers) {
          bids[p.id] = p.bid ?? 0;
          tricksWon[p.id] = p.tricksWon;
          scores[p.id] = calculateRoundScore(p.bid ?? 0, p.tricksWon);
        }
        const roundResult: RoundResult = {
          round: prev.currentRound,
          bids,
          tricksWon,
          scores,
        };
        const roundPlayers = updatedPlayers.map((p) => ({
          ...p,
          roundScore: scores[p.id],
          totalScore: p.totalScore + scores[p.id],
        }));
        const gameWinner = checkGameWinner(roundPlayers);
        const leader = [...roundPlayers].sort(
          (a, b) => b.tricksWon - a.tricksWon,
        )[0];
        nextState = {
          ...nextState,
          players: roundPlayers,
          phase: gameWinner ? "game_over" : "round_result",
          roundResults: [...prev.roundResults, roundResult],
          winnerMessage: `Round ${prev.currentRound} complete! ${leader.name} led.`,
          gameWinnerId: gameWinner,
        };
      } else {
        const winnerIdx = updatedPlayers.findIndex((p) => p.id === winnerId);
        nextState.currentTurnIndex = winnerIdx;
      }

      return nextState;
    },
    [checkGameWinner],
  );

  // ── Process a single bid (sound added) ───────────────────────────────────
  
  const processBid = useCallback(
  (bid: number) => {
    setGame((prev) => {
      if (prev.phase !== "bidding") return prev;

      const biddingPlayer = prev.players[prev.biddingIndex];
      if (!biddingPlayer) return prev;

      const updatedPlayers = prev.players.map((p, idx) =>
        idx === prev.biddingIndex ? { ...p, bid } : p
      );

      const nextBiddingIndex = prev.biddingIndex + 1;
      const allBid = nextBiddingIndex >= prev.players.length;

      return {
        ...prev,
        trumpSuit: selectedTrump ?? prev.trumpSuit, // 🔥 ADD THIS
        players: updatedPlayers,
        biddingIndex: nextBiddingIndex,
        phase: allBid ? "playing" : "bidding",
        currentTurnIndex: 0,
        turnToken: `${Date.now()}_${Math.random()}`,
      };
    });

    playSound("bidPlaced");
  },
  [selectedTrump] // 🔥 ADD THIS
  );
  // ── Auto-bid for bots ────────────────────────────────────────────────────
  useEffect(() => {
    if (game.phase !== "bidding") return;
    const biddingPlayer = game.players[game.biddingIndex];
    if (!biddingPlayer || biddingPlayer.isHuman) return;

    if (bidTimer.current) clearTimeout(bidTimer.current);
    bidTimer.current = setTimeout(() => {
      const bid = botBid(biddingPlayer.hand, game.trumpSuit);
      processBid(bid);
      showToast(`${biddingPlayer.name} bids ${bid}`, "info");
    }, BOT_DELAYS.bid);

    return () => {
      if (bidTimer.current) clearTimeout(bidTimer.current);
    };
  }, [
    game.biddingIndex,
    game.phase,
    game.trumpSuit,
    game.players,
    processBid,
    showToast,
  ]);

  // ── Auto-show round result modal + round end sound ───────────────────────
  useEffect(() => {
    if (game.phase === "round_result") {
      setShowRoundModal(true);
      playSound("roundEnd");
    }
  }, [game.phase]);

  // ── Game over sound & modal flag ─────────────────────────────────────────
 useEffect(() => {
  if (game.phase === "game_over") {
    setShowGameOverModal(true);

    if (game.gameWinnerId === "you") {
      playSound("gameWin");

      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } else {
      playSound("gameLose");
    }
  }
}, [game.phase, game.gameWinnerId]);

  // ── Shuffle sound when dealing starts ────────────────────────────────────
  useEffect(() => {
    if (isDealing) {
      const timer = setTimeout(() => playSound("shuffle"), 100);
      return () => clearTimeout(timer);
    }
  }, [isDealing]);

  // ── Initial shuffle on mount ─────────────────────────────────────────────
  useEffect(() => {
    setIsDealing(true);
    const initTimer = setTimeout(() => {
      setIsDealing(false);
      // game state is already set; just finish the shuffle
    }, 5000);
    return () => clearTimeout(initTimer);
  }, []);

  // ── Start next round ─────────────────────────────────────────────────────
  const startNextRound = useCallback(() => {
    if (game.currentRound >= game.totalRounds) {
      const sorted = [...game.players].sort(
        (a, b) => b.totalScore - a.totalScore,
      );
      setGame((g) => ({
        ...g,
        phase: "game_over",
        gameWinnerId: sorted[0].id,
      }));
      return;
    }

    if (dealingTimer.current) clearTimeout(dealingTimer.current);
    setShowRoundModal(false); // hide immediately
    setIsDealing(true);

    dealingTimer.current = setTimeout(() => {
      const hands = dealHands(4, CARDS_PER_HAND);
      setGame((g) => ({
        ...g,
        phase: "bidding",
        currentRound: g.currentRound + 1,
        players: g.players.map((p, i) => ({
          ...p,
          hand: hands[i],
          roundScore: 0,
          bid: null,
          tricksWon: 0,
        })),
        currentTurnIndex: 0,
        currentTrick: [],
        completedTricks: [],
        lastTrickWinner: null,
        winnerMessage: "",
        biddingIndex: 0,
        turnToken: `${Date.now()}_${Math.random()}`,
      }));
      setSelectedCard(null);
      setShowRoundModal(false);
      setIsDealing(false);
      setBotThinking(false);
    }, 1800);
  }, [game.currentRound, game.totalRounds, game.players]);

  // ── Play a card (human) with sound ──────────────────────────────────────
  const playCard = useCallback(
    (card: Card) => {
      if (game.phase !== "playing") return;
      if (botThinking) {
        showToast("Wait for bot to play!", "error");
        return;
      }
      const currentPlayer = game.players[game.currentTurnIndex];
      if (!currentPlayer?.isHuman) {
        showToast("Not your turn!", "error");
        return;
      }

      const valid = getValidCards(
        currentPlayer.hand,
        game.currentTrick,
        game.trumpSuit,
      );
      const isValid = valid.some(
        (c) => c.rank === card.rank && c.suit === card.suit,
      );
      if (!isValid) {
        showToast("You must follow suit!", "error");
        return;
      }

       console.log("cardPlay called");
       //playSound("cardPlay");
      playSound("cardPlay");
      setSelectedCard(null);

      setGame((prev) => {
        const player = prev.players[prev.currentTurnIndex];
        if (!player?.isHuman) return prev;
        const newHand = player.hand.filter(
          (c) => !(c.rank === card.rank && c.suit === card.suit),
        );
        const play: PlayedCard = { card, playerId: player.id };
        const newTrick = [...prev.currentTrick, play];
        const updatedPlayers = prev.players.map((p) =>
          p.id === player.id ? { ...p, hand: newHand } : p,
        );

        // If trick is now complete -> enter trick_result phase and clear winnerMessage
        if (newTrick.length >= prev.players.length) {
          return {
            ...prev,
            players: updatedPlayers,
            currentTrick: newTrick,
            phase: "trick_result",
            winnerMessage: "",
            turnToken: `${Date.now()}_${Math.random()}`,
          };
        } else {
          return {
            ...prev,
            players: updatedPlayers,
            currentTrick: newTrick,
            currentTurnIndex: (prev.currentTurnIndex + 1) % prev.players.length,
            turnToken: `${Date.now()}_${Math.random()}`,
          };
        }
      });
    },
    [game, botThinking, showToast],
  );

  const humanPlay = useCallback(() => {
    if (!selectedCard) return;
    playCard(selectedCard);
  }, [selectedCard, playCard]);

  // ── New Game ─────────────────────────────────────────────────────────────
  const newGame = useCallback(() => {
    if (botTimer.current) clearTimeout(botTimer.current);
    if (dealingTimer.current) clearTimeout(dealingTimer.current);
    if (bidTimer.current) clearTimeout(bidTimer.current);
    if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    setBotThinking(false);
    setSelectedCard(null);
    setShowRoundModal(false);
    setShowGameOverModal(false); // hide game-over modal immediately
    setDragOverTable(false);
    setGhostCard(null);

    setIsDealing(true);
    dealingTimer.current = setTimeout(() => {
      setGame(createInitialState());
      setIsDealing(false);
    }, 1800);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
      if (dealingTimer.current) clearTimeout(dealingTimer.current);
      if (bidTimer.current) clearTimeout(bidTimer.current);
      if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    };
  }, []);

  // ── BOT TURN EFFECT (plays card sound) ───────────────────────────────────
  useEffect(() => {
    if (game.phase !== "playing") return;
    const current = game.players[game.currentTurnIndex];
    if (!current || current.isHuman) return;

    setBotThinking(true);
    botTimer.current = setTimeout(() => {
      setGame((prev) => {
        const bot = prev.players[prev.currentTurnIndex];
        if (!bot || bot.isHuman || prev.phase !== "playing") {
          setBotThinking(false);
          return prev;
        }

        const card = botDecide(
          bot.hand,
          prev.trumpSuit,
          prev.currentTrick,
          bot.bid ?? 0,
          bot.tricksWon,
        );

        playSound("cardPlay");

        const newHand = bot.hand.filter(
          (c) => !(c.rank === card.rank && c.suit === card.suit),
        );
        const play: PlayedCard = { card, playerId: bot.id };
        const newTrick = [...prev.currentTrick, play];
        const updatedPlayers = prev.players.map((p) =>
          p.id === bot.id ? { ...p, hand: newHand } : p,
        );

        if (newTrick.length < prev.players.length) {
          setBotThinking(false);
          return {
            ...prev,
            players: updatedPlayers,
            currentTrick: newTrick,
            currentTurnIndex: (prev.currentTurnIndex + 1) % prev.players.length,
            turnToken: `${Date.now()}_${Math.random()}`,
          };
        } else {
          setBotThinking(false);
          return {
            ...prev,
            players: updatedPlayers,
            currentTrick: newTrick,
            phase: "trick_result",
            winnerMessage: "",
            turnToken: `${Date.now()}_${Math.random()}`,
          };
        }
      });
    }, BOT_DELAYS.play);

    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
      setBotThinking(false);
    };
  }, [game.turnToken, game.phase, game.players, game.currentTurnIndex]);

  // ── TRICK RESULT RESOLUTION (plays trick win sound after delay) ──────────
  useEffect(() => {
    if (game.phase !== "trick_result") return;

    if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    const winnerId = trickWinner(game.currentTrick, game.trumpSuit);
    const winnerName = game.players.find((p) => p.id === winnerId)?.name ?? "?";
    showToast(`${winnerName} wins the trick!`, "success");

    trickResultTimer.current = setTimeout(() => {
      playSound("trickWin");
      setGame((prev) => resolveTrickFromState(prev));
    }, TRICK_RESULT_DELAY);

    return () => {
      if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    };
  }, [
    game.phase,
    game.currentTrick,
    game.trumpSuit,
    game.players,
    resolveTrickFromState,
    showToast,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────
  const you = game.players.find((p) => p.id === "you")!;
  const opponents = game.players.filter((p) => !p.isHuman);
  const isYourTurn =
    game.phase === "playing" &&
    game.players[game.currentTurnIndex]?.id === "you";
  const youHasPlayed = game.currentTrick.some((tc) => tc.playerId === "you");
  const trumpIsRed =
    game.trumpSuit === "hearts" || game.trumpSuit === "diamonds";
  const trumpSym: Record<Suit, string> = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
  };
  const activeBotId =
    game.phase === "playing" && !game.players[game.currentTurnIndex]?.isHuman
      ? game.players[game.currentTurnIndex]?.id
      : null;

  const validCardKeys = useMemo(() => {
    if (!isYourTurn || youHasPlayed) return new Set<string>();
    const valid = getValidCards(you.hand, game.currentTrick, game.trumpSuit);
    return new Set(valid.map((c) => `${c.rank}-${c.suit}`));
  }, [isYourTurn, youHasPlayed, you.hand, game.currentTrick, game.trumpSuit]);

  const sortedPlayers = [...game.players].sort(
    (a, b) => b.totalScore - a.totalScore,
  );

  // ── Desktop Drag & Drop ──────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTable(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverTable(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTable(false);
    const cardData = e.dataTransfer.getData("text/plain");
    if (!cardData) return;
    const [rank, suit] = cardData.split("-") as [Rank, Suit];
    const card = you.hand.find((c) => c.rank === rank && c.suit === suit);
    if (card) playCard(card);
  };

  // ── Mobile Touch Drag (ghost card) ───────────────────────────────────────
  const isCardInteractable =
    isYourTurn && !youHasPlayed && !botThinking && game.phase === "playing";

  const handleTouchStart = useCallback(
    (card: Card) => (e: React.TouchEvent) => {
      if (!isCardInteractable) return;
      e.stopPropagation();
      const touch = e.touches[0];
      setGhostCard({
        card,
        x: touch.clientX - 33,
        y: touch.clientY - 48,
      });
      document.body.style.overflow = "hidden";
    },
    [isCardInteractable],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!ghostCard) return;
      e.preventDefault();
      const touch = e.touches[0];
      setGhostCard((prev) =>
        prev
          ? {
              ...prev,
              x: touch.clientX - 33,
              y: touch.clientY - 48,
            }
          : null,
      );
    },
    [ghostCard],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      document.body.style.overflow = "";
      if (!ghostCard) return;

      const touch = e.changedTouches[0];
      const dropTarget = document.elementFromPoint(
        touch.clientX,
        touch.clientY,
      );
      const tableElement = tableRef.current;
      const isOverTable =
        tableElement && dropTarget && tableElement.contains(dropTarget);

      if (isOverTable && ghostCard) {
        playCard(ghostCard.card);
      }
      setGhostCard(null);
    },
    [ghostCard, playCard],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (

    <div
    className="min-h-screen w-full flex flex-col select-none"
    style={{
      background:
      "radial-gradient(ellipse at top, #F8F9FA 0%, #E9ECEF 60%, #edede9 100%)",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}
    >
    <WinEffect show={showConfetti} />
      {/* TOAST */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {/* SHUFFLE OVERLAY */}
      <AnimatePresence>
        {isDealing && <ShuffleAnimation key="shuffle" />}
      </AnimatePresence>

      {/* BID MODAL – only if not dealing and phase is bidding */}
      <AnimatePresence>
        {game.phase === "bidding" &&
          game.biddingIndex < game.players.length &&
          !isDealing && (
           <BidModal
              players={game.players}
              biddingIndex={game.biddingIndex}
              onBid={processBid}
              selectedTrump={selectedTrump}
              setSelectedTrump={setSelectedTrump}
            />
          )}
      </AnimatePresence>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2 md:px-5 md:py-2.5 relative"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <svg
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex flex-col leading-tight">
           <div className="flex flex-row items-center gap-4">
             <span className="text-[#0077b6] text-[12px] font-bold underline uppercase tracking-widest">
               Room ID
             </span>
             <span className="text-[#ff6700] font-bold text-xs">
               CB1234
             </span>
           </div>
            <span className="text-[#76c893] text-xs font-semibold">
              ● Online: 4
            </span>
          </div>
        </div>

        <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
          <Logo compact />
        </div>
        <div className="md:hidden">
          <Logo compact />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-lg text-[#ff6700] underline text-xs font-semibold hover:bg-white/10 transition-colors"
            style={{
              background: "#f8f9fb",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <svg
              width={13}
              height={13}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            `Rules`
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff6700]"
            style={{
              background: "#f7f9f9",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <svg
              width={13}
              height={13}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx={12} cy={12} r={10} />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden ">
        {/* ── GAME AREA ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col px-2 py-2 md:px-3 md:py-3 gap-2  overflow-y-auto">
          {/* Opponents row */}
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
                       border: isActive
                         ? "1px solid #2563eb" // Blue
                         : "1px solid #93c5fd", // Light Blue
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



          {/* Table / Center area with drag‑and‑drop target (also touch drop zone) */}
          <div 
            ref={tableRef}
            className="rounded-4xl p-3 flex flex-col gap-2  transition-all"
            style={{
               background:
               "radial-gradient(ellipse at top, #76c893 10%, #34a0a4 60%, #1a759f 100%)",
              border: dragOverTable
                ? "3px solid #bd7847"
                : "4px solid #60495a",
              boxShadow: dragOverTable
                ? "0 0 16px #bd7847"
                : "none",
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
                  style={{ color: trumpIsRed ? "#FF6B6B" : "#e2e8f0" }}
                >
                  {trumpSym[game.trumpSuit]}
                </span>
              </div>
              <div className="flex flex-col  items-center">
                <span className="text-[#edf2fb ] text-xs uppercase tracking-wider">
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
                <span className="text-[#ff6b35] text-sm italic">
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
                  const pName = game.players.find(
                    (p) => p.id === tc.playerId,
                  )?.name;
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

         {/*  your hand */}

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
                            isCardInteractable
                              ? handleTouchStart(card)
                              : undefined
                          }
                          onTouchMove={
                            isCardInteractable ? handleTouchMove : undefined
                          }
                          onTouchEnd={
                            isCardInteractable ? handleTouchEnd : undefined
                          }
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
                                           humanPlay();
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
                  ? `${selectedCard.rank} of ${selectedCard.suit} selected —   Click a card to play it, or drag it onto the table`
                  : "   Click a card to play it, or drag it onto the table"}
              </div>
            )}
          </div>

          {/* You row */}
          <div
            className="rounded-xl p-2 flex items-center gap-3 transition-all"
            style={{
                background: 
               "radial-gradient(ellipse at top, #76c893 50%, #34a0a4 85%, #1a759f 100%)",
                border: isYourTurn
                  ? "2px solid #1a759f "
                  : "1px solid #1e96fc",
                boxShadow: isYourTurn
                  ? "0 0 12px rgba(59,130,246,0.35)"
                  : "0 0 6px rgba(59,130,246,0.15)",
              }}
                     >
            <Avatar id="you" name="You" size={44} online />
            <div>
              <div className="text-[#ffffff] font-bold text-sm">You</div>
              <ScoreNum v={you.totalScore} size="lg"   />
            </div>
            {you.bid !== null && (
              <div className="ml-2 flex flex-col items-start">
                <span className="text-[#d62828] underline decoration-2 text-s font-black">
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
            {youHasPlayed &&
              game.currentTrick.find((tc) => tc.playerId === "you") && (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="ml-2 flex items-center gap-1.5"
                >
                  <PlayingCard
                    card={
                      game.currentTrick.find((tc) => tc.playerId === "you")!
                        .card
                    }
                    size="sm"
                  />
                </motion.div>
              )}
            <div className="ml-auto text-xs text-[#14213d] font-semibold">
              {you.hand.length} cards
            </div>
          </div>

          {/* New Game / Exit */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={newGame}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "#1e6091",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}
            >
              <svg
                width={13}
                height={13}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
              </svg>
              NEW GAME
            </button>
            <button
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-white/10 transition-all active:scale-95"
              style={{
                background: "#76c893",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <svg
                width={13}
                height={13}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1={21} y1={12} x2={9} y2={12} />
              </svg>
              EXIT TABLE
            </button>
          </div>
        </div>

        {/* ── SCOREBOARD SIDEBAR ─────────────────────────────────────────── */}
        <div
          className="w-full md:w-64 lg:w-72 flex-shrink-0 p-3 flex flex-col gap-3 overflow-y-auto"
          style={{
            background: "#1E293B",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="text-center font-black text-base uppercase tracking-widest text-white">
            Score Board
          </div>

          <div className="grid grid-cols-4 text-xs text-[#F8FAFA] uppercase tracking-wider px-1">
            <span>Player</span>
            <span className="text-center">Bid</span>
            <span className="text-center">Won</span>
            <span className="text-right">Total</span>
          </div>
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }} />

          {sortedPlayers.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-4 items-center px-1 py-0.5"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{
                    minHeight: 20,
                    background: p.totalScore >= 0 ? "#5BDB6F" : "#FF6B6B",
                  }}
                />
                <span className="text-white text-xs font-semibold truncate">
                  {p.name}
                </span>
              </div>
              <div className="text-center">
                <span className="text-yellow-400 text-xs font-bold">
                  {p.bid ?? "—"}
                </span>
              </div>
              <div className="text-center">
                <span className="text-blue-400 text-xs font-bold">
                  {p.tricksWon}
                </span>
              </div>
              <div className="text-right">
                <ScoreNum v={p.totalScore} size="sm" />
              </div>
            </div>
          ))}

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }} />

          <div className="flex flex-col gap-2">
            {sortedPlayers.map((p) => (
              <div key={p.id} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#F8FAFA] ">{p.name}</span>
                  <span
                    style={{ color: p.totalScore >= 0 ? "#5BDB6F" : "#FF6B6B" }}
                  >
                    {p.totalScore >= 0 ? "+" : ""}
                    {p.totalScore}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (p.totalScore / TARGET_SCORE) * 100))}%`,
                      background: p.totalScore >= 0 ? "#5BDB6F" : "#FF6B6B",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }} />

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[#E2E8F0] text-xs  font-bold uppercase underline tracking-wider">
              Target Score
            </span>
            <span className="text-[#76c893]  font-black text-3xl">
              {TARGET_SCORE}
            </span>
          </div>

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }} />

          <div>
            <span className="text-[#E2E8F0] text-xs uppercase tracking-wider block mb-2">
              Round History
            </span>
            <div className="flex flex-wrap gap-1.5">
              {game.roundResults.map((r, i) => {
                const youScore = r.scores["you"] ?? 0;
                const youBid = r.bids["you"] ?? 0;
                const youWon = r.tricksWon["you"] ?? 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "white",
                      }}
                    >
                      {r.round}
                    </div>
                    <span className="text-[10px] text-[#E2E8F0] ">
                      {youWon}/{youBid}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: youScore >= 0 ? "#5BDB6F" : "#FF6B6B" }}
                    >
                      {youScore >= 0 ? "+" : ""}
                      {youScore}
                    </span>
                  </div>
                );
              })}
              {game.phase === "playing" && (
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "transparent",
                      border: "2px solid #6366f1",
                      color: "#818cf8",
                    }}
                  >
                    {game.currentRound}
                  </div>
                  <span className="text-xs text-gray-500">...</span>
                </div>
              )}
            </div>
          </div>

          {/* Chat/Emoji */}
          <div
            className="flex gap-2 mt-auto pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            {[
              { icon: "💬", label: "CHAT" },
              { icon: "😊", label: "EMOJI" },
            ].map((b) => (
              <button
                key={b.label}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 rounded-xl text-white text-xs font-semibold hover:bg-white/10 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span className="text-base">{b.icon}</span>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GHOST CARD (for mobile touch drag) ────────────────────────────── */}
      {ghostCard && (
        <div
          style={{
            position: "fixed",
            left: ghostCard.x,
            top: ghostCard.y,
            zIndex: 1000,
            pointerEvents: "none",
            transform: "rotate(2deg) scale(1.05)",
            filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))",
            opacity: 0.95,
          }}
        >
          <PlayingCard card={ghostCard.card} size="lg" />
        </div>
      )}

      {/* ── ROUND RESULT MODAL ────────────────────────────────────────────── */}
      {showRoundModal && game.phase === "round_result" && (
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
              {(() => {
                const lastResult =
                  game.roundResults[game.roundResults.length - 1];
                if (!lastResult) return null;
                return game.players.map((p) => {
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
                });
              })()}
            </div>
            <button
              onClick={() => startNextRound()}
              className="w-full py-3 rounded-xl font-black text-white text-base transition-all hover:brightness-110 active:scale-95"
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
      )}

      {/* ── GAME OVER MODAL (uses showGameOverModal flag) ─────────────────── */}
      {showGameOverModal && game.phase === "game_over" && (
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
              background: "[#0b1a2e]",
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
                  : `${game.players.find((p) => p.id === game.gameWinnerId)?.name} Wins!`}
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
                    border:
                      rank === 0 ? "1px solid rgba(250,204,21,0.3)" : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {["🥇", "🥈", "🥉", "4️⃣"][rank]}
                    </span>
                    <span className="text-white font-bold text-sm">
                      {p.name}
                    </span>
                  </div>
                  <ScoreNum v={p.totalScore} size="sm" />
                </div>
              ))}
            </div>
            <button
              onClick={newGame}
              className="w-full py-3 rounded-xl font-black text-white text-base transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                boxShadow: "0 4px 18px rgba(99,102,241,0.4)",
              }}
            >
              🔄 Play Again
            </button>
          </motion.div>
        </div>
      )}

      {/* ── RULES MODAL ──────────────────────────────────────────────────── */}
      {showRules && (
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
                className="text-gray-400 hover:text-white transition-colors"
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
      )}
    </div>
  );
}
