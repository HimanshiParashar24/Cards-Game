import React from "react";
import type { GameState, PlayerState } from "./types";
import { TARGET_SCORE } from "./types";
import { ScoreNum } from "./ScoreNum";

interface ScoreBoardProps {
  sortedPlayers: PlayerState[];
  game: GameState;
}

export const ScoreBoard = ({ sortedPlayers, game }: ScoreBoardProps) => {
  return (
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
        <div key={p.id} className="grid grid-cols-4 items-center px-1 py-0.5">
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
            <span className="text-blue-400 text-xs font-bold">{p.tricksWon}</span>
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
              <span className="text-[#F8FAFA]">{p.name}</span>
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
                <span className="text-[10px] text-[#E2E8F0]">
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
    </div>
  );
};
