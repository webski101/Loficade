import { createRng, getDailyKey, hashSeed } from "../daily";
import type { Entity, EntityKind, GameInput, GameState, RunResult } from "./types";

const RUN_SECONDS = 75;
const PLAYER_SPEED = 320;
const BASE_FALL = 180;
const MAX_FALL = 420;

function pickKind(rng: () => number, depth: number): EntityKind {
  const roll = rng();
  if (depth > 1800 && roll > 0.92) return "crystal";
  if (roll < 0.48) return "water";
  if (roll < 0.78) return "rock";
  return "plastic";
}

function spawnWave(state: GameState, rng: () => number, count: number) {
  const laneWidth = state.width / 5;
  for (let i = 0; i < count; i += 1) {
    const kind = pickKind(rng, state.depth);
    const size =
      kind === "water" ? 22 : kind === "crystal" ? 28 : kind === "plastic" ? 30 : 34;
    const lane = Math.floor(rng() * 5);
    const entity: Entity = {
      id: Math.floor(rng() * 1e9),
      kind,
      x: lane * laneWidth + laneWidth * 0.2 + rng() * (laneWidth * 0.4),
      y: state.height + 40 + i * 48 + rng() * 30,
      w: size,
      h: size,
      vx: (rng() - 0.5) * (kind === "plastic" ? 60 : 20),
    };
    state.entities.push(entity);
  }
}

export function createGame(width: number, height: number): GameState {
  const day = getDailyKey();
  const seed = hashSeed(`loficade-${day}`);
  const rng = createRng(seed);
  const state: GameState = {
    running: false,
    ended: false,
    width,
    height,
    playerX: width * 0.5 - 22,
    playerY: height * 0.22,
    playerW: 44,
    playerH: 52,
    depth: 0,
    speed: BASE_FALL,
    score: 0,
    water: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: RUN_SECONDS,
    entities: [],
    shake: 0,
    message: "Hold to drill. Catch water. Dodge the ice.",
    day,
    seed,
  };

  for (let wave = 0; wave < 8; wave += 1) {
    const before = state.entities.length;
    spawnWave(state, rng, 3 + Math.floor(rng() * 3));
    for (let i = before; i < state.entities.length; i += 1) {
      state.entities[i].y += wave * 170;
    }
  }

  return state;
}

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function startGame(state: GameState) {
  state.running = true;
  state.ended = false;
  state.message = "Drill deeper. Fill the well.";
}

export function endGame(state: GameState, reason: string): RunResult {
  state.running = false;
  state.ended = true;
  state.message = reason;
  return {
    score: Math.floor(state.score),
    water: state.water,
    depth: Math.floor(state.depth),
    maxCombo: state.maxCombo,
    reason,
  };
}

export function updateGame(
  state: GameState,
  input: GameInput,
  dt: number,
  rng: () => number
): RunResult | null {
  if (!state.running || state.ended) return null;

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    return endGame(state, "Shift complete. The Flurry rests.");
  }

  if (input.left) state.playerX -= PLAYER_SPEED * dt;
  if (input.right) state.playerX += PLAYER_SPEED * dt;
  state.playerX = Math.max(8, Math.min(state.width - state.playerW - 8, state.playerX));

  state.speed = Math.min(MAX_FALL, BASE_FALL + state.depth * 0.04);
  state.depth += state.speed * dt;
  state.score += state.speed * dt * 0.08;

  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 8);

  for (const entity of state.entities) {
    entity.y -= state.speed * dt;
    entity.x += entity.vx * dt;
    if (entity.x < 0 || entity.x + entity.w > state.width) entity.vx *= -1;
  }

  const hitboxPad = 6;
  for (const entity of state.entities) {
    if (entity.collected) continue;
    const hit = overlaps(
      state.playerX + hitboxPad,
      state.playerY + hitboxPad,
      state.playerW - hitboxPad * 2,
      state.playerH - hitboxPad * 2,
      entity.x,
      entity.y,
      entity.w,
      entity.h
    );
    if (!hit) continue;

    if (entity.kind === "water" || entity.kind === "crystal") {
      entity.collected = true;
      const gain = entity.kind === "crystal" ? 5 : 1;
      state.water += gain;
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.score += gain * 40 + state.combo * 8;
      state.message =
        entity.kind === "crystal"
          ? "Crystal melt! Bonus water."
          : state.combo > 4
            ? `Combo x${state.combo}`
            : "Water secured.";
    } else {
      return endGame(
        state,
        entity.kind === "plastic"
          ? "Plastic jammed the drill. Run over."
          : "Hit solid ice. Drill snapped."
      );
    }
  }

  state.entities = state.entities.filter(
    (entity) => !entity.collected && entity.y > -80
  );

  while (state.entities.length < 18) {
    spawnWave(state, rng, 2 + Math.floor(rng() * 3));
  }

  return null;
}
