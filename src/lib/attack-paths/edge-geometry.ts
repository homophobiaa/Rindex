/**
 * Geometry shared by the edge renderer and the label-placement pass.
 *
 * Both must agree on where a point "at t along the edge" is, otherwise a
 * chosen anchor would land somewhere else once rendered. The renderer feeds
 * it React Flow's live handle coordinates; the placement pass feeds it the
 * same coordinates derived from current node rects.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface PathPoint extends Pt {
  /** Unit normal to the path at this point. */
  nx: number;
  ny: number;
}

/**
 * The polyline React Flow draws for a right→left smooth step: out of the
 * source, across at the midpoint, into the target. The real path rounds the
 * two corners by 18px, which is well under the size of a label chip, so the
 * polyline is an accurate enough model for anchoring.
 */
export function routePoints(sx: number, sy: number, tx: number, ty: number): Pt[] {
  const midX = tx > sx ? (sx + tx) / 2 : sx + 40;
  return [
    { x: sx, y: sy },
    { x: midX, y: sy },
    { x: midX, y: ty },
    { x: tx, y: ty },
  ];
}

/** Point at fraction `t` of the polyline's arc length, plus its normal. */
export function pointAt(pts: Pt[], t: number): PathPoint {
  const segs: { a: Pt; b: Pt; len: number }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    segs.push({ a, b, len: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  const total = segs.reduce((sum, s) => sum + s.len, 0);
  if (total === 0) return { x: pts[0].x, y: pts[0].y, nx: 0, ny: 1 };

  let d = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (d > s.len && i < segs.length - 1) {
      d -= s.len;
      continue;
    }
    const k = s.len ? Math.min(1, d / s.len) : 0;
    const dx = (s.b.x - s.a.x) / (s.len || 1);
    const dy = (s.b.y - s.a.y) / (s.len || 1);
    return {
      x: s.a.x + (s.b.x - s.a.x) * k,
      y: s.a.y + (s.b.y - s.a.y) * k,
      // Left-hand normal: on a left→right run this points down-screen, so a
      // positive offset reads as "below the line".
      nx: -dy,
      ny: dx,
    };
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, nx: 0, ny: 1 };
}
