import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { PlayerState, Suit } from "./types";
import { PlayingCard } from "./PlayingCard";
import { Avatar } from "./Avatar";
import { playSound } from "./soundEngine";

interface BidModalProps {
  players: PlayerState[];
  biddingIndex: number;
  onBid: (bid: number) => void;
  selectedTrump: Suit | null;
  setSelectedTrump: React.Dispatch<React.SetStateAction<Suit | null>>;
  playerId: string;
  trumpSuit: Suit | null;
}

export const BidModal = ({
  players,
  biddingIndex,
  onBid,
  selectedTrump,
  setSelectedTrump,
  playerId,
  trumpSuit,
}: BidModalProps) => {
  const [selectedBid, setSelectedBid] = useState<number>(selectedTrump ? 5 : 1);
  const currentBidder = players[biddingIndex];

  useEffect(() => {
    if (selectedTrump) {
      setSelectedBid((prev) => (prev < 5 ? 5 : prev));
    }
  }, [selectedTrump]);

  if (!currentBidder) return null;

  const isMyTurn = currentBidder.id === playerId;
  const myPlayer = players.find((p) => p.id === playerId);
  const myHand = myPlayer?.hand ?? [];
  const placedBids = players.filter((p) => p.bid !== null);

  const BID_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const mustBidFiveOrMore = !!selectedTrump;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-blue-500/20 shadow-2xl shadow-blue-500/10 rounded-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto m-auto text-white"
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl mb-1">🃏</div>
          <h2 className="text-white font-black text-xl tracking-wide">
            Place Your Bid!
          </h2>
          <p className="text-blue-300 text-sm mt-1">
            {isMyTurn
              ? "How many tricks will you win this round?"
              : `${currentBidder.name} is bidding...`}
          </p>
        </div>

        {/* Players horizontal bidding progress list */}
        <div className="flex flex-col gap-2">
          <span className="text-slate-500 text-xs font-black uppercase tracking-widest text-center">
            Bidding ({placedBids.length} / {players.length} done)
          </span>
          <div className="grid grid-cols-4 gap-2">
            {players.map((p, idx) => {
              const isDone = p.bid !== null;
              const isCurrent = idx === biddingIndex;
              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all"
                  style={{
                    background: isCurrent ? "rgba(59,130,245,0.15)" : "rgba(30,41,59,0.5)",
                    borderColor: isCurrent ? "#3b82f6" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Avatar id={p.id} name={p.name} size={30} />
                  <span className="text-slate-300 text-[10px] font-bold mt-1 truncate w-full max-w-[64px]">
                    {p.name}
                  </span>
                  {isCurrent && !isDone && (
                    <span className="text-blue-400 text-[8px] animate-pulse font-black uppercase mt-0.5">
                      Bidding
                    </span>
                  )}
                  {isDone ? (
                    <span className="text-yellow-500 font-black text-sm mt-0.5">
                      {p.bid}
                    </span>
                  ) : isCurrent && !p.isHuman ? (
                    <div className="flex items-center gap-0.5 mt-1.5 h-3">
                      <div
                        className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  ) : !isCurrent ? (
                    <span className="text-slate-500 text-xs mt-0.5">—</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card picker / Active trump banner */}
        {isMyTurn && myHand.length > 0 && (biddingIndex === 0 || (biddingIndex === 1 && !trumpSuit)) ? (
          <div className="flex flex-col gap-2">
            <span className="text-slate-300 font-bold text-xs uppercase tracking-wider text-center">
              Select a Trump Card
            </span>
            <div
              className="flex flex-wrap justify-center gap-1.5 scrollbar-hide scroll-slick max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-700/50 bg-slate-800/40"
            >
              {myHand.map((card) => (
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
                    onClick={() => {
                      if (selectedTrump === card.suit) {
                        setSelectedTrump(null);
                        setSelectedBid(1);
                      } else {
                        setSelectedTrump(card.suit);
                      }
                    }}
                  />
                </motion.div>
              ))}
            </div>

            <p className="text-rose-400 text-[10px] text-center font-bold">
              {selectedTrump
                ? `Selected Trump: ${selectedTrump.toUpperCase()}`
                : "Click on any card to select the trump"}
            </p>
          </div>
        ) : (
          isMyTurn && trumpSuit && (
            <div
              className="flex flex-col gap-1.5 text-center p-3 rounded-xl border border-blue-500/20 bg-slate-800/60"
            >
              <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">
                Active Trump Suit
              </span>
              <div
                className="text-lg font-black"
                style={{
                  color:
                    trumpSuit === "hearts" || trumpSuit === "diamonds"
                      ? "#f43f5e"
                      : "#60a5fa",
                }}
              >
                {trumpSuit === "hearts"
                  ? "♥ HEARTS"
                  : trumpSuit === "diamonds"
                  ? "♦ DIAMONDS"
                  : trumpSuit === "spades"
                  ? "♠ SPADES"
                  : "♣ CLUBS"}
              </div>
            </div>
          )
        )}

        {/* Bid selector & Submit button */}
        {isMyTurn ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-slate-300 text-xs font-bold tracking-wider">
                YOUR BID <span className="text-blue-400">(min 1 - max 8)</span>
              </span>
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
                      opacity: mustBidFiveOrMore && b < 5 ? 0.25 : 1,
                      cursor: mustBidFiveOrMore && b < 5 ? "not-allowed" : "pointer",
                      background: selectedBid === b ? "rgba(59,130,245,0.25)" : "rgba(30,41,59,0.6)",
                      border: selectedBid === b ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.06)",
                      color: selectedBid === b ? "#3b82f6" : "#e2e8f0",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="text-center text-slate-500 text-[10px] mt-1 font-medium">
                {trumpSuit
                  ? `${
                      trumpSuit === "hearts"
                        ? "♥ HEARTS"
                        : trumpSuit === "diamonds"
                        ? "♦ DIAMONDS"
                        : trumpSuit === "spades"
                        ? "♠ SPADES"
                        : "♣ CLUBS"
                    } are trump. Higher bid = higher risk & reward.`
                  : "♠ Spades are default trump. Higher bid = higher risk & reward."}
              </div>
            </div>
            <button
              disabled={false}
              onClick={() => {
                onBid(selectedBid);
              }}
              className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:brightness-110 cursor-pointer active:scale-95"
              style={{
                background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                boxShadow: "0 4px 18px rgba(59,130,246,0.3)",
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
