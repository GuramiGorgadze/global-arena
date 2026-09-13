import { motion } from 'framer-motion';
import AmbientParticles from '../components/decor/AmbientParticles';
import GlobalNetwork from '../components/decor/GlobalNetwork';
import ScrambleText from '../components/decor/ScrambleText';
import { BurstCTA } from '../components/decor/MagneticCTA';

const EASE_OUT = [0.16, 1, 0.3, 1];

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

export default function NotFoundPage() {
  return (
    <section className="notFound">
      <AmbientParticles count={18} />

      <GlobalNetwork />

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
          ეს გვერდი აღარ არსებობს ან საერთოდ არ არსებობდა. გადაამოწმე მისამართი ან უბრალოდ დაბრუნდი
          მთავარ გვერდზე.
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
