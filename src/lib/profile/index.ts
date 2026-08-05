/**
 * Barrel for the Personal Risk Profiler.
 *
 * Importers should pull from `@/lib/profile` rather than the individual
 * files so every consumer shares one canonical surface.
 */
export * from './questions';
export * from './posture';
export * from './recommendations';
