"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import WinEffect from "./WinEffect";

import { useCallBreakerGame } from "./game/useCallBreakerGame";
import { Toast } from "./game/Toast";
import { ShuffleAnimation } from "./game/ShuffleAnimation";
import { BidModal } from "./game/BidModal";
import { TopBar } from "./game/TopBar";
import { ScoreBoard } from "./game/ScoreBoard";
import { GameTable } from "./game/GameTable";
import { OpponentRow } from "./game/OpponentRow";
import { PlayerHand } from "./game/PlayerHand";
import { PlayerRow } from "./game/PlayerRow";
import { PlayingCard } from "./game/PlayingCard";
import { RoundResultModal } from "./game/RoundResultModal";
import { GameOverModal } from "./game/GameOverModal";
import { RulesModal } from "./game/RulesModal";

interface CallBreakerGameProps {
  multiplayerOpts?: {
    roomId: string;
    playerId: string;
    isHost: boolean;
    initialPlayers: any[];
  };
  onExit?: () => void;
}

export default function CallBreakerGame({
  multiplayerOpts,
  onExit,
}: CallBreakerGameProps = {}) {
  const {
    game,
    selectedTrump,
    setSelectedTrump,
    selectedCard,
    setSelectedCard,
    showRules,
    setShowRules,
    toast,
    botThinking,
    showRoundModal,
    showGameOverModal,
    showConfetti,
    isDealing,
    dragOverTable,
    ghostCard,
    tableRef,
    processBid,
    startNextRound,
    playCard,
    humanPlay,
    newGame,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    isCardInteractable,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    you,
    opponents,
    isYourTurn,
    youHasPlayed,
    trumpIsRed,
    trumpSym,
    activeBotId,
    validCardKeys,
    sortedPlayers,
  } = useCallBreakerGame(multiplayerOpts);

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

      {/* BID MODAL */}
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
              playerId={multiplayerOpts?.playerId || you.id}
            />
          )}
      </AnimatePresence>

      {/* TOP NAVBAR */}
      <TopBar
        setShowRules={setShowRules}
        onExit={onExit}
        roomId={multiplayerOpts?.roomId}
        onlineCount={multiplayerOpts ? game.players.length : undefined}
      />

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* GAME PLAY AREA */}
        <div className="flex-1 flex flex-col px-2 py-2 md:px-3 md:py-3 gap-2 overflow-y-auto">
          {/* Opponents Row */}
          <OpponentRow
            opponents={opponents}
            game={game}
            botThinking={botThinking}
          />

          {/* Central Game Table felt */}
          <GameTable
            tableRef={tableRef}
            dragOverTable={dragOverTable}
            handleDragOver={handleDragOver}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            game={game}
            trumpIsRed={trumpIsRed}
            trumpSym={trumpSym}
            botThinking={botThinking}
            activeBotId={activeBotId}
          />

          {/* User's cards hand */}
          <PlayerHand
            you={you}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            validCardKeys={validCardKeys}
            isCardInteractable={isCardInteractable}
            isYourTurn={isYourTurn}
            youHasPlayed={youHasPlayed}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            humanPlay={humanPlay}
          />

          {/* User row and status details */}
          <PlayerRow
            you={you}
            isYourTurn={isYourTurn}
            youHasPlayed={youHasPlayed}
            botThinking={botThinking}
            game={game}
          />

          {/* Bottom actions: New Game & Exit Table */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={newGame}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer"
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
              onClick={onExit}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
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

        {/* SIDEBAR SCOREBOARD */}
        <ScoreBoard sortedPlayers={sortedPlayers} game={game} playerId={multiplayerOpts?.playerId} />
      </div>

      {/* MOBILE TOUCH DRAG GHOST */}
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

      {/* ROUND END SCORING DETAILS MODAL */}
      <RoundResultModal
        showRoundModal={showRoundModal}
        game={game}
        startNextRound={startNextRound}
      />

      {/* GAME WIN/LOSS Ranking MODAL */}
      <GameOverModal
        showGameOverModal={showGameOverModal}
        game={game}
        sortedPlayers={sortedPlayers}
        newGame={newGame}
      />

      {/* HOW-TO-PLAY RULE BOOK MODAL */}
      <RulesModal showRules={showRules} setShowRules={setShowRules} />
    </div>
  );
}
