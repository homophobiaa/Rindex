/**
 * Barrel for the Personal Risk Profiler.
 *
 * Importers should pull from `@/lib/profile` rather than the individual
 * files so the future Risk Profiler "fix plan" view, comparison view,
 * and shareable summary all use the same canonical surface.
 */
export * from './questions';
export * from './posture';
export * from './recommendations';
