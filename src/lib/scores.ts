import { nanoid } from "nanoid";
import { getDailyKey } from "./daily";

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  water: number;
  depth: number;
  day: string;
  createdAt: string;
};

type Store = {
  scores: ScoreEntry[];
  waterByDay: Record<string, number>;
};

declare global {
  var __loficadeStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__loficadeStore) {
    globalThis.__loficadeStore = { scores: [], waterByDay: {} };
  }
  return globalThis.__loficadeStore;
}

export function listScores(day = getDailyKey(), limit = 20) {
  return getStore()
    .scores.filter((entry) => entry.day === day)
    .sort((a, b) => b.score - a.score || b.water - a.water)
    .slice(0, limit);
}

export function addScore(input: {
  name: string;
  score: number;
  water: number;
  depth: number;
}) {
  const store = getStore();
  const day = getDailyKey();
  const entry: ScoreEntry = {
    id: nanoid(10),
    name: input.name.trim().slice(0, 18) || "Yeti",
    score: Math.max(0, Math.floor(input.score)),
    water: Math.max(0, Math.floor(input.water)),
    depth: Math.max(0, Math.floor(input.depth)),
    day,
    createdAt: new Date().toISOString(),
  };
  store.scores.unshift(entry);
  store.scores = store.scores.slice(0, 500);
  store.waterByDay[day] = (store.waterByDay[day] || 0) + entry.water;
  return entry;
}

export function getWellProgress(day = getDailyKey()) {
  const water = getStore().waterByDay[day] || 0;
  const goal = 500;
  const milestones = [100, 250, 500];
  return {
    day,
    water,
    goal,
    progress: Math.min(1, water / goal),
    milestones,
    nextMilestone: milestones.find((mark) => water < mark) ?? null,
    message:
      water >= goal
        ? "Daily well filled. The Flurry drilled deep today."
        : "Every drop the Flurry collects fills the community well meter.",
  };
}
