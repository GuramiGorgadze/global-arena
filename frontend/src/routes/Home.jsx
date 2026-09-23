import { useEffect, useRef, useState } from 'react';
import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import logo from '../assets/logo.png';
import { getMarathonStatus } from '../api/marathon';
import AmbientParticles from '../components/decor/AmbientParticles';
import GlobalNetwork from '../components/decor/GlobalNetwork';
import ScrambleText from '../components/decor/ScrambleText';
import { BurstCTA } from '../components/decor/MagneticCTA';

const EASE_OUT = [0.16, 1, 0.3, 1];

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
  { target: 3, suffix: '', label: 'დღე' },
  { target: 193, suffix: '', label: 'ქვეყანა' },
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

function GrainOverlay() {
  return (
    <div
      className="grainOverlay"
      aria-hidden="true"
    />
  );
}

function CommitteeTicker() {
  const loopItems = [...COMMITTEES, ...COMMITTEES];

  return (
    <div
      className="ticker"
      aria-hidden="true"
    >
      <div className="ticker__track">
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

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function splitDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

// ---------------------------------------------------------------------------
// Shared shell for the two "take our quiz" teaser cards (marathon +
// committee match). These were two ~100-line blocks of near-identical JSX
// and SCSS differing only in badge label, copy, and what sits in the
// right-hand panel — now it's one component, and each quiz just supplies
// its badge text/copy/panel content/CTA.
// ---------------------------------------------------------------------------
function PromoCard({ badgeText, title, desc, panel, ctaHref, ctaLabel, className = '' }) {
  return (
    <motion.section
      className={`promoCard ${className}`.trim()}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <AmbientParticles
        count={12}
        className="particles--promo"
      />
      <div className="promoCard__inner">
        <div className="promoCard__text">
          <span className="promoCard__badge">
            <span className="promoCard__badgeDot" /> {badgeText}
          </span>
          <h2 className="promoCard__title">{title}</h2>
          <p className="promoCard__desc">{desc}</p>
        </div>

        <div className="promoCard__panel">
          {panel}
          <BurstCTA
            href={ctaHref}
            className="submitBtn"
            strength={16}
          >
            {ctaLabel} <i className="bi bi-arrow-right" />
          </BurstCTA>
        </div>
      </div>
    </motion.section>
  );
}

function MarathonPromo() {
  const panel = (
    <span className="promoCard__live">
      <span className="promoCard__liveDot" /> ღიაა ნებისმიერ დროს
    </span>
  );

  return (
    <PromoCard
      className="promoCard--first"
      badgeText="მარათონი"
      title={
        <>
          შეამოწმე შენი <em>ცოდნა</em>
        </>
      }
      desc="15 კითხვა, 5 წუთი - ვნახოთ, თუ რამდენად კარგად ერკვევი საერთაშორისო ურთიერთობებსა და გაეროს თემატიკაში"
      panel={panel}
      ctaHref="/marathon"
      ctaLabel="დაიწყე ახლავე"
    />
  );
}

function CommitteeMatchPromo() {
  const panel = (
    <div
      className="promoCard__icons"
      aria-hidden="true"
    >
      {COMMITTEES.map((c) => (
        <span
          className="promoCard__iconChip"
          key={c.id}
        >
          <i className={`bi ${c.icon}`} />
        </span>
      ))}
    </div>
  );

  return (
    <PromoCard
      badgeText="ტესტი"
      title={
        <>
          იპოვე შენი <em>კომიტეტი</em>
        </>
      }
      desc="10 მოკლე კითხვა - გაარკვიე, რომელი კომიტეტი შეგეფერება შენ ყველაზე მეტად"
      panel={panel}
      ctaHref="/committee-match"
      ctaLabel="ტესტის დაწყება"
    />
  );
}

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="home">
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
          <MarathonPromo />
          <CommitteeMatchPromo />
          <Info />
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
      <AmbientParticles
        count={22}
        className="particles--hero"
      />

      <motion.div
        className="hero__mesh"
        style={{ x: meshX, y: meshY }}
        aria-hidden="true"
      />

      <GlobalNetwork />

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
            <ScrambleText
              text="ხმა"
              triggerOnView
            />
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
          <a
            href="#committees"
            className="btn btn--ghost"
          >
            კომიტეტების ნახვა
          </a>
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

function Info() {
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
      className="info"
      id="info"
      ref={sectionRef}
    >
      <motion.div
        className="info__emblem"
        ref={emblemRef}
        onMouseMove={handleEmblemMove}
        onMouseLeave={handleEmblemLeave}
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        style={{ perspective: 900 }}
      >
        <div className="info__emblemGlow" />
        <motion.div
          className="info__emblemParallax"
          style={{ y: emblemY, rotateX: emblemRotateX, rotateY: emblemRotateY }}
        >
          <img
            src={logo}
            alt=""
            aria-hidden="true"
          />
        </motion.div>
      </motion.div>
      <motion.div
        className="info__content"
        initial={{ opacity: 0, x: 36 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
      >
        <div className="formDivider">
          <span>ჩვენ შესახებ</span>
        </div>
        <h2 className="info__title">რა არის გაეროს მოდელირება?</h2>
        <p className="info__text">
          გაეროს მოდელირება (MUN) არის საგანმანათლებლო სიმულაცია, სადაც მონაწილეები სხვადასხვა
          ქვეყნის დელეგატების როლს ირგებენ, განიხილავენ საერთაშორისო საკითხებს, მონაწილეობენ
          დებატებში, აწარმოებენ მოლაპარაკებებს და ამზადებენ რეზოლუციებს გენერაულ ანსამბლეაზე
          წარსადგენად.
        </p>
        <motion.div
          className="info__features"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.div
            className="info__feature"
            variants={fadeUpItem}
          >
            <i className="bi bi-mic" />
            <div>
              <p className="info__featureTitle">საჯარო გამოსვლა</p>
              <p className="info__featureText">
                დაიცავი ქვეყნის პოზიცია ყველას წინაშე დამაჯერებლად.
              </p>
            </div>
          </motion.div>
          <motion.div
            className="info__feature"
            variants={fadeUpItem}
          >
            <i className="bi bi-diagram-3" />
            <div>
              <p className="info__featureTitle">მოლაპარაკება</p>
              <p className="info__featureText">
                ითანამშრომლე სხვა დელეგატებთან და იპოვე საერთო ენა.
              </p>
            </div>
          </motion.div>
          <motion.div
            className="info__feature"
            variants={fadeUpItem}
          >
            <i className="bi bi-globe" />
            <div>
              <p className="info__featureTitle">გლობალური აზროვნება</p>
              <p className="info__featureText">გაეცანი თანამედროვე მსოფლიოს აქტუალურ პრობლემებს.</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function CommitteeCard({ committee, index }) {
  const ref = useRef(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), {
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
      className="committeeCard"
      style={{ rotateX, rotateY, '--mx': spotlightX, '--my': spotlightY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE_OUT }}
    >
      <span
        className="committeeCard__sheen"
        aria-hidden="true"
      />
      <div className="committeeCard__top">
        <span className="committeeCard__icon">
          <i className={`bi ${committee.icon}`} />
        </span>
        {committee.tag && <span className="committeeCard__tag">{committee.tag}</span>}
      </div>
      <p className="committeeCard__abbr">{committee.name}</p>
      <p className="committeeCard__full">{committee.fullName}</p>
      <p className="committeeCard__desc">{committee.desc}</p>
    </motion.div>
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
          <CommitteeCard
            key={c.id}
            committee={c}
            index={i}
          />
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
      <AmbientParticles
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
