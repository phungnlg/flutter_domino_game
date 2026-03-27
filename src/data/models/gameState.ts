export interface BoardTile {
  tile: { left: number; right: number };
  end: string;
  flipped: boolean;
}

export interface GameState {
  roomId: string;
  board: BoardTile[];
  currentPlayerId: string | null;
  openLeft: number;
  openRight: number;
  round: number;
  scores: Record<string, number>;
  phase: string;
  consecutivePasses: number;
}

export function createInitialGameState(): GameState {
  return {
    roomId: '',
    board: [],
    currentPlayerId: null,
    openLeft: -1,
    openRight: -1,
    round: 1,
    scores: {},
    phase: 'waiting',
    consecutivePasses: 0,
  };
}

export function isWaiting(state: GameState): boolean {
  return state.phase === 'waiting';
}

export function isPlaying(state: GameState): boolean {
  return state.phase === 'playing';
}

export function isRoundOver(state: GameState): boolean {
  return state.phase === 'round_over';
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'game_over';
}

export function isBlocked(state: GameState): boolean {
  return state.consecutivePasses >= 4;
}
