import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getDailyKey } from "@/lib/daily";
import { addScore, getWellProgress, listScores } from "@/lib/scores";

export async function GET() {
  await connection();
  const day = getDailyKey();
  return NextResponse.json({
    day,
    scores: listScores(day),
    well: getWellProgress(day),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "Yeti").slice(0, 18);
    const score = Number(body.score);
    const water = Number(body.water);
    const depth = Number(body.depth);

    if (![score, water, depth].every((n) => Number.isFinite(n) && n >= 0)) {
      return NextResponse.json({ error: "Invalid score payload" }, { status: 400 });
    }

    if (score > 500000 || water > 2000 || depth > 100000) {
      return NextResponse.json({ error: "Score out of range" }, { status: 400 });
    }

    const entry = addScore({ name, score, water, depth });
    return NextResponse.json({
      entry,
      scores: listScores(entry.day),
      well: getWellProgress(entry.day),
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
