/**
 * Barrel exports for the shared risk scoring system.
 *
 * Used by the Methodology page today and by the upcoming Personal
 * Risk Profiler. Importers should pull from `@/lib/risk` rather than
 * individual files so the surface area stays stable.
 */
export * from './pillars';
export * from './factors';
export * from './scoring';
