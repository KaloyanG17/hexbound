import { simpleBotTurn } from "@hexbound/ai";
import { baseSet, type ContentSet } from "@hexbound/content";
import {
  applyCommand, type Command, createMatch, type FightRecord, isAlive, type MatchState, resolveRound,
} from "@hexbound/game-core";

/**
 * The only thing the UI talks to. Offline it is backed by LocalTransport; for PvP a
 * RemoteTransport will send the same Commands over a WebSocket to the game server,
 * which runs the same game-core. Methods are async so both fit the same shape.
 */
export interface GameTransport {
  readonly playerId: number;
  readonly content: ContentSet;
  getState(): MatchState;
  subscribe(listener: (state: MatchState) => void): () => void;
  send(cmd: Command): Promise<{ ok: true } | { ok: false; error: string }>;
  /** Lock in this round; resolves with every fight once all seats are ready. */
  ready(): Promise<FightRecord[]>;
}

/** Offline host: one human seat, every other seat is a bot. Runs on the main thread for now. */
export class LocalTransport implements GameTransport {
  readonly playerId = 0;
  readonly content = baseSet;
  private state: MatchState;
  private listeners = new Set<(state: MatchState) => void>();

  constructor(seed: number, playerCount: number) {
    const names = ["You", ...Array.from({ length: playerCount - 1 }, (_, i) => `Bot ${i + 1}`)];
    this.state = createMatch({ seed, playerNames: names }, this.content);
  }

  getState() {
    return this.state;
  }

  subscribe(listener: (state: MatchState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async send(cmd: Command) {
    const result = applyCommand(this.state, this.playerId, cmd, this.content);
    if (!result.ok) return result;
    this.set(result.state);
    return { ok: true as const };
  }

  async ready() {
    let state = this.state;
    for (const p of state.players) {
      if (p.id !== this.playerId && isAlive(p)) state = simpleBotTurn(state, p.id, this.content);
    }
    const { state: next, fights } = resolveRound(state, this.content);
    this.set(next);
    return fights;
  }

  private set(state: MatchState) {
    this.state = state;
    for (const l of this.listeners) l(state);
  }
}
