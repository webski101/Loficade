"use client";

import { useEffect, useRef, useState } from "react";
import { createRng } from "@/lib/daily";
import {
  createGame,
  endGame,
  startGame,
  updateGame,
} from "@/lib/game/engine";
import type { GameInput, GameState, RunResult } from "@/lib/game/types";

type Props = {
  onRunEnd: (result: RunResult) => void;
};

function drawRounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function render(ctx: CanvasRenderingContext2D, state: GameState, logo: HTMLImageElement | null) {
  const { width, height } = state;
  const shakeX = state.shake ? (Math.random() - 0.5) * state.shake * 4 : 0;
  const shakeY = state.shake ? (Math.random() - 0.5) * state.shake * 4 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#9fd7ef");
  sky.addColorStop(0.35, "#6bb8d8");
  sky.addColorStop(1, "#1a4d6b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // ice strata bands
  const bandOffset = (state.depth * 0.35) % 80;
  for (let y = -80; y < height + 80; y += 80) {
    const yy = y + bandOffset;
    ctx.fillStyle = y % 160 === 0 ? "rgba(255,255,255,0.08)" : "rgba(12,58,84,0.18)";
    ctx.fillRect(0, yy, width, 40);
  }

  // tunnel walls
  const wall = ctx.createLinearGradient(0, 0, width, 0);
  wall.addColorStop(0, "rgba(8,40,62,0.55)");
  wall.addColorStop(0.12, "rgba(8,40,62,0)");
  wall.addColorStop(0.88, "rgba(8,40,62,0)");
  wall.addColorStop(1, "rgba(8,40,62,0.55)");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  for (const entity of state.entities) {
    if (entity.collected) continue;
    if (entity.kind === "water") {
      ctx.fillStyle = "#5ec8ff";
      ctx.beginPath();
      ctx.ellipse(
        entity.x + entity.w / 2,
        entity.y + entity.h / 2,
        entity.w / 2,
        entity.h / 2.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(
        entity.x + entity.w * 0.38,
        entity.y + entity.h * 0.35,
        3,
        5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (entity.kind === "crystal") {
      ctx.fillStyle = "#b8f0ff";
      ctx.beginPath();
      ctx.moveTo(entity.x + entity.w / 2, entity.y);
      ctx.lineTo(entity.x + entity.w, entity.y + entity.h * 0.55);
      ctx.lineTo(entity.x + entity.w * 0.5, entity.y + entity.h);
      ctx.lineTo(entity.x, entity.y + entity.h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.stroke();
    } else if (entity.kind === "plastic") {
      ctx.fillStyle = "#e8a45a";
      drawRounded(ctx, entity.x, entity.y, entity.w, entity.h * 0.7, 4);
      ctx.fill();
      ctx.fillStyle = "#c47a2e";
      ctx.fillRect(entity.x + 4, entity.y + 6, entity.w - 8, 4);
    } else {
      ctx.fillStyle = "#d9eef8";
      drawRounded(ctx, entity.x, entity.y, entity.w, entity.h, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(40,90,120,0.45)";
      ctx.stroke();
    }
  }

  // player / Lofi
  const px = state.playerX;
  const py = state.playerY;
  if (logo && logo.complete) {
    ctx.drawImage(logo, px - 4, py - 8, state.playerW + 8, state.playerH + 8);
  } else {
    ctx.fillStyle = "#f4fbff";
    drawRounded(ctx, px, py, state.playerW, state.playerH, 14);
    ctx.fill();
    ctx.fillStyle = "#1d4f6d";
    ctx.beginPath();
    ctx.arc(px + 14, py + 22, 4, 0, Math.PI * 2);
    ctx.arc(px + 30, py + 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // drill bit
  ctx.fillStyle = "#7ad0f0";
  ctx.beginPath();
  ctx.moveTo(px + state.playerW / 2 - 6, py + state.playerH - 4);
  ctx.lineTo(px + state.playerW / 2 + 6, py + state.playerH - 4);
  ctx.lineTo(px + state.playerW / 2, py + state.playerH + 16 + Math.sin(state.depth * 0.08) * 3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export default function GameCanvas({ onRunEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef<GameInput>({ left: false, right: false });
  const rngRef = useRef<() => number>(() => Math.random());
  const logoRef = useRef<HTMLImageElement | null>(null);
  const onRunEndRef = useRef(onRunEnd);
  const [hud, setHud] = useState({
    score: 0,
    water: 0,
    depth: 0,
    timeLeft: 75,
    message: "Tap Start to drill today’s well.",
    running: false,
    ended: false,
  });

  useEffect(() => {
    onRunEndRef.current = onRunEnd;
  }, [onRunEnd]);

  useEffect(() => {
    const img = new Image();
    img.src = "/lofi-logo.png";
    logoRef.current = img;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = Math.min(420, parent?.clientWidth || 420);
      const h = Math.round(Math.min(560, w * 1.2));
      const wasRunning = stateRef.current?.running;
      canvas.width = w;
      canvas.height = h;
      if (wasRunning && stateRef.current) {
        stateRef.current.width = w;
        stateRef.current.height = h;
        render(ctx, stateRef.current, logoRef.current);
        return;
      }
      const fresh = createGame(w, h);
      stateRef.current = fresh;
      rngRef.current = createRng(fresh.seed ^ 0x9e3779b9);
      setHud({
        score: 0,
        water: 0,
        depth: 0,
        timeLeft: fresh.timeLeft,
        message: fresh.message,
        running: false,
        ended: false,
      });
      render(ctx, fresh, logoRef.current);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;

    const tick = (now: number) => {
      const state = stateRef.current;
      if (!state || !ctx) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const result = updateGame(state, inputRef.current, dt, rngRef.current);
      render(ctx, state, logoRef.current);

      hudAcc += dt;
      if (hudAcc > 0.1 || result || state.ended) {
        hudAcc = 0;
        setHud({
          score: Math.floor(state.score),
          water: state.water,
          depth: Math.floor(state.depth),
          timeLeft: Math.max(0, state.timeLeft),
          message: state.message,
          running: state.running,
          ended: state.ended,
        });
      }

      if (result) {
        onRunEndRef.current(result);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        inputRef.current.left = down;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        inputRef.current.right = down;
        e.preventDefault();
      }
    };
    const keyDown = (e: KeyboardEvent) => onKey(e, true);
    const keyUp = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  const begin = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;
    const fresh = createGame(canvas.width, canvas.height);
    stateRef.current = fresh;
    rngRef.current = createRng(fresh.seed ^ 0x9e3779b9);
    startGame(fresh);
    setHud({
      score: 0,
      water: 0,
      depth: 0,
      timeLeft: fresh.timeLeft,
      message: fresh.message,
      running: true,
      ended: false,
    });
  };

  const pointerSteer = (clientX: number) => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state || !state.running) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    inputRef.current.left = x < rect.width * 0.45;
    inputRef.current.right = x > rect.width * 0.55;
  };

  return (
    <div className="game-shell">
      <div className="hud">
        <div>
          <span className="hud-label">Score</span>
          <strong>{hud.score}</strong>
        </div>
        <div>
          <span className="hud-label">Water</span>
          <strong>{hud.water}</strong>
        </div>
        <div>
          <span className="hud-label">Depth</span>
          <strong>{hud.depth}m</strong>
        </div>
        <div>
          <span className="hud-label">Time</span>
          <strong>{Math.ceil(hud.timeLeft)}s</strong>
        </div>
      </div>

      <div className="game-actions top">
        {!hud.running ? (
          <button
            type="button"
            className="cta primary"
            data-testid="start-drill"
            onClick={begin}
          >
            {hud.ended ? "Drill again" : "Start drilling"}
          </button>
        ) : (
          <button
            type="button"
            className="cta ghost"
            data-testid="end-drill"
            onClick={() => {
              const state = stateRef.current;
              if (!state || state.ended) return;
              const result = endGame(state, "You pulled the drill.");
              onRunEndRef.current(result);
            }}
          >
            End run
          </button>
        )}
        <p className="hint">← → or A/D · tap left/right on the shaft</p>
      </div>

      <p className="game-message">{hud.message}</p>

      <div
        className="canvas-wrap"
        onPointerDown={(e) => pointerSteer(e.clientX)}
        onPointerMove={(e) => {
          if (e.buttons) pointerSteer(e.clientX);
        }}
        onPointerUp={() => {
          inputRef.current.left = false;
          inputRef.current.right = false;
        }}
        onPointerLeave={() => {
          inputRef.current.left = false;
          inputRef.current.right = false;
        }}
      >
        <canvas ref={canvasRef} aria-label="Loficade drill game" />
        {!hud.running ? (
          <button
            type="button"
            className="canvas-start"
            data-testid="start-drill-overlay"
            onClick={begin}
          >
            {hud.ended ? "Drill again" : "Start drilling"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
