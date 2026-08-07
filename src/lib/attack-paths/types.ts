/**
 * Attack Path Visualizer — shared types.
 *
 * The data model is deliberately small so new scenarios can be added by
 * editing a single file (`scenarios.ts`).  A scenario is a directed graph of
 * nodes (states / actions / barriers) connected by probabilistic edges.
 *
 * Educational concepts baked in:
 *  - Graph theory (directed graph traversal, weakest path)
 *  - Probability (each edge has a likelihood; chain = product)
 *  - Attack trees (root = goal, leaves = entry points)
 *  - Weakest-link theory (one missing barrier breaks the chain)
 */
import type { Node, Edge } from 'reactflow';

export type NodeKind =
  | 'mistake' // user habit / behaviour the attacker relies on
  | 'vulnerability' // exposed system / data weakness
  | 'attacker' // active attacker action
  | 'barrier' // security control that *can* stop the chain
  | 'compromised' // negative end-state (asset lost)
  | 'recovery'; // mitigation / how to recover or prevent

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type NodeState = 'idle' | 'active' | 'visited';

/** Data carried by every attack-graph node. */
export interface AttackNodeData {
  kind: NodeKind;
  title: string;
  /** One-line description shown inside the node card. */
  short: string;
  /** Long-form explanation rendered in the details panel. */
  detail: string;
  /** "Why this matters" — educational framing. */
  why: string;
  /** Mitigation bullets shown in the details panel. */
  mitigation: string[];
  /** Optional severity badge (drives chip color). */
  severity?: Severity;
  /** Attacker's estimated success at this step (0..1). */
  successProb?: number;
  /** Runtime simulation state. Mutated by the engine. */
  state?: NodeState;
  /** Which phase / lane this node belongs to (drives the lane backdrop). */
  phase?: string;
}

/** Visual + semantic category of an edge. */
export type EdgeVariant =
  | 'main' // the canonical attack path
  | 'alt' // a less-likely branch from the same source
  | 'blocked' // attack path stopped by a barrier (dashed, dimmed)
  | 'impact' // pivot fan-out after the main compromise
  | 'recovery'; // path to the recovery / mitigation node

/** Data on each directed edge between attack-graph nodes. */
export interface AttackEdgeData {
  /** Likelihood this transition occurs given the previous step (0..1). */
  probability: number;
  /** Optional short label rendered on the edge ("if reused", "via OTP", …). */
  label?: string;
  /** Visual + semantic category (defaults to 'main'). */
  variant?: EdgeVariant;
  /** Runtime flag set by the simulation. Not used at authoring time. */
  active?: boolean;
  /**
   * Runtime flag: this is the step the replay just took, i.e. the edge
   * leading into the current node. Drives the leading-pulse treatment.
   */
  current?: boolean;
  /**
   * Where the label sits *relative to this edge* — a fraction along the
   * path plus a perpendicular offset — chosen by `layoutEdgeLabels` so the
   * chip clears the cards. Resolved against live geometry on every render,
   * which is what keeps the label attached while nodes are dragged.
   */
  labelAnchor?: { t: number; offset: number };
}

export type AttackNode = Node<AttackNodeData>;
export type AttackEdge = Edge<AttackEdgeData>;

/** A phase / lane definition used to render the column backdrop. */
export interface ScenarioPhase {
  id: string;
  label: string;
  /** Left-edge x coordinate of the lane in graph-space. */
  x: number;
  /** Lane width in graph-space. */
  width: number;
}

/** User-type tags for scenario recommendation filtering. */
export type ScenarioUserTag =
  | 'creator'
  | 'business'
  | 'gamer'
  | 'student'
  | 'general'
  | 'highExposure';

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** Icon key used by the scenario selector (extend as needed). */
  iconKey:
    | 'lock'
    | 'mail'
    | 'wifi'
    | 'star'
    | 'gamepad'
    | 'camera'
    | 'store'
    | 'laptop'
    | 'phone'
    | 'shield';
  nodes: AttackNode[];
  edges: AttackEdge[];
  /** Ordered list of node ids that form the canonical attack path. */
  path: string[];
  /** Lane definitions for the phase backdrop / column headers. */
  phases: ScenarioPhase[];
  /** Short, scannable attack-stage names (one per canonical step). */
  stageLabels?: string[];

  /* ── Dashboard integration metadata ─────────────────────────── */
  /**
   * v2 factor IDs from `@/lib/risk/factors.ts` that make this scenario
   * particularly relevant for a given user profile.  Used by the
   * Dashboard to surface the most applicable scenario.
   */
  recommendedFor?: string[];
  /** User-type tags for scenario recommendation filtering. */
  userTags?: ScenarioUserTag[];
  /**
   * Short human-readable reason shown in the Dashboard recommendation
   * widget. Should reference the specific factors that triggered it.
   * Example: "Recommended because your profile shows public email + SMS-only 2FA."
   */
  recommendReason?: string;
}

/* ------------------------------------------------------------------ */
/* Visual tokens — one source of truth shared by every kind of node.   */
/* ------------------------------------------------------------------ */

export interface KindMeta {
  label: string;
  /** Primary accent (used for icon, ring, edge highlight). */
  color: string;
  /** Soft tint background. */
  tint: string;
  /** Short noun shown as the kind eyebrow inside the node. */
  badge: string;
  /** Description shown in the legend. */
  description: string;
}

export const KIND_META: Record<NodeKind, KindMeta> = {
  mistake: {
    label: 'User mistake',
    color: '#4cc2ff',
    tint: 'rgba(76, 194, 255, 0.10)',
    badge: 'Mistake',
    description: 'A common human habit that opens the door.',
  },
  vulnerability: {
    label: 'Vulnerability',
    color: '#f79009',
    tint: 'rgba(247, 144, 9, 0.10)',
    badge: 'Vulnerability',
    description: 'An exposed weakness in a system or account.',
  },
  attacker: {
    label: 'Attacker action',
    color: '#f04438',
    tint: 'rgba(240, 68, 56, 0.10)',
    badge: 'Attacker',
    description: 'A concrete step the attacker performs.',
  },
  barrier: {
    label: 'Security barrier',
    color: '#27a644',
    tint: 'rgba(39, 166, 68, 0.10)',
    badge: 'Barrier',
    description: 'A control that would stop the chain — if present.',
  },
  compromised: {
    label: 'Compromised asset',
    color: '#d8341c',
    tint: 'rgba(216, 52, 28, 0.12)',
    badge: 'Compromised',
    description: 'Negative end-state: something is now lost or owned.',
  },
  recovery: {
    label: 'Recovery / fix',
    color: '#5e6ad2',
    tint: 'rgba(94, 106, 210, 0.12)',
    badge: 'Recovery',
    description: 'Action to recover from or prevent this chain.',
  },
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: '#4cc2ff',
  medium: '#f79009',
  high: '#f04438',
  critical: '#d8341c',
};
