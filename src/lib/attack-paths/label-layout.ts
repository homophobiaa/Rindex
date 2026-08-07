/**
 * Edge-label anchoring.
 *
 * A label is described relative to its own edge — a fraction `t` along the
 * path plus a perpendicular offset — never as an absolute canvas position.
 * The edge renderer resolves that anchor against its live geometry on every
 * render, so a label follows its connection while nodes are dragged.
 *
 * An earlier version chose absolute graph coordinates here. It placed
 * labels well on load and then left them stranded the moment anything
 * moved, because nothing recomputed them during a drag.
 *
 * This pass only picks *which* anchor to use. It is collision-aware, so it
 * needs current node rectangles, and it is deliberately not run on every
 * pointer move — the caller runs it when the graph settles.
 */
import type { Scenario } from './types';
import { pointAt, routePoints } from './edge-geometry';

/**
 * Nominal card box in graph units. Width is fixed by `AttackNode`; height
 * is only a fallback — cards grow with their content, from ~103px to
 * ~174px — so real rects are passed in wherever they are known.
 */
export const NODE_W = 240;
export const NODE_H = 116;

/**
 * Stage-label row: how far above the topmost card it sits, and how tall it
 * is. Shared with `AttackGraph`, which positions the row.
 */
export const HEADER_GAP = 46;
export const HEADER_H = 20;

/** Label chip metrics, measured from the rendered chips (mono 13px). */
const CHAR_W = 7.8;
const CHIP_PAD_X = 20;
const CHIP_H = 23;

/** Clearance kept between a chip and any card edge. */
const CARD_MARGIN = 6;

/** Candidate anchors, in preference order within each axis. */
const TS = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
const OFFSETS = [0, -26, 26, -38, 38, -52, 52, -68, 68, -86, 86];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where a label sits, expressed relative to its edge. */
export interface LabelAnchor {
  /** Fraction along the edge path, 0..1. */
  t: number;
  /** Perpendicular distance from the path, in graph units. */
  offset: number;
}

export const DEFAULT_ANCHOR: LabelAnchor = { t: 0.5, offset: 0 };

/** Text a labelled edge renders, used to size its chip. */
export function labelText(label: string | undefined, probability: number | undefined): string {
  const pct = typeof probability === 'number' ? ` · ${Math.round(probability * 100)}%` : '';
  return `${label ?? ''}${pct}`;
}

function chipSize(text: string) {
  return { w: text.length * CHAR_W + CHIP_PAD_X, h: CHIP_H };
}

function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Pick an anchor for every labelled edge.
 *
 * `rects` carries the cards' current positions and sizes. Placement is
 * greedy in a fixed order, so a given arrangement always resolves the same
 * way and labels do not shuffle between renders.
 */
export function layoutEdgeLabels(
  scenario: Scenario,
  rects?: Map<string, Rect>,
): Record<string, LabelAnchor> {
  const cards = new Map<string, Rect>();
  scenario.nodes.forEach((n) => {
    const r = rects?.get(n.id);
    cards.set(
      n.id,
      r ?? { x: n.position.x, y: n.position.y, w: NODE_W, h: NODE_H },
    );
  });

  const all = [...cards.values()];
  if (all.length === 0) return {};
  const minY = Math.min(...all.map((c) => c.y));

  // Cards are grown by the clearance margin so chips never crowd an edge.
  // The stage-label row counts too: a chip parked on it hides the very
  // thing that explains the column.
  const blockers: Rect[] = [
    ...all.map((c) => ({
      x: c.x - CARD_MARGIN,
      y: c.y - CARD_MARGIN,
      w: c.w + CARD_MARGIN * 2,
      h: c.h + CARD_MARGIN * 2,
    })),
    ...scenario.phases.map((p) => ({
      x: p.x + 24,
      y: minY - HEADER_GAP - CARD_MARGIN,
      w: p.width,
      h: HEADER_H + CARD_MARGIN * 2,
    })),
  ];

  // Authored labels first — they are always on screen. The bare "NN%" chips
  // only appear on lit edges during a replay, so they yield to whatever is
  // already placed. Left-to-right then by id keeps the pass deterministic.
  const byPosition = (a: { source: string; id: string }, b: { source: string; id: string }) =>
    (cards.get(a.source)?.x ?? 0) - (cards.get(b.source)?.x ?? 0) || a.id.localeCompare(b.id);

  const ordered = [
    ...scenario.edges.filter((e) => e.data?.label).sort(byPosition),
    ...scenario.edges
      .filter((e) => !e.data?.label && typeof e.data?.probability === 'number')
      .sort(byPosition),
  ];

  const placed: Rect[] = [];
  const out: Record<string, LabelAnchor> = {};

  for (const e of ordered) {
    const s = cards.get(e.source);
    const t = cards.get(e.target);
    if (!s || !t) continue;

    const size = chipSize(
      e.data?.label
        ? labelText(e.data.label, e.data.probability)
        : `${Math.round((e.data?.probability ?? 0) * 100)}%`,
    );
    const pts = routePoints(s.x + s.w, s.y + s.h / 2, t.x, t.y + t.h / 2);

    let best: { anchor: LabelAnchor; rect: Rect; cost: number } | null = null;
    for (const tt of TS) {
      const p = pointAt(pts, tt);
      for (const off of OFFSETS) {
        const cx = p.x + p.nx * off;
        const cy = p.y + p.ny * off;
        const rect = { x: cx - size.w / 2, y: cy - size.h / 2, w: size.w, h: size.h };

        let cost = 0;
        for (const b of blockers) cost += overlap(rect, b) * 10;
        for (const q of placed) cost += overlap(rect, q) * 6;
        // Prefer sitting on the line, near the middle of the run.
        cost += Math.abs(off) * 1.4;
        cost += Math.abs(tt - 0.5) * 90;

        if (!best || cost < best.cost) best = { anchor: { t: tt, offset: off }, rect, cost };
      }
    }

    if (best) {
      out[e.id] = best.anchor;
      placed.push(best.rect);
    }
  }

  return out;
}
