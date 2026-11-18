import type { ScoreEntry } from "@/lib/scores";

type Props = {
  scores: ScoreEntry[];
};

export default function Leaderboard({ scores }: Props) {
  return (
    <section className="panel board">
      <div className="panel-head">
        <h2>Today’s Flurry</h2>
        <span className="day-chip">daily</span>
      </div>
      {scores.length === 0 ? (
        <p className="panel-copy">No drills yet. Be the first to fill the well.</p>
      ) : (
        <ol className="score-list">
          {scores.map((entry, index) => (
            <li key={entry.id}>
              <span className="rank">{index + 1}</span>
              <span className="name">{entry.name}</span>
              <span className="stat">{entry.score}</span>
              <span className="sub">{entry.water} water · {entry.depth}m</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
