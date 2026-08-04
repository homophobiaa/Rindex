import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useReduceMotion } from '@/lib/reduce-motion';

const features = [
  {
    title: 'Entropy & brute-force estimation',
    desc: 'Estimate password strength using log₂ of the effective search space and visualize cracking difficulty.',
    tag: 'Cryptography',
    visual: <EntropyVisual />,
    span: 'lg:col-span-2',
  },
  {
    title: 'Attack-path graph',
    desc: 'See how a single weak password chains into account takeover via reused credentials and weak recovery.',
    tag: 'Graph Theory',
    visual: <GraphVisual />,
    span: 'lg:col-span-1',
  },
  {
    title: 'Pattern detection automaton',
    desc: 'A finite state machine classifies passwords into safe, suspicious or dangerous patterns.',
    tag: 'Automata',
    visual: <AutomatonVisual />,
    span: 'lg:col-span-1',
  },
  {
    title: 'Phishing scenario simulator',
    desc: 'Interactive mini-scenarios test your awareness of urgency tactics, spoofed senders and lookalike URLs.',
    tag: 'Behavioral',
    visual: <PhishingVisual />,
    span: 'lg:col-span-2',
  },
];

export function FeatureGrid() {
  return (
    <section className="relative py-section">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Inside the platform</Eyebrow>
          <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
            Math you can see, security you can feel.
          </h2>
          <p className="mt-4 text-body-lg text-ink-subtle">
            RIndex visualizes the cryptography, graph theory and state machines behind every
            score — so you can defend what you understand.
          </p>
        </div>

        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.article
              key={f.title}
              variants={fadeUp}
              className={`panel group relative flex flex-col overflow-hidden p-6 ${f.span}`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] text-ink-muted">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {f.tag}
                </span>
              </div>
              <h3 className="mt-4 text-card-title text-ink">{f.title}</h3>
              <p className="mt-2 max-w-md text-body-sm text-ink-subtle">{f.desc}</p>
              <div className="mt-6 flex-1 rounded-lg border border-hairline-tertiary bg-surface-2/40 p-4">
                {f.visual}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* ---------- visuals ---------- */

function EntropyVisual() {
  const bars = [12, 22, 36, 52, 64, 72, 80, 88, 94, 98];
  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-caption text-ink-tertiary">Search space (log₂)</div>
          <div className="mt-1 font-mono text-[20px] text-ink">2<sup>52.3</sup></div>
        </div>
        <div className="text-right">
          <div className="text-caption text-ink-tertiary">Est. brute-force</div>
          <div className="mt-1 font-mono text-[13px] text-warning">~ 18.4 days</div>
        </div>
      </div>
      <div className="flex h-24 items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${h}%`, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-sm"
            style={{
              background: `linear-gradient(180deg, rgba(94,106,210,${0.3 + h / 200}), rgba(94,106,210,${0.8 + h / 500}))`,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-tertiary">
        <span>4 chars</span>
        <span>8</span>
        <span>12</span>
        <span>16</span>
        <span>20</span>
      </div>
    </div>
  );
}

function GraphVisual() {
  const nodes = [
    { id: 'a', x: 15, y: 20, label: 'Weak pw', tone: 'danger' },
    { id: 'b', x: 50, y: 12, label: 'Reuse', tone: 'warning' },
    { id: 'c', x: 80, y: 30, label: 'Breach', tone: 'danger' },
    { id: 'd', x: 30, y: 60, label: 'No 2FA', tone: 'warning' },
    { id: 'e', x: 70, y: 80, label: 'Takeover', tone: 'danger' },
  ];
  const edges: [string, string][] = [
    ['a', 'b'],
    ['b', 'c'],
    ['a', 'd'],
    ['d', 'e'],
    ['c', 'e'],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const toneColor = (t: string) => (t === 'danger' ? '#f04438' : '#f79009');
  const reduceMotion = useReduceMotion();

  return (
    <div className="relative h-44 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {edges.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={byId[a].x}
            y1={byId[a].y}
            x2={byId[b].x}
            y2={byId[b].y}
            stroke="#5e6ad2"
            strokeOpacity="0.4"
            strokeWidth="0.4"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay: i * 0.12 }}
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: 0.2 + i * 0.08 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            borderColor: `${toneColor(n.tone)}55`,
            boxShadow: `0 0 18px -6px ${toneColor(n.tone)}99`,
          }}
        >
          {n.label}
        </motion.div>
      ))}
    </div>
  );
}

function AutomatonVisual() {
  const states = [
    { id: 'q0', x: 14, label: 'Safe', tone: '#27a644' },
    { id: 'q1', x: 50, label: 'Suspicious', tone: '#f79009' },
    { id: 'q2', x: 86, label: 'Dangerous', tone: '#f04438' },
  ];
  const reduceMotion = useReduceMotion();
  const drawFrom = reduceMotion ? 1 : 0;
  return (
    <div className="relative h-44">
      <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <motion.path
          d="M22 25 H42"
          stroke="#3a3d46"
          strokeWidth="0.5"
          markerEnd="url(#arrow)"
          initial={{ pathLength: drawFrom }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }}
        />
        <motion.path
          d="M58 25 H78"
          stroke="#3a3d46"
          strokeWidth="0.5"
          markerEnd="url(#arrow)"
          initial={{ pathLength: drawFrom }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.55 }}
        />
        <defs>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" fill="#6a6f7c" />
          </marker>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-between px-2">
        {states.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.18 }}
            className="flex h-14 w-14 flex-col items-center justify-center rounded-full border bg-surface-2 text-[10px] text-ink-muted"
            style={{ borderColor: `${s.tone}66`, boxShadow: `0 0 20px -6px ${s.tone}88` }}
          >
            <span className="font-mono text-[9px] text-ink-tertiary">{s.id}</span>
            <span>{s.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-1 text-center font-mono text-[10px] text-ink-tertiary">
        δ : Σ × Q → Q
      </div>
    </div>
  );
}

function PhishingVisual() {
  const rows = [
    { from: 'security@paypa1.com', subject: 'Your account will be locked in 24h', risk: 'high' },
    { from: 'no-reply@github.com', subject: 'Sign-in from a new device', risk: 'low' },
    { from: 'support@netfl1x-billing.io', subject: 'Update your payment method', risk: 'high' },
    { from: 'team@linear.app', subject: 'Weekly project digest', risk: 'low' },
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="flex items-center justify-between rounded-md border border-hairline bg-surface-1/70 px-3 py-2"
        >
          <div className="min-w-0">
            <div className="truncate font-mono text-[11px] text-ink-muted">{r.from}</div>
            <div className="truncate text-[12px] text-ink">{r.subject}</div>
          </div>
          <span
            className={
              r.risk === 'high'
                ? 'rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] text-danger'
                : 'rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success'
            }
          >
            {r.risk === 'high' ? 'phishing' : 'legit'}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
