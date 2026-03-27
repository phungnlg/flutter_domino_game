import { v4 as uuidv4 } from 'uuid';
import { DominoTile, createDominoTile } from '../../data/models/dominoTile';
import { GameState } from '../../data/models/gameState';
import { Player, createPlayer } from '../../data/models/player';
import { Room } from '../../data/models/room';
import { GameRepository } from '../../data/repositories/gameRepository';
import { RealtimeRepository } from '../../data/repositories/realtimeRepository';

export class GameService {
  private gameRepository: GameRepository;
  private realtimeRepository: RealtimeRepository;
  private _userId: string | null = null;
  private _currentPlayerId: string | null = null;
  private _lastPlayerHand: DominoTile[] | null = null;
  private _lastPlayers: Player[] | null = null;

  constructor(
    gameRepository?: GameRepository,
    realtimeRepository?: RealtimeRepository
  ) {
    this.gameRepository = gameRepository ?? new GameRepository();
    this.realtimeRepository = realtimeRepository ?? new RealtimeRepository();
  }

  get userId(): string {
    if (!this._userId) {
      this._userId = uuidv4();
    }
    return this._userId;
  }

  get currentPlayerId(): string | null {
    return this._currentPlayerId;
  }

  get lastPlayerHand(): DominoTile[] | null {
    return this._lastPlayerHand;
  }

  get lastPlayers(): Player[] | null {
    return this._lastPlayers;
  }

  private unwrap(response: Record<string, any>): Record<string, any> {
    if ('data' in response) {
      return response.data;
    }
    return response;
  }

  async createAndJoinRoom(playerName: string): Promise<Room> {
    const result = await this.gameRepository.createRoom(
      playerName,
      this.userId
    );
    const data = this.unwrap(result);
    const roomJson = data.room as Record<string, any>;
    const playerJson = data.player as Record<string, any>;
    this._currentPlayerId = playerJson.id as string;

    const player = createPlayer({
      id: playerJson.id,
      name: playerJson.name,
      team: playerJson.team,
      seat: playerJson.seat,
      isBot: playerJson.isBot ?? playerJson.is_bot ?? false,
    });

    return {
      id: roomJson.id,
      code: roomJson.code,
      status: roomJson.status ?? 'waiting',
      players: [player],
    };
  }

  async joinExistingRoom(code: string, playerName: string): Promise<Room> {
    const result = await this.gameRepository.joinRoom(
      code,
      playerName,
      this.userId
    );
    const data = this.unwrap(result);
    const roomJson = data.room as Record<string, any>;
    const playerJson = data.player as Record<string, any>;
    this._currentPlayerId = playerJson.id as string;

    const player = createPlayer({
      id: playerJson.id,
      name: playerJson.name,
      team: playerJson.team,
      seat: playerJson.seat,
      isBot: playerJson.isBot ?? playerJson.is_bot ?? false,
    });

    if (roomJson.players && Array.isArray(roomJson.players)) {
      return this.parseRoom(roomJson);
    }

    return {
      id: roomJson.id,
      code: roomJson.code,
      status: roomJson.status ?? 'waiting',
      players: [player],
    };
  }

  private parseRoom(json: Record<string, any>): Room {
    const players = (json.players as any[]).map((p: any) =>
      createPlayer({
        id: p.id,
        name: p.name,
        team: p.team,
        seat: p.seat,
        isBot: p.isBot ?? p.is_bot ?? false,
      })
    );
    return {
      id: json.id,
      code: json.code,
      status: json.status ?? 'waiting',
      players,
    };
  }

  async listRooms(): Promise<Room[]> {
    const results = await this.gameRepository.listRooms();
    return results.map((json) => this.parseRoom(json));
  }

  async getRoomDetails(roomId: string): Promise<Room> {
    const result = await this.gameRepository.getRoomDetails(roomId);
    const data = this.unwrap(result);
    return this.parseRoom(data);
  }

