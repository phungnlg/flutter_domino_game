import { Player } from './player';

export interface Room {
  id: string;
  code: string;
  status: string;
  players: Player[];
  createdAt?: string;
}

export function createRoom(params: {
  id: string;
  code: string;
  status?: string;
  players?: Player[];
  createdAt?: string;
}): Room {
  return {
    id: params.id,
    code: params.code,
    status: params.status ?? 'waiting',
    players: params.players ?? [],
    createdAt: params.createdAt,
  };
}

export function isFull(room: Room): boolean {
  return room.players.length >= 4;
}

export function canStart(room: Room): boolean {
  return room.players.length === 4 && room.status === 'waiting';
}

export function isActive(room: Room): boolean {
  return room.status === 'active';
}
