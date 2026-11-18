import type { FlashcardDeck, FlashcardSession } from '../types/models';

const DECKS_KEY = 'edutrack_flashcard_decks';
const SESSIONS_KEY = 'edutrack_flashcard_sessions';

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadDecks(): FlashcardDeck[] {
  return safeGet<FlashcardDeck[]>(DECKS_KEY) || [];
}

export function saveDecks(decks: FlashcardDeck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function addDeck(deck: FlashcardDeck): FlashcardDeck[] {
  const decks = loadDecks();
  decks.unshift(deck);
  // Keep max 30 decks
  const trimmed = decks.slice(0, 30);
  saveDecks(trimmed);
  return trimmed;
}

export function removeDeck(deckId: string): FlashcardDeck[] {
  const decks = loadDecks().filter((d) => d.id !== deckId);
  saveDecks(decks);
  return decks;
}

export function loadSessions(): FlashcardSession[] {
  return safeGet<FlashcardSession[]>(SESSIONS_KEY) || [];
}

export function saveSessions(sessions: FlashcardSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function addSession(session: FlashcardSession): void {
  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions.slice(0, 100));
}