  async addBots(roomId: string): Promise<Player[]> {
    const result = await this.gameRepository.addBots(roomId);
    const data = this.unwrap(result);
    const playersList = data.players as any[];
    return playersList.map((p: any) =>
      createPlayer({
        id: p.id,
        name: p.name,
        team: p.team,
        seat: p.seat,
        isBot: p.isBot ?? p.is_bot ?? false,
      })
    );
  }

  async startGame(roomId: string): Promise<Record<string, any>> {
    const result = await this.gameRepository.startGame(roomId);
    return this.unwrap(result);
  }

  async playTile(
    roomId: string,
    playerId: string,
    tile: DominoTile,
    end: string
  ): Promise<GameState> {
    const result = await this.gameRepository.placeTile(
      roomId,
      playerId,
      { left: tile.left, right: tile.right },
      end
    );
    const data = this.unwrap(result);
    return this.parseGameState(data);
  }

  async pass(roomId: string, playerId: string): Promise<GameState> {
    const result = await this.gameRepository.passTurn(roomId, playerId);
    const data = this.unwrap(result);
    return this.parseGameState(data);
  }

  async getGameState(roomId: string, playerId: string): Promise<GameState> {
    const result = await this.gameRepository.getGameState(roomId, playerId);
    const data = this.unwrap(result);

    this._lastPlayerHand = null;
    this._lastPlayers = null;

    const playersList = data.players as any[] | undefined;
    if (playersList) {
      const parsedPlayers: Player[] = [];
      for (const p of playersList) {
        if (p.id === playerId && p.hand) {
          this._lastPlayerHand = (p.hand as any[]).map((t: any) =>
            createDominoTile(t.left, t.right)
          );
          parsedPlayers.push(
            createPlayer({
              id: p.id,
              name: p.name,
              team: Number(p.team),
              seat: Number(p.seat),
              hand: this._lastPlayerHand!,
              isBot: p.isBot ?? p.is_bot ?? false,
            })
          );
        } else {
          // Opponent - create placeholder hand based on handCount
          const handCount = Number(p.handCount ?? 0);
          const fakeHand = Array.from({ length: handCount }, () =>
            createDominoTile(0, 0)
          );
          parsedPlayers.push(
            createPlayer({
              id: p.id,
              name: p.name,
              team: Number(p.team),
              seat: Number(p.seat),
              hand: fakeHand,
              isBot: p.isBot ?? p.is_bot ?? false,
            })
          );
        }
      }
      this._lastPlayers = parsedPlayers;
    }

    return this.parseGameState(data);
  }

  private parseGameState(data: Record<string, any>): GameState {
    const board = (data.board as any[]) ?? [];
    return {
      roomId: data.roomId ?? data.room_id ?? '',
      board: board.map((b: any) => ({
        tile: { left: b.tile?.left ?? 0, right: b.tile?.right ?? 0 },
        end: b.end ?? '',
        flipped: b.flipped ?? false,
      })),
      currentPlayerId:
        data.currentPlayerId ?? data.current_player_id ?? null,
      openLeft: data.openLeft ?? data.open_left ?? -1,
      openRight: data.openRight ?? data.open_right ?? -1,
      round: data.round ?? 1,
      scores: data.scores ?? {},
      phase: data.phase ?? 'waiting',
      consecutivePasses:
        data.consecutivePasses ?? data.consecutive_passes ?? 0,
    };
  }

  findCurrentPlayer(players: Player[]): Player | null {
    if (!this._currentPlayerId) return null;
    return (
      players.find((p) => p.id === this._currentPlayerId) ?? null
    );
  }

  listenToGameUpdates(
    roomId: string,
    onUpdate: (data: Record<string, any>) => void
  ): void {
    this.realtimeRepository.subscribeToGameState(roomId, onUpdate);
  }

  listenToMoves(
    roomId: string,
    onMove: (data: Record<string, any>) => void
  ): void {
    this.realtimeRepository.subscribeToMoves(roomId, onMove);
  }

  listenToRoom(
    roomId: string,
    onUpdate: (data: Record<string, any>) => void
  ): void {
    this.realtimeRepository.subscribeToRoom(roomId, onUpdate);
  }

  dispose(): void {
    this.realtimeRepository.dispose();
  }
}
