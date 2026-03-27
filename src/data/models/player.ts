import { DominoTile, pipCount } from './dominoTile';

export interface Player {
  id: string;
  name: string;
  team: number;
  seat: number;
  hand: DominoTile[];
  isBot: boolean;
}

export function createPlayer(params: {
  id: string;
  name: string;
  team: number;
  seat: number;
  hand?: DominoTile[];
  isBot?: boolean;
}): Player {
  return {
    id: params.id,
    name: params.name,
    team: params.team,
    seat: params.seat,
    hand: params.hand ?? [],
    isBot: params.isBot ?? false,
  };
}

export function teamName(player: Player): string {
  return player.team === 1 ? 'Team A' : 'Team B';
}

export function hasEmptyHand(player: Player): boolean {
  return player.hand.length === 0;
}

export function handPipCount(player: Player): number {
  return player.hand.reduce((sum, tile) => sum + pipCount(tile), 0);
}
