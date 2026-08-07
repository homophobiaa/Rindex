import type { Scenario } from '@/lib/attack-paths/types';

type IconProps = { className?: string };

/**
 * Icons for the `iconKey` already carried by every scenario. The field
 * existed in the data model but nothing rendered it, so the chooser had no
 * way to differentiate scenarios at a glance.
 *
 * All 1.7 stroke weight, matching the rest of the icon set.
 */
const base = (d: React.ReactNode) => (p: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
    aria-hidden
  >
    {d}
  </svg>
);

export const SCENARIO_ICONS: Record<Scenario['iconKey'], (p: IconProps) => JSX.Element> = {
  lock: base(
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>,
  ),
  mail: base(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>,
  ),
  wifi: base(
    <>
      <path d="M2 8.5a15 15 0 0 1 20 0" />
      <path d="M5.5 12a10 10 0 0 1 13 0" />
      <path d="M9 15.5a5 5 0 0 1 6 0" />
      <path d="M12 19h.01" />
    </>,
  ),
  star: base(<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />),
  gamepad: base(
    <>
      <rect x="2" y="7" width="20" height="11" rx="4" />
      <path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 14h.01" />
    </>,
  ),
  camera: base(
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h2L9 4h6l1.5 2h2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>,
  ),
  store: base(
    <>
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3 9l1.6-4.2A1 1 0 0 1 5.5 4h13a1 1 0 0 1 .9.8L21 9" />
      <path d="M9.5 20v-5h5v5" />
    </>,
  ),
  laptop: base(
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 19h20" />
    </>,
  ),
  phone: base(
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>,
  ),
  shield: base(<path d="M12 3l7 3v5.5c0 4.4-2.9 8.2-7 9.5-4.1-1.3-7-5.1-7-9.5V6z" />),
};
