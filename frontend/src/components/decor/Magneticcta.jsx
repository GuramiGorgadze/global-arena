import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1];

export function MagneticButton({ href, className, children, strength = 20, onClick, type }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });

  function handleMouseMove(e) {
    if (reduce) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set((relX / rect.width) * strength);
    y.set((relY / rect.height) * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const Tag = href ? motion.a : motion.button;

  return (
    <Tag
      ref={ref}
      href={href}
      type={href ? undefined : type || 'button'}
      onClick={onClick}
      className={className}
      style={reduce ? undefined : { x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </Tag>
  );
}

export function BurstCTA({ href, className, children, strength, onClick }) {
  const reduce = useReducedMotion();
  const [bursts, setBursts] = useState([]);

  function trigger() {
    if (reduce) return;
    const id = Date.now();
    const particles = Array.from({ length: 10 }, (_, i) => ({
      id: `${id}-${i}`,
      angle: (i / 10) * Math.PI * 2,
    }));
    setBursts((prev) => [...prev, { id, particles }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 650);
  }

  return (
    <span
      className="burstCTA"
      onMouseEnter={trigger}
    >
      <MagneticButton
        href={href}
        className={className}
        strength={strength}
        onClick={onClick}
      >
        {children}
      </MagneticButton>
      <AnimatePresence>
        {bursts.flatMap((b) =>
          b.particles.map((p) => (
            <motion.span
              key={p.id}
              className="burstCTA__particle"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos(p.angle) * 48,
                y: Math.sin(p.angle) * 48,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
          ))
        )}
      </AnimatePresence>
    </span>
  );
}
