import { create } from 'zustand';
import { DominoTile, canPlayOn } from '../data/models/dominoTile';
import { GameState } from '../data/models/gameState';
import { Player } from '../data/models/player';
import { Room } from '../data/models/room';
import { GameService } from '../domain/services/gameService';

interface GameStore {
  // Service
  gameService: GameService;

  // State
  currentRoom: Room | null;
  gameState: GameState | null;
  currentPlayer: Player | null;
  players: Player[];
  playerName: string;
  selectedTileIndex: number | null;
  isLoading: boolean;
  errorMessage: string | null;

  // Computed
  isMyTurn: () => boolean;
  canPass: () => boolean;

  // Actions
  setCurrentRoom: (room: Room | null) => void;
  setGameState: (state: GameState | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setPlayers: (players: Player[]) => void;
  setPlayerName: (name: string) => void;
  setSelectedTileIndex: (index: number | null) => void;
  setIsLoading: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  resetGame: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Service - singleton
  gameService: new GameService(),

  // State
  currentRoom: null,
  gameState: null,
  currentPlayer: null,
  players: [],
  playerName: '',
  selectedTileIndex: null,
  isLoading: false,
  errorMessage: null,

  // Computed
  isMyTurn: () => {
    const { gameState, currentPlayer } = get();
    if (!gameState || !currentPlayer) return false;
    return gameState.currentPlayerId === currentPlayer.id;
  },

  canPass: () => {
    const state = get();
    const isMyTurn = state.isMyTurn();
    const { gameState, currentPlayer } = state;
    if (!isMyTurn || !gameState || !currentPlayer) return false;

    // Can pass if no valid moves
    for (const tile of currentPlayer.hand) {
      if (gameState.openLeft === -1 && gameState.openRight === -1) {
        return false; // First move, must play
      }
      if (
        canPlayOn(tile, gameState.openLeft) ||
        canPlayOn(tile, gameState.openRight)
      ) {
        return false; // Has a valid move
      }
    }
    return true;
  },

  // Actions
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setGameState: (state) => set({ gameState: state }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setPlayers: (players) => set({ players }),
  setPlayerName: (name) => set({ playerName: name }),
  setSelectedTileIndex: (index) => set({ selectedTileIndex: index }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setErrorMessage: (message) => set({ errorMessage: message }),

  resetGame: () =>
    set({
      gameState: null,
      selectedTileIndex: null,
    }),

  resetAll: () =>
    set({
      currentRoom: null,
      gameState: null,
      currentPlayer: null,
      players: [],
      selectedTileIndex: null,
    }),
}));
