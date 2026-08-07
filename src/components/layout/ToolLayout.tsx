import { Outlet } from 'react-router-dom';

/**
 * Layout for interactive tool routes.
 *
 * The route owns the viewport below the navbar, so there is no content
 * container and — deliberately — no site footer: a marketing footer bolted
 * under a live canvas breaks the "application surface" reading, and every
 * link it carries is still one click away in the navbar.
 *
 * `min-h-0` matters: this is a flex child of the app column, and without it
 * the default `min-height: auto` lets the tool's own height win over the
 * viewport clamp its child sets.
 */
export default function ToolLayout() {
  return (
    <main className="min-h-0 flex-1">
      <Outlet />
    </main>
  );
}
