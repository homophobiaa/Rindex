import { Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useReduceMotion } from '@/lib/reduce-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/password-lab" element={<PasswordLab />} />
            <Route path="/risk-graph" element={<RiskGraph />} />
            <Route path="/crypto-lab" element={<CryptoLab />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <SupportButton />
        <DarkExtensionBanner />
      </div>
    </MotionConfig>
  );
}
