import { Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useReduceMotion } from '@/lib/reduce-motion';
import Navbar from '@/components/layout/Navbar';
import SiteLayout from '@/components/layout/SiteLayout';
import ToolLayout from '@/components/layout/ToolLayout';
import { SupportButton } from '@/components/layout/SupportButton';
import { DarkExtensionBanner } from '@/components/layout/DarkExtensionBanner';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Assessment from '@/pages/Assessment';
import PasswordLab from '@/pages/PasswordLab';
import RiskGraph from '@/pages/RiskGraph';
import CryptoLab from '@/pages/CryptoLab';
import Methodology from '@/pages/Methodology';
import NotFound from '@/pages/NotFound';
import ScrollToTop from '@/components/layout/ScrollToTop';

export default function App() {
  const reduceMotion = useReduceMotion();

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
      <div className="relative flex min-h-screen flex-col bg-canvas text-ink">
        <ScrollToTop />
        <Navbar />
        <Routes>
          {/* Content pages — narrow container + site footer. */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/password-lab" element={<PasswordLab />} />
            <Route path="/crypto-lab" element={<CryptoLab />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Interactive tools — own the viewport, no footer. */}
          <Route element={<ToolLayout />}>
            <Route path="/risk-graph" element={<RiskGraph />} />
          </Route>
        </Routes>
        <SupportButton />
        <DarkExtensionBanner />
      </div>
    </MotionConfig>
  );
}
