import { motion } from 'framer-motion';
import type { FactorState } from '@/lib/risk';
import { pillarById, type PillarId } from '@/lib/risk';
import { weakestLinks } from '@/lib/dashboard';

/**
 * Top risk drivers — the biggest open weaknesses, highest-impact first.
 * Each row shows the raw RiskIndex points the weakness contributes and the
 * pillar it lives in.
 */
export function WeakestLinks({ state }: { state: FactorState }) {
  const links = weakestLinks(state, 5);

  if (links.length === 0) {
    return (
      <EmptyRow
        accent="#27a644"
        title="No open weaknesses"
        detail="Every modeled risk factor is in its safe state. Re-check after any new account or device."
      />
    );
  }

  return (
    <div className="space-y-2">
      {links.map((l, i) => {
        const accent = pillarAccent(l.pillar);
        return (
          <motion.article
            key={l.factorId}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex gap-3 overflow-hidden rounded-xl border border-hairline bg-surface-1/50 p-4"
          >
            <span
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="flex shrink-0 flex-col items-center pl-1">
              <span className="font-mono text-[11px] tabular-nums text-ink-tertiary">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-[13.5px] font-medium text-ink">{l.title}</h4>
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-micro font-medium"
                  style={{ background: '#f0443818', color: '#f04438' }}
                >
                  +{l.impact} risk
                </span>
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-ink-subtle">{l.detail}</p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function EmptyRow({
  accent,
  title,
  detail,
}: {
  accent: string;
  title: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-5"
      style={{ borderColor: `${accent}33`, background: `${accent}0d` }}
    >
      <h4 className="text-[13.5px] font-medium text-ink">{title}</h4>
      <p className="mt-0.5 text-[12px] text-ink-subtle">{detail}</p>
    </div>
  );
}

function pillarAccent(pillarId: string): string {
  try {
    return pillarById(pillarId as PillarId).accent;
  } catch {
    return '#5e6ad2';
  }
}
