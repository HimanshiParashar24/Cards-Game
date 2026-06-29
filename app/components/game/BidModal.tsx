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
}

export const BidModal = ({
  players,
  biddingIndex,
  onBid,
  selectedTrump,
  setSelectedTrump,
  playerId,
}: BidModalProps) => {
  const [selectedBid, setSelectedBid] = useState<number>(selectedTrump ? 5 : 1);
  const currentBidder = players[biddingIndex];

  useEffect(() => {
    if (selectedTrump) {
      setSelectedBid(5);
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
            {isMyTurn
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
                  background: isCurrent ? "rgba(59,130,245,0.15)" : "#e9ecef",
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

        {isMyTurn && myHand.length > 0 && (
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

        {isMyTurn ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="text-[#0353a4] text-xs font-bold tracking-wider">
                YOUR BID <span className="text-[#00a6fb] ">(min 1 - max 8)</span>
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
                      cursor:
                        mustBidFiveOrMore && b < 5 ? "not-allowed" : "pointer",
                      background:
                        selectedBid === b ? "rgba(59,130,245,0.15)" : "#e9ecef",
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
