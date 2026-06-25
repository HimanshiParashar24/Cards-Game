import type { Card, Suit, PlayedCard, GameState, PlayerState } from "./types";
import {
  SUITS,
  RANKS,
  RANK_VALUE,
  CARDS_PER_HAND,
  TOTAL_ROUNDS,
} from "./types";

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealHands(numPlayers: number, cardsEach: number): Card[][] {
  const deck = shuffle(buildDeck());
  return Array.from({ length: numPlayers }, (_, i) =>
    deck.slice(i * cardsEach, (i + 1) * cardsEach),
  );
}

export function trickWinner(plays: PlayedCard[], trump: Suit): string {
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
      if (RANK_VALUE[challenger.card.rank] > RANK_VALUE[best.card.rank]) {
        best = challenger;
      }
    } else {
      const chalIsLed = challenger.card.suit === ledSuit;
      const bestIsLed = best.card.suit === ledSuit;
      if (chalIsLed && !bestIsLed) {
        best = challenger;
      } else if (chalIsLed && bestIsLed) {
        if (RANK_VALUE[challenger.card.rank] > RANK_VALUE[best.card.rank]) {
          best = challenger;
        }
      }
    }
  }
  return best.playerId;
}

export function calculateRoundScore(bid: number, tricksWon: number): number {
  if (tricksWon >= bid) return bid;
  return -bid;
}

export function createInitialState(): GameState {
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
