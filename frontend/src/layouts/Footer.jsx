import { motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import GlobalNetwork from '../components/decor/GlobalNetwork';

const EASE = [0.16, 1, 0.3, 1];
const REGISTER_URL = 'https://applications.g-arena.org';
const APPLICATIONS_HOST = 'applications.g-arena.org';

const SECTION_LINKS = [
  { id: 'info', label: 'ინფორმაცია' },
  { id: 'committees', label: 'კომიტეტები' },
];

const EXPLORE_LINKS = [
  { to: '/marathon', label: 'მარათონი' },
  { to: '/committee-match', label: 'იპოვე შენი კომიტეტი' },
];

const SOCIALS = [
  {
    href: 'https://www.facebook.com/people/G-Arena-%E1%83%AF%E1%83%98-%E1%83%90%E1%83%A0%E1%83%94%E1%83%9C%E1%83%90/61592075967871/',
    icon: 'bi-facebook',
    label: 'Facebook',
  },
  {
    href: 'https://www.instagram.com/globalarena.mun/',
    icon: 'bi-instagram',
    label: 'Instagram',
  },
  {
    href: 'https://www.tiktok.com/@g_arenamun?_r=1&_t=ZS-97wupUsEXyB',
    icon: 'bi-tiktok',
    label: 'TikTok',
  },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function Footer() {
  const location = useLocation();
  const reduce = useReducedMotion();

  const isApplicationsSite =
    typeof window !== 'undefined' && window.location.hostname === APPLICATIONS_HOST;
  const isHome = !isApplicationsSite && location.pathname === '/';

  const getSectionHref = (id) => {
    if (isApplicationsSite) return `https://g-arena.org/#${id}`;
    return isHome ? `#${id}` : `/#${id}`;
  };

  const goToSection = (id) => (e) => {
    if (!isHome) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };

  const containerMotionProps = reduce
    ? {}
    : {
        variants: staggerContainer,
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, amount: 0.15 },
      };

  const itemMotionProps = reduce ? {} : { variants: fadeUpItem };

  return (
    <footer className="footer">
      <GlobalNetwork
        className="footer__network"
        showPulses={false}
        size={480}
      />

      <motion.div
        className="footer__inner"
        {...containerMotionProps}
      >
        <div className="footer__grid">
          <motion.div
            className="footer__col footer__col--brand"
            {...itemMotionProps}
          >
            <Link
              to="/"
              className="footer__brand"
            >
              <span className="footer__logo">
                <img
                  src={logo}
                  alt="G-ARENA"
                />
              </span>
              <span className="footer__wrapper">
                <span className="footer__wordmark">GLOBAL ARENA</span>
                <span className="footer__tagline">NATIONAL SUMMIT 2026</span>
              </span>
            </Link>

            <div className="footer__socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="footer__social"
                >
                  <i
                    className={`bi ${s.icon}`}
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="footer__col"
            {...itemMotionProps}
          >
            <p className="footer__colTitle">ნავიგაცია</p>
            <nav
              className="footer__links"
              aria-label="ნავიგაცია"
            >
              {SECTION_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={getSectionHref(link.id)}
                  className="footer__link"
                  onClick={goToSection(link.id)}
                >
                  <i
                    className="bi bi-chevron-right footer__linkIcon"
                    aria-hidden="true"
                  />
                  {link.label}
                </a>
              ))}
              {EXPLORE_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="footer__link"
                >
                  <i
                    className="bi bi-chevron-right footer__linkIcon"
                    aria-hidden="true"
                  />
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          <motion.div
            className="footer__col"
            {...itemMotionProps}
          >
            <p className="footer__colTitle">კონტაქტი</p>
            <div className="footer__links">
              <a
                href="mailto:globalarena.mun@gmail.com"
                className="footer__link"
              >
                <i
                  className="bi bi-envelope footer__linkIcon"
                  aria-hidden="true"
                />
                globalarena.mun@gmail.com
              </a>
              <a
                href="tel:+995500051095"
                className="footer__link"
              >
                <i
                  className="bi bi-telephone footer__linkIcon"
                  aria-hidden="true"
                />
                +995 500 05 10 95
              </a>
            </div>
          </motion.div>

          <motion.div
            className="footer__col footer__col--cta"
            {...itemMotionProps}
          >
            <p className="footer__colTitle">გახდი დელეგატი</p>
            <p className="footer__ctaText">დაიკავე შენი ადგილი მოლაპარაკებების მაგიდასთან.</p>
            <a
              href={REGISTER_URL}
              className="footer__ctaBtn"
              rel="noreferrer"
            >
              დარეგისტრირდი
              <i
                className="bi bi-arrow-right"
                aria-hidden="true"
              />
            </a>
          </motion.div>
        </div>

        <motion.div
          className="footer__bottom"
          {...itemMotionProps}
        >
          <p className="footer__copyright">© 2026 G-ARENA. ყველა უფლება დაცულია.</p>
        </motion.div>
      </motion.div>
    </footer>
  );
}

export default Footer;
