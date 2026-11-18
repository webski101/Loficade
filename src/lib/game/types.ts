export type EntityKind = "water" | "rock" | "plastic" | "crystal";

export type Entity = {
  id: number;
  kind: EntityKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  collected?: boolean;
};

export type GameInput = {
  left: boolean;
  right: boolean;
};

export type GameState = {
  running: boolean;
  ended: boolean;
  width: number;
  height: number;
  playerX: number;
  playerY: number;
  playerW: number;
  playerH: number;
  depth: number;
  speed: number;
  score: number;
  water: number;
  combo: number;
  maxCombo: number;
  timeLeft: number;
  entities: Entity[];
  shake: number;
  message: string;
  day: string;
  seed: number;
};

export type RunResult = {
  score: number;
  water: number;
  depth: number;
  maxCombo: number;
  reason: string;
};
