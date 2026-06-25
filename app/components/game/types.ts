export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export type Rank =
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

export type GamePhase =
  | "bidding"
  | "playing"
  | "trick_result"
  | "round_result"
  | "game_over";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface PlayedCard {
  card: Card;
  playerId: string;
}

export interface PlayerState {
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

export interface TrickRecord {
  plays: PlayedCard[];
  winnerId: string;
}

export interface RoundResult {
  round: number;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  scores: Record<string, number>;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  trumpSuit: Suit | null;
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

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const RANKS: Rank[] = [
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

export const RANK_VALUE: Record<Rank, number> = {
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

export const TARGET_SCORE = 40;
export const TOTAL_ROUNDS = 5;
export const CARDS_PER_HAND = 13;
export const BOT_DELAYS = { think: 1000, play: 1200, bid: 1000 };
export const TRICK_RESULT_DELAY = 2000;
