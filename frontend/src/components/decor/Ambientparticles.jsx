import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function AmbientParticles({
  count = 16,
  className = '',
  durationRange = [8, 17],
  delayRange = [0, 6],
  sizeRange = [2, 5],
}) {
  const reduce = useReducedMotion();

  const particles = useMemo(() => {
    const [minDur, maxDur] = durationRange;
    const [minDelay, maxDelay] = delayRange;
    const [minSize, maxSize] = sizeRange;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      duration: minDur + Math.random() * (maxDur - minDur),
      delay: minDelay + Math.random() * (maxDelay - minDelay),
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div
      className={`ambientParticles ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="ambientParticles__dot"
          style={{ left: `${p.left}%`, width: p.size, height: p.size }}
          animate={{ y: ['0%', '-140%'], opacity: [0, 0.9, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
