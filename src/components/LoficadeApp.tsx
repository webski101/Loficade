"use client";

import { useCallback, useEffect, useState } from "react";
import GameCanvas from "./GameCanvas";
import Leaderboard from "./Leaderboard";
import WellMeter from "./WellMeter";
import type { RunResult } from "@/lib/game/types";
import type { ScoreEntry } from "@/lib/scores";

type Well = {
  day: string;
  water: number;
  goal: number;
  progress: number;
  message: string;
};

const NAME_KEY = "loficade-name";

export default function LoficadeApp() {
  const [name, setName] = useState("Yeti");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [well, setWell] = useState<Well>({
    day: "—",
    water: 0,
    goal: 500,
    progress: 0,
    message: "Loading the community well…",
  });
  const [lastRun, setLastRun] = useState<RunResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/scores", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setScores(data.scores || []);
        if (data.well) setWell(data.well);
      } catch {
        if (!cancelled) setStatus("Could not load today’s board.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRunEnd = useCallback(
    async (result: RunResult) => {
      setLastRun(result);
      setSaving(true);
      setStatus("Logging your drill…");
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            name,
            score: result.score,
            water: result.water,
            depth: result.depth,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        setScores(data.scores || []);
        if (data.well) setWell(data.well);
        setStatus("Logged to today’s Flurry board.");
      } catch {
        setStatus("Run finished, but the board did not update.");
      } finally {
        setSaving(false);
      }
    },
    [name]
  );

  return (
    <div className="page">
      <header className="hero">
        <img src="/lofi-logo.png" alt="" className="hero-mark" />
        <div className="hero-copy">
          <p className="brand">Loficade</p>
          <h1>Drill the deep well.</h1>
          <p className="lede">
            Catch meltwater, dodge ice hazards, and fill the Flurry community well.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="play">
          <label className="name-field">
            <span>Drill name</span>
            <input
              value={name}
              maxLength={18}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const next = e.target.value;
                setName(next);
                window.localStorage.setItem(NAME_KEY, next);
              }}
              placeholder="Your yeti name"
            />
          </label>

          <GameCanvas onRunEnd={onRunEnd} />

          {lastRun && (
            <div className="run-result" aria-live="polite">
              <p>
                {lastRun.reason} · {lastRun.score} pts · {lastRun.water} water ·{" "}
                {lastRun.depth}m
                {lastRun.maxCombo > 1 ? ` · combo x${lastRun.maxCombo}` : ""}
              </p>
              {saving ? <p className="muted">Saving…</p> : null}
              {status ? <p className="muted">{status}</p> : null}
            </div>
          )}
        </section>

        <aside className="side">
          <WellMeter {...well} />
          <Leaderboard scores={scores} />
          <section className="panel how">
            <div className="panel-head">
              <h2>How to play</h2>
            </div>
            <ul>
              <li>Same daily course for every player.</li>
              <li>Blue drops and crystals fill the well.</li>
              <li>Ice rocks and plastic end the run.</li>
              <li>Deeper + combos = higher score.</li>
            </ul>
          </section>
        </aside>
      </main>

      <footer className="foot">
        <p>Loficade · CLAY Hackathon III · built for Lofi the Yeti</p>
      </footer>
    </div>
  );
}
