import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import logo from '../assets/logo.png';

const EASE_OUT = [0.16, 1, 0.3, 1];
const GEORGIAN_GLYPHS = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';

const COMMITTEES = [
  {
    id: 'unsc',
    name: 'UNSC',
    fullName: 'უშიშროების საბჭო',
    icon: 'bi-shield-lock',
    desc: 'საერთაშორისო მშვიდობისა და უსაფრთხოების საკითხები, კონფლიქტები და კრიზისები.',
  },
  {
    id: 'specpol',
    name: 'SPECPOL',
    fullName: 'სპეციალური პოლიტიკური კომიტეტი',
    icon: 'bi-flag',
    desc: 'ტერიტორიული დავები, დეკოლონიზაცია და სხვა გლობალური პოლიტიკური საკითხები.',
  },
  {
    id: 'unhrc',
    name: 'UNHRC',
    fullName: 'ადამიანის უფლებათა საბჭო',
    icon: 'bi-people',
    desc: 'ადამიანის ფუნდამენტური უფლებების დაცვა და ჰუმანიტარული პრობლემები.',
  },
  {
    id: 'hcc',
    name: 'HCC',
    fullName: 'ისტორიული კრიზისის კომიტეტი',
    icon: 'bi-hourglass-split',
    desc: 'ისტორიული მოვლენების სიმულაცია, სადაც დელეგატები ისტორიული პირების როლს ირგებენ.',
  },
  {
    id: 'disec',
    name: 'DISEC',
    fullName: 'განიარაღებისა და საერთაშორისო უსაფრთხოების კომიტეტი',
    icon: 'bi-radioactive',
    desc: 'ინგლისურენოვანი კომიტეტი, ფოკუსირებული გლობალურ განიარაღებაზე.',
    tag: 'ENG',
  },
  {
    id: 'presscorps',
    name: 'Press Corps',
    fullName: 'პრესის კორპუსი',
    icon: 'bi-camera-reels',
    desc: 'მედია, კონფერენციის გაშუქება, ინტერვიუები და სტატიები.',
  },
];

const STATS = [
  { target: 6, suffix: '', label: 'კომიტეტი' },
  { target: 100, suffix: '%', label: 'დიპლომატია' },
  { target: 3, suffix: '', label: 'დღე' },
  { target: 193, suffix: '', label: 'ქვეყანა' },
];

