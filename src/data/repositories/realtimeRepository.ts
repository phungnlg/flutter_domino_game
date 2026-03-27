import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ApiConfig } from '../../core/constants/apiConfig';

export class RealtimeRepository {
  private client: SupabaseClient;
  private channels: RealtimeChannel[] = [];

  constructor(client?: SupabaseClient) {
    this.client =
      client ??
      createClient(ApiConfig.supabaseUrl, ApiConfig.supabaseAnonKey);
  }

  subscribeToGameState(
    roomId: string,
    callback: (payload: Record<string, any>) => void
  ): void {
    const channel = this.client
      .channel(`game_state_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_states',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newRecord = payload.new;
          if (newRecord && Object.keys(newRecord).length > 0) {
            callback(newRecord as Record<string, any>);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  subscribeToMoves(
    roomId: string,
    callback: (payload: Record<string, any>) => void
  ): void {
    const channel = this.client
      .channel(`moves_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newRecord = payload.new;
          if (newRecord && Object.keys(newRecord).length > 0) {
            callback(newRecord as Record<string, any>);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  subscribeToRoom(
    roomId: string,
    callback: (payload: Record<string, any>) => void
  ): void {
    const channel = this.client
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newRecord = payload.new;
          if (newRecord && Object.keys(newRecord).length > 0) {
            callback(newRecord as Record<string, any>);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  async unsubscribeAll(): Promise<void> {
    for (const channel of this.channels) {
      await this.client.removeChannel(channel);
    }
    this.channels = [];
  }

  dispose(): void {
    this.unsubscribeAll();
  }
}
