import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

const VB = 600; // viewBox is 0 0 600 600
const CENTER = { x: 300, y: 300 };

const NODES = [
  { id: 'n', x: 300, y: 80, r: 4.5, depth: 'near' }, // N
  { id: 'ne', x: 462, y: 142, r: 4, depth: 'near' }, // NE
  { id: 'e', x: 520, y: 300, r: 3, depth: 'far' }, // E
  { id: 'se', x: 462, y: 458, r: 4, depth: 'near' }, // SE
  { id: 's', x: 300, y: 520, r: 3, depth: 'far' }, // S
  { id: 'sw', x: 138, y: 458, r: 4, depth: 'near' }, // SW
  { id: 'w', x: 80, y: 300, r: 3, depth: 'far' }, // W
  { id: 'nw', x: 138, y: 142, r: 4, depth: 'near' }, // NW
  { id: 'hub', x: 300, y: 300, r: 6.5, depth: 'hub' }, // center
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

const LINKS = [
  ['hub', 'n', 18, true],
  ['hub', 'ne', 18, true],
  ['hub', 'se', 18, true],
  ['hub', 'sw', 18, true],
  ['hub', 'nw', 18, true],
  ['n', 'ne', 46, false],
  ['ne', 'se', 85, false],
  ['se', 'sw', 85, false],
  ['sw', 'nw', 85, false],
  ['nw', 'n', 46, false],
  ['e', 'ne', 26, false],
  ['e', 'se', 26, false],
  ['w', 'nw', 26, false],
  ['w', 'sw', 26, false],
  ['s', 'se', 26, false],
  ['s', 'sw', 26, false],
];

function arcPath(a, b, bulge) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let px = -dy / len;
  let py = dx / len;

  const awayX = mx - CENTER.x;
  const awayY = my - CENTER.y;
  if (px * awayX + py * awayY < 0) {
    px = -px;
    py = -py;
  }

  const cx = mx + px * bulge;
  const cy = my + py * bulge;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export default function GlobalNetwork({ className = '', showPulses = true, size = 620 }) {
  const reduce = useReducedMotion();

  const links = useMemo(
    () =>
      LINKS.map(([fromId, toId, bulge, animated], i) => ({
        id: `${fromId}-${toId}`,
        d: arcPath(byId[fromId], byId[toId], bulge),
        animated: animated && showPulses,
        delay: -(i % 5) * 0.9,
      })),
    [showPulses]
  );

  return (
    <div
      className={`globalNetwork ${className}`}
      style={{ width: `clamp(320px, 110vw, ${size}px)` }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        className="globalNetwork__svg"
      >
        <g className={`globalNetwork__spin${reduce ? ' globalNetwork__spin--static' : ''}`}>
          <circle
            className="globalNetwork__meridian"
            cx={CENTER.x}
            cy={CENTER.y}
            r={230}
          />
          <ellipse
            className="globalNetwork__meridian"
            cx={CENTER.x}
            cy={CENTER.y}
            rx={230}
            ry={80}
          />
          <ellipse
            className="globalNetwork__meridian"
            cx={CENTER.x}
            cy={CENTER.y}
            rx={230}
            ry={150}
          />
          <ellipse
            className="globalNetwork__meridian"
            cx={CENTER.x}
            cy={CENTER.y}
            rx={80}
            ry={230}
          />
          <ellipse
            className="globalNetwork__meridian"
            cx={CENTER.x}
            cy={CENTER.y}
            rx={150}
            ry={230}
          />

          {links.map((link) => (
            <path
              key={`static-${link.id}`}
              d={link.d}
              className="globalNetwork__route"
            />
          ))}

          {!reduce &&
            links
              .filter((l) => l.animated)
              .map((link) => (
                <path
                  key={`pulse-${link.id}`}
                  d={link.d}
                  pathLength={1}
                  className="globalNetwork__pulse"
                  style={{ animationDelay: `${link.delay}s` }}
                />
              ))}

          {NODES.map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={n.r}
              className={`globalNetwork__node globalNetwork__node--${n.depth}${
                reduce || n.depth === 'far' ? '' : ' globalNetwork__node--pulse'
              }`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
