import { ProfilerFlow } from '@/components/profiler/ProfilerFlow';

/**
 * Personal Risk Profiler page.
 *
 * The assessment runs entirely in the browser. Answers are kept in
 * React state for the duration of the visit and discarded on reload.
 * The same `@/lib/risk` scoring engine powers Methodology and the
 * future fix-plan view, so anything you score here is consistent with
 * the rest of the app.
 */
export default function Assessment() {
  return (
    <main className="relative pb-section">
      {/* Ambient background — same visual language as the rest of RIndex */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.08] [background-size:48px_48px] mask-fade-edges" />
      </div>

      <ProfilerFlow />
    </main>
  );
}
