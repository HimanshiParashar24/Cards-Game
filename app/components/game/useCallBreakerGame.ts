import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  Suit,
  Rank,
  Card,
  PlayedCard,
  PlayerState,
  TrickRecord,
  RoundResult,
  GameState,
} from "./types";
import {
  TARGET_SCORE,
  CARDS_PER_HAND,
  BOT_DELAYS,
  TRICK_RESULT_DELAY,
} from "./types";
import { playSound } from "./soundEngine";
import {
  dealHands,
  trickWinner,
  calculateRoundScore,
  createInitialState,
} from "./gameEngine";
import { getValidCards, botBid, botDecide } from "./botAI";
import { db, ref, set, update, onValue, off } from "./firebase";

function createMultiplayerPlaceholderState(initialPlayers: any[]): GameState {
  const players: PlayerState[] = initialPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    totalScore: 0,
    roundScore: 0,
    hand: [],
    isHuman: !p.id.startsWith("bot_"),
    isOnline: true,
    bid: null,
    tricksWon: 0,
  }));

  return {
    phase: "bidding",
    currentRound: 1,
    totalRounds: 5,
    trumpSuit: null,
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

export function useCallBreakerGame(multiplayerOpts?: {
  roomId: string;
  playerId: string;
  isHost: boolean;
  initialPlayers: any[];
}) {
  const isMultiplayer = !!multiplayerOpts;
  const roomId = multiplayerOpts?.roomId ?? "";
  const playerId = multiplayerOpts?.playerId ?? "you";
  const isHost = multiplayerOpts ? multiplayerOpts.isHost : true;

  const [game, setGame] = useState<GameState>(() => {
    if (multiplayerOpts) {
      return createMultiplayerPlaceholderState(multiplayerOpts.initialPlayers);
    }
    return createInitialState();
  });
  const [selectedTrump, setSelectedTrump] = useState<Suit | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDealing, setIsDealing] = useState(true);
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
      const winnerId = trickWinner(trick, prev.trumpSuit ?? "spades");
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
    (bid: number, bypassTurnCheck = false, chosenTrump?: Suit | null) => {
      const finalTrump = chosenTrump !== undefined ? chosenTrump : selectedTrump;

      if (isMultiplayer && !isHost && !bypassTurnCheck) {
        set(ref(db, `rooms/${roomId}/players/${playerId}/bidAction`), bid);
        if (selectedTrump) {
          set(ref(db, `rooms/${roomId}/players/${playerId}/trumpAction`), selectedTrump);
        }
        setSelectedTrump(null);
        return;
      }

      setGame((prev) => {
        if (prev.phase !== "bidding") return prev;

        const biddingPlayer = prev.players[prev.biddingIndex];
        if (!biddingPlayer) return prev;

        const updatedPlayers = prev.players.map((p, idx) =>
          idx === prev.biddingIndex ? { ...p, bid } : p
        );

        const nextBiddingIndex = prev.biddingIndex + 1;
        const allBid = nextBiddingIndex >= prev.players.length;

        let resolvedTrump = finalTrump ?? prev.trumpSuit;
        if (allBid && !resolvedTrump) {
          resolvedTrump = "spades";
        }

        return {
          ...prev,
          trumpSuit: resolvedTrump,
          players: updatedPlayers,
          biddingIndex: nextBiddingIndex,
          phase: allBid ? "playing" : "bidding",
          currentTurnIndex: 0,
          turnToken: `${Date.now()}_${Math.random()}`,
        };
      });

      setSelectedTrump(null);
      playSound("bidPlaced");
    },
    [selectedTrump, isMultiplayer, isHost, roomId, playerId, setSelectedTrump]
  );

  useEffect(() => {
    if (game.phase !== "bidding") return;
    if (isMultiplayer && !isHost) return;
    const biddingPlayer = game.players[game.biddingIndex];
    if (!biddingPlayer || biddingPlayer.isHuman) return;

    if (bidTimer.current) clearTimeout(bidTimer.current);
    bidTimer.current = setTimeout(() => {
      const bid = botBid(biddingPlayer.hand, game.trumpSuit ?? "spades");
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

      if (game.gameWinnerId === playerId) {
        playSound("gameWin");
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      } else {
        playSound("gameLose");
      }
    }
  }, [game.phase, game.gameWinnerId, playerId]);

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
    }, 1800);
    return () => clearTimeout(initTimer);
  }, []);

  // ── Start next round ─────────────────────────────────────────────────────
  const startNextRound = useCallback(() => {
    if (isMultiplayer && !isHost) {
      if (roomId.startsWith("DEMO")) {
        const channel = new BroadcastChannel(`cb_game_demo_${roomId}`);
        channel.postMessage({ type: "nextRound" });
        channel.close();
        return;
      }
      set(ref(db, `rooms/${roomId}/actions/nextRoundTrigger`), true);
      return;
    }

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
    setShowRoundModal(false);
    setIsDealing(true);

    dealingTimer.current = setTimeout(() => {
      const hands = dealHands(4, CARDS_PER_HAND);
      setGame((g) => ({
        ...g,
        phase: "bidding",
        currentRound: g.currentRound + 1,
        trumpSuit: null,
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
      setSelectedTrump(null);
      setBotThinking(false);
    }, 1800);
  }, [game.currentRound, game.totalRounds, game.players, isMultiplayer, isHost, roomId]);

  // ── Play a card (human) with sound ──────────────────────────────────────
  const playCard = useCallback(
    (card: Card, bypassTurnCheck = false) => {
      if (game.phase !== "playing") return;
      if (botThinking) {
        showToast("Wait for bot to play!", "error");
        return;
      }
      const currentPlayer = game.players[game.currentTurnIndex];
      if (!currentPlayer) return;

      const isMyTurn = bypassTurnCheck || (isMultiplayer
        ? currentPlayer.id === playerId
        : currentPlayer.isHuman);

      if (!isMyTurn) {
        showToast("Not your turn!", "error");
        return;
      }

      const valid = getValidCards(
        currentPlayer.hand,
        game.currentTrick,
        game.trumpSuit ?? "spades"
      );
      const isValid = valid.some(
        (c) => c.rank === card.rank && c.suit === card.suit,
      );
      if (!isValid) {
        showToast("You must follow suit!", "error");
        return;
      }

      if (isMultiplayer && !isHost && !bypassTurnCheck) {
        if (roomId.startsWith("DEMO")) {
          const channel = new BroadcastChannel(`cb_game_demo_${roomId}`);
          channel.postMessage({ type: "play", card });
          channel.close();
          setSelectedCard(null);
          return;
        }
        set(ref(db, `rooms/${roomId}/players/${playerId}/playAction`), card);
        setSelectedCard(null);
        return;
      }

      console.log("cardPlay called");
      playSound("cardPlay");
      setSelectedCard(null);

      setGame((prev) => {
        const player = prev.players[prev.currentTurnIndex];
        if (!player) return prev;
        const newHand = player.hand.filter(
          (c) => !(c.rank === card.rank && c.suit === card.suit),
        );
        const play: PlayedCard = { card, playerId: player.id };
        const newTrick = [...prev.currentTrick, play];
        const updatedPlayers = prev.players.map((p) =>
          p.id === player.id ? { ...p, hand: newHand } : p,
        );

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
    [game, botThinking, showToast, isMultiplayer, isHost, roomId, playerId]
  );

  const humanPlay = useCallback(() => {
    if (!selectedCard) return;
    playCard(selectedCard);
  }, [selectedCard, playCard]);

  // ── New Game ─────────────────────────────────────────────────────────────
  const newGame = useCallback(() => {
    if (isMultiplayer && !isHost) {
      if (roomId.startsWith("DEMO")) {
        const channel = new BroadcastChannel(`cb_game_demo_${roomId}`);
        channel.postMessage({ type: "restart" });
        channel.close();
        return;
      }
      set(ref(db, `rooms/${roomId}/actions/restartTrigger`), true);
      return;
    }

    if (botTimer.current) clearTimeout(botTimer.current);
    if (dealingTimer.current) clearTimeout(dealingTimer.current);
    if (bidTimer.current) clearTimeout(bidTimer.current);
    if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    setBotThinking(false);
    setSelectedCard(null);
    setSelectedTrump(null);
    setShowRoundModal(false);
    setShowGameOverModal(false);
    setDragOverTable(false);
    setGhostCard(null);

    setIsDealing(true);
    dealingTimer.current = setTimeout(() => {
      if (isMultiplayer) {
        const hands = dealHands(4, CARDS_PER_HAND);
        const resetPlayers = game.players.map((p, idx) => ({
          ...p,
          hand: hands[idx],
          totalScore: 0,
          roundScore: 0,
          bid: null,
          tricksWon: 0,
        }));
        
        const resetState: GameState = {
          phase: "bidding",
          currentRound: 1,
          totalRounds: game.totalRounds,
          trumpSuit: null,
          players: resetPlayers,
          currentTurnIndex: 0,
          currentTrick: [],
          completedTricks: [],
          roundResults: [],
          lastTrickWinner: null,
          winnerMessage: "",
          gameWinnerId: null,
          biddingIndex: 0,
          turnToken: `${Date.now()}_${Math.random()}`,
        };
        setGame(resetState);
      } else {
        setGame(createInitialState());
      }
      setIsDealing(false);
    }, 1800);
  }, [isMultiplayer, isHost, roomId, game.players, game.totalRounds]);

  // ── Firebase Multiplayer Sync ─────────────────────────────────────────────
  // 1. Initial State Deal (Host only)
  useEffect(() => {
    if (isMultiplayer && isHost && game.turnToken === "init") {
      if (roomId.startsWith("DEMO")) {
        const hands = dealHands(4, CARDS_PER_HAND);
        const dealtPlayers = game.players.map((p, idx) => ({
          ...p,
          hand: hands[idx],
        }));
        const initialState: GameState = {
          ...game,
          players: dealtPlayers,
          turnToken: `init_${Date.now()}`,
        };
        const channel = new BroadcastChannel(`cb_game_demo_${roomId}`);
        channel.postMessage({ type: "state", state: initialState });
        channel.close();
        setGame(initialState);
        return;
      }
      const hands = dealHands(4, CARDS_PER_HAND);
      const dealtPlayers = game.players.map((p, idx) => ({
        ...p,
        hand: hands[idx],
      }));
      const initialState: GameState = {
        ...game,
        players: dealtPlayers,
        turnToken: `init_${Date.now()}`,
      };
      set(ref(db, `rooms/${roomId}/gameState`), initialState);
      setGame(initialState);
    }
  }, [isMultiplayer, isHost, roomId, game]);

  // 2. Push State to Firebase (Host only)
  useEffect(() => {
    if (isMultiplayer && isHost && game.turnToken !== "init") {
      if (roomId.startsWith("DEMO")) {
        const channel = new BroadcastChannel(`cb_game_demo_${roomId}`);
        channel.postMessage({ type: "state", state: game });
        channel.close();
        return;
      }
      set(ref(db, `rooms/${roomId}/gameState`), game);
    }
  }, [game, isMultiplayer, isHost, roomId]);

  // 3. Pull State from Firebase (Guests only)
  useEffect(() => {
    if (isMultiplayer && !isHost) {
      if (roomId.startsWith("DEMO")) return;
      const stateRef = ref(db, `rooms/${roomId}/gameState`);
      const unsubscribe = onValue(stateRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val() as GameState;
          setGame(val);
        }
      });
      return () => off(stateRef, "value", unsubscribe);
    }
  }, [isMultiplayer, isHost, roomId]);

  // 4. Listen to Guest actions (Host only)
  useEffect(() => {
    if (isMultiplayer && isHost) {
      const playersRef = ref(db, `rooms/${roomId}/players`);
      const unsubscribe = onValue(playersRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const playersData = snapshot.val();
        
        Object.keys(playersData).forEach((pId) => {
          const p = playersData[pId];
          
          // Process guest bid
          if (p.bidAction !== undefined && p.bidAction !== null) {
            const pIdx = game.players.findIndex((pl) => pl.id === pId);
            if (pIdx === game.biddingIndex && game.phase === "bidding") {
              const bid = p.bidAction;
              const trump = p.trumpAction || null;
              update(ref(db, `rooms/${roomId}/players/${pId}`), { 
                bidAction: null,
                trumpAction: null 
              });
              processBid(bid, true, trump);
            }
          }
          
          // Process guest card play
          if (p.playAction !== undefined && p.playAction !== null) {
            const pIdx = game.players.findIndex((pl) => pl.id === pId);
            if (pIdx === game.currentTurnIndex && game.phase === "playing") {
              const card = p.playAction;
              update(ref(db, `rooms/${roomId}/players/${pId}`), { playAction: null });
              playCard(card, true);
            }
          }
        });
      });

      return () => off(playersRef, "value", unsubscribe);
    }
  }, [isMultiplayer, isHost, roomId, game, processBid, playCard]);

  // 5. Listen to actions (Host only)
  useEffect(() => {
    if (isMultiplayer && isHost) {
      const actionsRef = ref(db, `rooms/${roomId}/actions`);
      const unsubscribe = onValue(actionsRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const actions = snapshot.val();
        
        if (actions.nextRoundTrigger) {
          update(ref(db, `rooms/${roomId}/actions`), { nextRoundTrigger: null });
          startNextRound();
        }
        
        if (actions.restartTrigger) {
          update(ref(db, `rooms/${roomId}/actions`), { restartTrigger: null });
          newGame();
        }
      });
      
      return () => off(actionsRef, "value", unsubscribe);
    }
  }, [isMultiplayer, isHost, roomId, startNextRound, newGame]);

  // ── BroadcastChannel Sync for Gameplay Demo Mode ──────────────────────────
  useEffect(() => {
    if (!roomId.startsWith("DEMO")) return;

    const channel = new BroadcastChannel(`cb_game_demo_${roomId}`);

    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (isHost) {
        if (msg.type === "bid") {
          processBid(msg.bid, true, msg.trump);
        } else if (msg.type === "play") {
          playCard(msg.card, true);
        } else if (msg.type === "nextRound") {
          startNextRound();
        } else if (msg.type === "restart") {
          newGame();
        }
      } else {
        if (msg.type === "state") {
          setGame(msg.state);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [roomId, isHost, processBid, playCard, startNextRound, newGame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
      if (dealingTimer.current) clearTimeout(dealingTimer.current);
      if (bidTimer.current) clearTimeout(bidTimer.current);
      if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    };
  }, []);

  useEffect(() => {
    if (game.phase !== "playing") return;
    if (isMultiplayer && !isHost) return;
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
          prev.trumpSuit ?? "spades",
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

  // ── TRICK RESULT RESOLUTION (plays trick win sound) ──────────
  useEffect(() => {
    if (game.phase !== "trick_result") return;
    const winnerId = trickWinner(game.currentTrick, game.trumpSuit ?? "spades");
    const winnerName = game.players.find((p) => p.id === winnerId)?.name ?? "?";
    showToast(`${winnerName} wins the trick!`, "success");
    playSound("trickWin");
  }, [game.phase, game.currentTrick, game.trumpSuit, game.players, showToast]);

  // Host: resolve trick state update after delay
  useEffect(() => {
    if (game.phase !== "trick_result") return;
    if (isMultiplayer && !isHost) return;

    if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    trickResultTimer.current = setTimeout(() => {
      setGame((prev) => resolveTrickFromState(prev));
    }, TRICK_RESULT_DELAY);

    return () => {
      if (trickResultTimer.current) clearTimeout(trickResultTimer.current);
    };
  }, [game.phase, isMultiplayer, isHost, resolveTrickFromState]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────
  const you = game.players.find((p) => p.id === playerId) || game.players[0];
  const opponents = game.players.filter((p) => p.id !== playerId);
  const isYourTurn =
    game.phase === "playing" &&
    game.players[game.currentTurnIndex]?.id === playerId;
  const youHasPlayed = game.currentTrick.some((tc) => tc.playerId === playerId);
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
    const valid = getValidCards(you.hand, game.currentTrick, game.trumpSuit ?? "spades");
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

  return {
    game,
    selectedTrump,
    setSelectedTrump,
    selectedCard,
    setSelectedCard,
    showRules,
    setShowRules,
    toast,
    setToast,
    botThinking,
    showRoundModal,
    setShowRoundModal,
    showGameOverModal,
    setShowGameOverModal,
    showConfetti,
    isDealing,
    dragOverTable,
    setDragOverTable,
    ghostCard,
    setGhostCard,
    tableRef,
    showToast,
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
  };
}