const SCHEDULE = [
  {
    day: 'I',
    title: 'გახსნა',
    time: '10:00 – 19:00',
    items: ['რეგისტრაცია და აკრედიტაცია', 'გახსნის ცერემონია', 'კომიტეტების პირველი სხდომა'],
  },
  {
    day: 'II',
    title: 'კრიზისი',
    time: '09:00 – 20:00',
    items: [
      'სრულდღიანი კომიტეტის სხდომები',
      'კრიზისის განახლებები',
      'სამუშაო დოკუმენტების მომზადება',
    ],
  },
  {
    day: 'III',
    title: 'დახურვა',
    time: '09:00 – 18:00',
    items: ['საბოლოო რეზოლუციების კენჭისყრა', 'დახურვის ცერემონია', 'დაჯილდოება'],
  },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

function useCountUp(target, active, duration = 1.4) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    const controls = animate(0, target, {
      duration,
      ease: EASE_OUT,
      onUpdate: (latest) => setValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [active, target, duration]);

  return value;
}

function FloatingParticles({ count = 18, className = '' }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 7 + Math.random() * 9,
        delay: Math.random() * 6,
      })),
    [count]
  );

  return (
    <div
      className={`particles ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="particles__dot"
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

function CursorAura() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const springX = useSpring(x, { stiffness: 120, damping: 26, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 120, damping: 26, mass: 0.6 });

  useEffect(() => {
    if (reduce) return undefined;

    function handleMove(e) {
      x.set(e.clientX);
      y.set(e.clientY);
    }

    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, [reduce, x, y]);

  if (reduce) return null;

  return (
    <motion.div
      className="cursorAura"
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    />
  );
}

function GrainOverlay() {
  return (
    <div
      className="grainOverlay"
      aria-hidden="true"
    />
  );
}

function ScrambleText({ text, className, duration = 900 }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    if (!inView) return undefined;
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
  }, [inView, reduce, text, duration]);

  return (
    <span
      className={className}
      ref={ref}
    >
      {display}
    </span>
  );
}

function MagneticButton({ href, className, children, strength = 22 }) {
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

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.a>
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

function DirectionalHoverButton({ href, className, children }) {
  const [origin, setOrigin] = useState('left');

  function handleEnter(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    setOrigin(relX < rect.width / 2 ? 'left' : 'right');
  }

  return (
    <motion.a
      href={href}
      className={`${className} dirBtn dirBtn--${origin}`}
      onMouseEnter={handleEnter}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      <span
        className="dirBtn__fill"
        aria-hidden="true"
      />
      <span className="dirBtn__label">{children}</span>
    </motion.a>
  );
}

function TiltCard({ children, className, index = 0 }) {
  const ref = useRef(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [9, -9]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), {
    stiffness: 220,
    damping: 22,
  });
  const spotlightX = useSpring(useTransform(px, [-0.5, 0.5], ['15%', '85%']), {
    stiffness: 200,
    damping: 26,
  });
  const spotlightY = useSpring(useTransform(py, [-0.5, 0.5], ['15%', '85%']), {
    stiffness: 200,
    damping: 26,
  });

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX,
        rotateY,
        '--mx': spotlightX,
        '--my': spotlightY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 210,
    damping: 34,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="scrollProgress"
      style={{ scaleX }}
    />
  );
}

function CommitteeTicker() {
  const reduce = useReducedMotion();
  const loopItems = useMemo(() => [...COMMITTEES, ...COMMITTEES], []);

  return (
    <div
      className="ticker"
      aria-hidden="true"
    >
      <div className={`ticker__track ${reduce ? 'ticker__track--paused' : ''}`}>
        {loopItems.map((c, i) => (
          <span
            className="ticker__item"
            key={`${c.id}-${i}`}
          >
            {c.name}
            <i className="bi bi-asterisk ticker__sep" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="home">
        <ScrollProgress />
        <CursorAura />
        <GrainOverlay />
        <Hero />
        <div className="pageBody">
          <div
            className="pageBody__pattern"
            aria-hidden="true"
          />
          <div
            className="pageBody__glow pageBody__glow--one"
            aria-hidden="true"
          />
          <div
            className="pageBody__glow pageBody__glow--two"
            aria-hidden="true"
          />
          <Stats />
          <CommitteeTicker />
          <About />
          <Committees />
          <CtaBanner />
        </div>
      </div>
    </MotionConfig>
  );
}

function Hero() {
  const heroRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const ringsX = useSpring(useTransform(mouseX, [-1, 1], [-18, 18]), {
    stiffness: 60,
    damping: 20,
  });
  const ringsY = useSpring(useTransform(mouseY, [-1, 1], [-18, 18]), {
    stiffness: 60,
    damping: 20,
  });
  const meshX = useSpring(useTransform(mouseX, [-1, 1], [16, -16]), {
    stiffness: 50,
    damping: 22,
  });
  const meshY = useSpring(useTransform(mouseY, [-1, 1], [16, -16]), {
    stiffness: 50,
    damping: 22,
  });

  function handleMouseMove(e) {
    const rect = heroRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      className="hero"
      id="top"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <FloatingParticles
        count={22}
        className="particles--hero"
      />

      <motion.div
        className="hero__mesh"
        style={{ x: meshX, y: meshY }}
        aria-hidden="true"
      />

      <motion.div
        className="hero__rings"
        style={{ x: ringsX, y: ringsY }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 600 600"
          className="hero__ringsSvg"
        >
          <g className="hero__ringsOuter">
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
          <g className="hero__ringsInner">
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
        </svg>
      </motion.div>

      <motion.div
        className="hero__content"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.span
          className="hero__badge"
          variants={fadeUpItem}
        >
          GAMUN 2026 · I სესია
        </motion.span>
        <motion.h1
          className="hero__title"
          variants={fadeUpItem}
        >
          გახდი{' '}
          <em className="hero__titleShine">
            <ScrambleText text="ხმა" />
          </em>
          , რომელსაც მსოფლიო უსმენს
        </motion.h1>
        <motion.p
          className="hero__subtitle"
          variants={fadeUpItem}
        >
          სამდღიანი გაეროს მოდელირების კონფერენცია, სადაც მონაწილეები განიხილავენ საერთაშორისო
          საკითხებს.
        </motion.p>
        <motion.div
          className="hero__cta"
          variants={fadeUpItem}
        >
          <BurstCTA
            href="https://applications.g-arena.org"
            className="submitBtn"
          >
            დარეგისტრირდი <i className="bi bi-arrow-right" />
          </BurstCTA>
          <DirectionalHoverButton
            href="#committees"
            className="btn btn--ghost"
          >
            კომიტეტების ნახვა
          </DirectionalHoverButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Stats() {
  return (
    <section className="statsBar">
      {STATS.map((s, i) => (
        <StatItem
          key={s.label}
          stat={s}
          index={i}
        />
      ))}
    </section>
  );
}

function StatItem({ stat, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const value = useCountUp(stat.target, inView);

  return (
    <motion.div
      className="statsBar__item"
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.09, ease: EASE_OUT }}
    >
      <span className="statsBar__value">
        {value}
        {stat.suffix}
      </span>
      <span className="statsBar__label">{stat.label}</span>
    </motion.div>
  );
}

function About() {
  const sectionRef = useRef(null);
  const emblemRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const emblemY = useTransform(scrollYProgress, [0, 1], [36, -36]);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const emblemRotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [12, -12]), {
    stiffness: 160,
    damping: 20,
  });
  const emblemRotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 160,
    damping: 20,
  });

  function handleEmblemMove(e) {
    const rect = emblemRef.current.getBoundingClientRect();
    tiltX.set((e.clientX - rect.left) / rect.width - 0.5);
    tiltY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleEmblemLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <section
      className="about"
      id="about"
      ref={sectionRef}
    >
      <motion.div
        className="about__emblem"
        ref={emblemRef}
        onMouseMove={handleEmblemMove}
        onMouseLeave={handleEmblemLeave}
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        style={{ perspective: 900 }}
      >
        <div className="about__emblemGlow" />
        <motion.div
          className="about__emblemParallax"
          style={{ y: emblemY, rotateX: emblemRotateX, rotateY: emblemRotateY }}
        >
          <motion.img
            src={logo}
            alt=""
            aria-hidden="true"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
      <motion.div
        className="about__content"
        initial={{ opacity: 0, x: 36 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
      >
        <div className="formDivider">
          <span>ჩვენ შესახებ</span>
        </div>
        <h2 className="about__title">რა არის გაეროს მოდელირება?</h2>
        <p className="about__text">
          გაეროს მოდელირება (MUN) არის საგანმანათლებლო სიმულაცია, სადაც მონაწილეები სხვადასხვა
          ქვეყნის დელეგატების როლს ირგებენ, განიხილავენ საერთაშორისო საკითხებს, მონაწილეობენ
          დებატებში, აწარმოებენ მოლაპარაკებებს და ამზადებენ რეზოლუციებს გენერაულ ანსამბლეაზე
          წარსადგენად.
        </p>
        <motion.div
          className="about__features"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.div
            className="about__feature"
            variants={fadeUpItem}
            whileHover={{ x: 4 }}
          >
            <i className="bi bi-mic" />
            <div>
              <p className="about__featureTitle">საჯარო გამოსვლა</p>
              <p className="about__featureText">
                დაიცავი ქვეყნის პოზიცია ყველას წინაშე დამაჯერებლად.
              </p>
            </div>
          </motion.div>
          <motion.div
            className="about__feature"
            variants={fadeUpItem}
            whileHover={{ x: 4 }}
          >
            <i className="bi bi-diagram-3" />
            <div>
              <p className="about__featureTitle">მოლაპარაკება</p>
              <p className="about__featureText">
                ითანამშრომლე სხვა დელეგატებთან და იპოვე საერთო ენა.
              </p>
            </div>
          </motion.div>
          <motion.div
            className="about__feature"
            variants={fadeUpItem}
            whileHover={{ x: 4 }}
          >
            <i className="bi bi-globe" />
            <div>
              <p className="about__featureTitle">გლობალური აზროვნება</p>
              <p className="about__featureText">
                გაეცანი თანამედროვე მსოფლიოს აქტუალურ პრობლემებს.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Committees() {
  return (
    <section
      className="committees"
      id="committees"
    >
      <div className="sectionHeader">
        <h2>
          ჩვენი <em>კომიტეტები</em>
        </h2>
        <p>აირჩიე შენთვის საინტერესო კომიტეტი და იმუშავე მის დღის წესრიგში არსებულ საკითხებზე.</p>
      </div>

      <div className="committees__grid">
        {COMMITTEES.map((c, i) => (
          <TiltCard
            className="committeeCard"
            key={c.id}
            index={i}
          >
            <div className="committeeCard__top">
              <span className="committeeCard__icon">
                <i className={`bi ${c.icon}`} />
              </span>
              {c.tag && <span className="committeeCard__tag">{c.tag}</span>}
            </div>
            <p className="committeeCard__abbr">{c.name}</p>
            <p className="committeeCard__full">{c.fullName}</p>
            <p className="committeeCard__desc">{c.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <motion.section
      className="ctaBanner"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <FloatingParticles
        count={14}
        className="particles--cta"
      />
      <h2>
        მზად ხარ გახდე <em>დელეგატი</em>?
      </h2>
      <p>დაიკავე შენი ადგილი მოლაპარაკებების მაგიდასთან</p>
      <BurstCTA
        href="https://applications.g-arena.org"
        className="submitBtn"
        strength={16}
      >
        დარეგისტრირდი <i className="bi bi-arrow-right" />
      </BurstCTA>
    </motion.section>
  );
}
