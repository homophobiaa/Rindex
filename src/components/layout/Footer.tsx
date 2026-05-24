import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const cols: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Assessment', to: '/assessment' },
      { label: 'Password Lab', to: '/password-lab' },
      { label: 'Risk Graph', to: '/risk-graph' },
      { label: 'Methodology', to: '/methodology' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Entropy & Cryptography', to: '/methodology#entropy' },
      { label: 'Attack Graphs', to: '/methodology#graphs' },
      { label: 'State Machines', to: '/methodology#automata' },
      { label: 'Privacy Model', to: '/methodology#privacy' },
    ],
  },
  {
    title: 'Open Source',
    links: [
      { label: 'GitHub', to: 'https://github.com/homophobiaa/Rindex', external: true },
      { label: 'License', to: 'https://github.com/homophobiaa/Rindex/blob/main/LICENSE', external: true },
      { label: 'Changelog', to: '/methodology#changelog' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-section border-t border-hairline bg-canvas">
      <div className="container-rindex grid grid-cols-2 gap-10 py-16 md:grid-cols-12">
        <div className="col-span-2 md:col-span-5">
          <Logo size={26} />
          <p className="mt-4 max-w-sm text-body-sm text-ink-subtle">
            RIndex is a frontend-only cybersecurity risk analyzer. It runs entirely in your
            browser — no passwords, answers, or results ever leave your device.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-caption text-ink-tertiary">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Local-only processing
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Works offline
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Open source
            </span>
          </div>
        </div>

        {cols.map((col) => (
          <div key={col.title} className="md:col-span-2">
            <h4 className="mb-3 text-eyebrow uppercase text-ink-subtle">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.to}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-body-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      to={l.to}
                      className="text-body-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-hairline">
        <div className="container-rindex flex flex-col items-start justify-between gap-3 py-6 text-caption text-ink-tertiary md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} RIndex. Educational project.</span>
          <span className="font-mono">
            no telemetry · no cookies · no analytics
          </span>
        </div>
      </div>
    </footer>
  );
}
