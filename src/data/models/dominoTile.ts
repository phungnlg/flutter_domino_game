export interface DominoTile {
  left: number;
  right: number;
}

export function isDouble(tile: DominoTile): boolean {
  return tile.left === tile.right;
}

export function pipCount(tile: DominoTile): number {
  return tile.left + tile.right;
}

export function canPlayOn(tile: DominoTile, openEnd: number): boolean {
  return tile.left === openEnd || tile.right === openEnd;
}

export function displayId(tile: DominoTile): string {
  return `[${tile.left}|${tile.right}]`;
}

export function createDominoTile(left: number, right: number): DominoTile {
  return { left, right };
}
