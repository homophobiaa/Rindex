import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Soft lavender aurora glow used behind hero sections.
 * Subtle, slow, never distracting.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      <motion.div
        className="absolute left-1/2 top-[-20%] h-[700px] w-[900px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(94,106,210,0.22), rgba(94,106,210,0.06) 50%, transparent 75%)',
          filter: 'blur(20px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute left-[10%] top-[40%] h-[460px] w-[460px] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(130,143,255,0.18), transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[5%] top-[20%] h-[420px] w-[420px] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(76,194,255,0.10), transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{ x: [0, -40, 0], y: [0, 25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
