import { useEffect, useMemo, useState } from 'react';

// Vertical column chart of a resolution's tally. Used by the delegate
// ballot (closed result) and the chair panel (live board + history), so a
// result looks the same wherever it is shown.
//
// Column height is each option's share of the votes actually cast (0-100%).
// Every column still carries its own label, count and percentage as real
// text, so the chart never depends on colour alone; the columns themselves
// are decorative on top of that.

const MIN_VISIBLE_SHARE = 0.02; // a non-zero count never renders as an invisible column

const toPercent = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0);

export default function VoteResults({ choices, tally }) {
  // Columns start empty and grow to their value one frame after mount, so
  // the chart animates in once. Later tally changes (chair polling) animate
  // from the current height thanks to the CSS transition.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { rows, total } = useMemo(() => {
    const counts = choices.map((c) => ({
      ...c,
      count: Math.max(0, Number(tally?.[c.id]) || 0),
    }));
    const sum = counts.reduce((acc, c) => acc + c.count, 0);
    const top = Math.max(...counts.map((c) => c.count), 0);
    return {
      total: sum,
      rows: counts.map((c) => {
        const share = sum > 0 ? c.count / sum : 0;
        return {
          ...c,
          percent: toPercent(c.count, sum),
          share: c.count > 0 ? Math.max(share, MIN_VISIBLE_SHARE) : 0,
          lead: top > 0 && c.count === top,
        };
      }),
    };
  }, [choices, tally]);

  const summary = `კენჭისყრის შედეგები: ${rows
    .map((r) => `${r.label} ${r.count} (${r.percent}%)`)
    .join(', ')}`;

  return (
    <div
      className="voteResults"
      role="group"
      aria-label={summary}
    >
      <ul className="voteResults__chart">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="voteResults__col"
            data-choice={r.id}
            data-lead={r.lead ? 'true' : 'false'}
          >
            <span className="voteResults__value">
              <strong>{r.count}</strong>
              <span>{r.percent}%</span>
            </span>
            <div
              className="voteResults__track"
              aria-hidden="true"
            >
              <div
                className="voteResults__bar"
                style={{ '--share': ready ? r.share : 0, '--i': i }}
              />
            </div>
            <span className="voteResults__label">{r.label}</span>
          </li>
        ))}
      </ul>
      <p className="voteResults__total">
        {total > 0 ? `სულ მიცემულია ${total} ხმა` : 'ხმა არ მიცემულა'}
      </p>
    </div>
  );
}