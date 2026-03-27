import { ApiConfig } from '../../core/constants/apiConfig';

export class GameRepository {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? ApiConfig.vercelApiUrl;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  async createRoom(
    hostName: string,
    userId: string
  ): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/rooms/create`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ hostName, userId }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to create room: ${body}`);
    }
    return response.json();
  }

  async joinRoom(
    code: string,
    playerName: string,
    userId: string
  ): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/rooms/join`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ code, playerName, userId }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to join room: ${body}`);
    }
    return response.json();
  }

  async listRooms(): Promise<Record<string, any>[]> {
    const response = await fetch(`${this.baseUrl}/api/rooms/list`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to list rooms: ${body}`);
    }
    const body = await response.json();
    // API returns {"data": {"rooms": [...]}}
    const data =
      body && typeof body === 'object' && 'data' in body ? body.data : body;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'rooms' in data) {
      return data.rooms;
    }
    return [];
  }

  async getRoomDetails(roomId: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/rooms/${roomId}`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get room details: ${body}`);
    }
    return response.json();
  }

  async startGame(roomId: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/game/start`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ roomId }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to start game: ${body}`);
    }
    return response.json();
  }

  async placeTile(
    roomId: string,
    playerId: string,
    tile: Record<string, any>,
    end: string
  ): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/game/place-tile`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ roomId, playerId, tile, end }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to place tile: ${body}`);
    }
    return response.json();
  }

  async passTurn(
    roomId: string,
    playerId: string
  ): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/game/pass`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ roomId, playerId }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to pass turn: ${body}`);
    }
    return response.json();
  }

  async getGameState(
    roomId: string,
    playerId: string
  ): Promise<Record<string, any>> {
    const response = await fetch(
      `${this.baseUrl}/api/game/state?roomId=${roomId}&playerId=${playerId}`,
      {
        method: 'GET',
        headers: this.headers,
      }
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get game state: ${body}`);
    }
    return response.json();
  }

  async addBots(roomId: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/game/add-bots`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ roomId }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to add bots: ${body}`);
    }
    return response.json();
  }
}
