import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mini attack-graph visualization.
 *
 * Five nodes connected by directed edges. Hover (or focus) a node to
 * see how it relates to its neighbors and why it matters in a real
 * attack chain. Pure SVG — no graph library dependency for the small
 * demo here. The big React Flow graph lives on the Attack Paths page.
 */

interface GraphNode {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  kind: 'entry' | 'pivot' | 'goal';
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

const NODES: GraphNode[] = [
  { id: 'pw', label: 'Weak password', description: 'Reused or low-entropy credential. Often the first thing leaked or guessed.', x: 60, y: 110, kind: 'entry' },
  { id: 'email', label: 'Email compromise', description: 'Primary inbox owned. Attacker can request password resets for every other account.', x: 230, y: 60, kind: 'pivot' },
  { id: 'social', label: 'Social takeover', description: 'Identity-bearing accounts taken over. Used for phishing the victim\'s contacts.', x: 230, y: 170, kind: 'pivot' },
  { id: 'recovery', label: 'Recovery exploit', description: 'Weak phone/email recovery bypasses MFA even on otherwise strong accounts.', x: 400, y: 110, kind: 'pivot' },
  { id: 'pay', label: 'Payment access', description: 'Final goal — banks, cards, exchanges. Where the real damage happens.', x: 560, y: 110, kind: 'goal' },
];

const EDGES: GraphEdge[] = [
  { from: 'pw', to: 'email', label: 'reset' },
  { from: 'pw', to: 'social', label: 'login' },
  { from: 'email', to: 'recovery', label: 'OTP' },
  { from: 'social', to: 'recovery', label: 'social-eng' },
  { from: 'recovery', to: 'pay', label: 'bypass MFA' },
];

const COLOR_BY_KIND = {
  entry: '#f04438',
  pivot: '#5e6ad2',
  goal: '#f79009',
};

export function AttackGraphMini() {
  const [hovered, setHovered] = useState<string | null>('email');
  const node = NODES.find((n) => n.id === hovered) ?? null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2/40">
        <svg viewBox="0 0 620 220" className="w-full">
          <defs>
            <marker
              id="arrow-mini"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="#5e6ad2" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map((e) => {
            const from = NODES.find((n) => n.id === e.from)!;
            const to = NODES.find((n) => n.id === e.to)!;
            const active = hovered === e.from || hovered === e.to;
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2 - 12;
            return (
              <g key={`${e.from}-${e.to}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={active ? '#828fff' : '#2c2e34'}
                  strokeWidth={active ? 1.6 : 1}
                  markerEnd="url(#arrow-mini)"
                  className="transition-[stroke,stroke-width] duration-200"
                />
                <text
                  x={mx}
                  y={my}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fill={active ? '#d0d6e0' : '#62666d'}
                  className="select-none"
                >
                  {e.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((n) => {
            const isActive = hovered === n.id;
            const color = COLOR_BY_KIND[n.kind];
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onFocus={() => setHovered(n.id)}
                tabIndex={0}
                className="cursor-pointer outline-none"
              >
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={isActive ? 26 : 22}
                  fill={`${color}1a`}
                  stroke={color}
                  strokeWidth={isActive ? 1.5 : 1}
                  animate={{ r: isActive ? 26 : 22 }}
                  transition={{ duration: 0.2 }}
                />
                {isActive && (
                  <circle cx={n.x} cy={n.y} r={32} fill="none" stroke={color} strokeWidth={0.6} opacity={0.35} />
                )}
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={500}
                  fill="#f7f8f8"
                  className="pointer-events-none select-none"
                >
                  {n.label.split(' ')[0]}
                </text>
                <text
                  x={n.x}
                  y={n.y + 14}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="Inter, system-ui, sans-serif"
                  fill="#8a8f98"
                  className="pointer-events-none select-none"
                >
                  {n.label.split(' ').slice(1).join(' ')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <div className="min-h-[64px] rounded-lg border border-hairline bg-surface-1/50 p-3">
        <AnimatePresence mode="wait">
          {node && (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] font-medium text-ink">{node.label}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider"
                  style={{
                    color: COLOR_BY_KIND[node.kind],
                    background: `${COLOR_BY_KIND[node.kind]}1a`,
                  }}
                >
                  {node.kind}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-subtle">
                {node.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-ink-tertiary">
        <LegendDot color={COLOR_BY_KIND.entry} label="entry" />
        <LegendDot color={COLOR_BY_KIND.pivot} label="pivot" />
        <LegendDot color={COLOR_BY_KIND.goal} label="goal" />
        <span className="ml-auto font-mono">
          {NODES.length} nodes · {EDGES.length} edges
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}
