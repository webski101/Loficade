type Props = {
  water: number;
  goal: number;
  progress: number;
  message: string;
  day: string;
};

export default function WellMeter({ water, goal, progress, message, day }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <section className="panel well">
      <div className="panel-head">
        <h2>Community well</h2>
        <span className="day-chip">{day}</span>
      </div>
      <p className="panel-copy">{message}</p>
      <div className="meter" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="meter-meta">
        <span>{water} drops</span>
        <span>Goal {goal}</span>
      </div>
    </section>
  );
}
