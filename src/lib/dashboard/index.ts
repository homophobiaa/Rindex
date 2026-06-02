/**
 * Barrel for the Unified Risk Dashboard derivation layer.
 *
 * Everything here is pure and reads from the shared `@/lib/risk`
 * FactorState. Components should import from `@/lib/dashboard`.
 */
export * from './insights';
export * from './attack-map';
export * from './sample';
