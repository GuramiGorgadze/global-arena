import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1];
const GEORGIAN_GLYPHS = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';

const QUICK_LINKS = [
  { href: '/#committees', label: 'კომიტეტები', icon: 'bi-people' },
  { href: '/#info', label: 'ინფორმაცია', icon: 'bi-info-circle' },
  { href: 'https://applications.g-arena.org', label: 'რეგისტრაცია', icon: 'bi-pencil-square' },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

function FloatingParticles({ count = 16 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 8 + Math.random() * 9,
        delay: Math.random() * 6,
      })),
    [count]
  );

  return (
    <div
      className="notFoundParticles"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="notFoundParticles__dot"
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

function ScrambleText({ text, className, duration = 900 }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduce) {
      setDisplay(text);
      return undefined;
    }

    const length = text.length;
    const totalFrames = Math.max(12, Math.round(duration / 40));
    let frame = 0;

    const interval = setInterval(() => {
      frame += 1;
      const revealCount = Math.floor((frame / totalFrames) * length);
      const next = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealCount) return ch;
          return GEORGIAN_GLYPHS[Math.floor(Math.random() * GEORGIAN_GLYPHS.length)];
        })
        .join('');

      setDisplay(next);

      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [reduce, text, duration]);

  return <span className={className}>{display}</span>;
}

function MagneticButton({ href, className, children, strength = 20, onClick, type }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });

  function handleMouseMove(e) {
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
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </Tag>
  );
}

function BurstCTA({ href, className, children, strength }) {
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
      >
        {children}
      </MagneticButton>
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
            transition={{ duration: 0.6, ease: EASE_OUT }}
          />
        ))
      )}
    </span>
  );
}

export default function NotFoundPage() {
  const sceneRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const ringsX = useSpring(useTransform(mouseX, [-1, 1], [-16, 16]), {
    stiffness: 60,
    damping: 20,
  });
  const ringsY = useSpring(useTransform(mouseY, [-1, 1], [-16, 16]), {
    stiffness: 60,
    damping: 20,
  });
  const needleRotate = useSpring(useTransform(mouseX, [-1, 1], [-14, 14]), {
    stiffness: 90,
    damping: 14,
  });

  function handleMouseMove(e) {
    const rect = sceneRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      className="notFound"
      ref={sceneRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <FloatingParticles count={18} />

      <motion.div
        className="notFound__rings"
        style={{ x: ringsX, y: ringsY }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 600 600"
          className="notFound__ringsSvg"
        >
          <g className="notFound__ringsOuter">
            <circle
              cx="300"
              cy="300"
              r="280"
            />
            <circle
              cx="300"
              cy="300"
              r="200"
            />
          </g>
          <g className="notFound__ringsInner">
            <circle
              cx="300"
              cy="300"
              r="120"
            />
            <line
              x1="40"
              y1="300"
              x2="560"
              y2="300"
            />
            <line
              x1="300"
              y1="40"
              x2="300"
              y2="560"
            />
          </g>
          <motion.g
            className="notFound__needle"
            style={{ rotate: needleRotate }}
          >
            <line
              x1="300"
              y1="300"
              x2="300"
              y2="170"
            />
            <circle
              cx="300"
              cy="300"
              r="7"
            />
          </motion.g>
        </svg>
      </motion.div>

      <motion.div
        className="notFound__content"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.span
          className="notFound__badge"
          variants={fadeUpItem}
        >
          <i
            className="bi bi-compass"
            aria-hidden="true"
          />{' '}
          არასწორი გვერდი
        </motion.span>

        <motion.p
          className="notFound__digits"
          variants={fadeUpItem}
          aria-hidden="true"
        >
          404
        </motion.p>

        <motion.h1
          className="notFound__title"
          variants={fadeUpItem}
        >
          <ScrambleText text="გვერდი ვერ მოიძებნა" />
        </motion.h1>

        <motion.p
          className="notFound__desc"
          variants={fadeUpItem}
        >
          ეს გვერდი აღარ არსებობს ან საერთოდ არ არსებობდა. გადაამოწმე მისამართი ან უბრალოდ
          დაბრუნდი მთავარ გვერდზე.
        </motion.p>

        <motion.div
          className="notFound__actions"
          variants={fadeUpItem}
        >
          <BurstCTA
            href="/"
            className="submitBtn"
            strength={16}
          >
            მთავარ გვერდზე დაბრუნება <i className="bi bi-arrow-right" />
          </BurstCTA>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left" /> უკან დაბრუნება
          </button>
        </motion.div>

        <motion.nav
          className="notFound__links"
          aria-label="სწრაფი ნავიგაცია"
          variants={fadeUpItem}
        >
          {QUICK_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="notFound__link"
            >
              <i
                className={`bi ${l.icon}`}
                aria-hidden="true"
              />
              {l.label}
            </a>
          ))}
        </motion.nav>
      </motion.div>
    </section>
  );
}
