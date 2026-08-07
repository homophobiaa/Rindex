import { Outlet } from 'react-router-dom';
import Footer from './Footer';

/**
 * Standard content layout: an article-style page followed by the full site
 * footer. Everything except the interactive tool routes uses this.
 */
export default function SiteLayout() {
  return (
    <>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
