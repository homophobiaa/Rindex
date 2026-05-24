import { Hero } from '@/components/home/Hero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { LiveMetrics } from '@/components/home/LiveMetrics';
import { EntropyPreview } from '@/components/home/EntropyPreview';
import { CTASection } from '@/components/home/CTASection';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <FeatureGrid />
      <LiveMetrics />
      <EntropyPreview />
      <CTASection />
    </>
  );
}
