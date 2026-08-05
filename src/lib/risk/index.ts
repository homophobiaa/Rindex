/**
 * Barrel exports for the shared risk scoring system.
 *
 * Used by the assessment, dashboard and Methodology page. Importers
 * should pull from `@/lib/risk` rather than individual files so the
 * surface area stays stable.
 */
export * from './pillars';
export * from './factors';
export * from './scoring';
