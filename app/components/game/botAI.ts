import type { Card, PlayedCard, Suit } from "./types";
import { RANK_VALUE } from "./types";

export function getValidCards(
  hand: Card[],
  trick: PlayedCard[],
  trump: Suit,
): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = trick[0].card.suit;
  const sameSuit = hand.filter((c) => c.suit === ledSuit);
  if (sameSuit.length > 0) return sameSuit;
  return hand;
}

export function botBid(hand: Card[], trump: Suit): number {
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

export function botDecide(
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
