import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../assets/logo.png';

const REGISTER_URL = 'https://applications.g-arena.org';
const MAIN_SITE_URL = 'https://g-arena.org';
const APPLICATIONS_HOST = 'applications.g-arena.org';

const SECTION_LINKS = [
  { id: 'about', label: 'ჩვენ შესახებ' },
  { id: 'committees', label: 'კომიტეტები' },
];

const NAV_HEIGHT_TOP = 84;
const NAV_HEIGHT_SCROLLED = 64;
const SCROLL_OFFSET = 76;
const EASE = [0.16, 1, 0.3, 1];

const menuContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
};

const menuItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function Navbar() {
  const location = useLocation();
  const isApplicationsSite =
    typeof window !== 'undefined' && window.location.hostname === APPLICATIONS_HOST;
  const isHome = !isApplicationsSite && location.pathname === '/';
  const reduceMotion = useReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const mobilePanelRef = useRef(null);

  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, 90], [NAV_HEIGHT_TOP, NAV_HEIGHT_SCROLLED]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setActiveId('');
      return undefined;
    }

    const sections = SECTION_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onPointerDown = (e) => {
      const panel = mobilePanelRef.current;
      const burger = menuButtonRef.current;
      if (panel?.contains(e.target) || burger?.contains(e.target)) return;
      setMobileOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [mobileOpen]);

  const goToSection = (id) => (e) => {
    if (!isHome) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    setMobileOpen(false);
  };

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        style={{ height: reduceMotion ? undefined : navHeight }}
      >
        <div className="navbar__inner">
          <Link
            className="navbar__logo"
            to="https://g-arena.org"
          >
            <span className="navbar__logoRing">
              <img
                src={Logo}
                alt="G-ARENA"
              />
            </span>
            <span className="text">
              <span className="big">G-ARENA</span>
              <span className="small">National Summit 2026</span>
            </span>
          </Link>

          {!isApplicationsSite && (
            <div className="navbar__links">
              {SECTION_LINKS.map((link) => (
                <Link
                  key={link.id}
                  to={isHome ? `#${link.id}` : `/#${link.id}`}
                  className={`navbar__link ${activeId === link.id ? 'navbar__link--active' : ''}`}
                  onClick={goToSection(link.id)}
                >
                  {link.label}
                  {activeId === link.id && (
                    <motion.span
                      className="navbar__linkDot"
                      layoutId="navIndicator"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 30 }
                      }
                    />
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="navbar__actions">
            <a
              className="navbar__cta"
              href={REGISTER_URL}
              rel="noreferrer"
            >
              დარეგისტრირდი <i className="bi bi-arrow-right" />
            </a>

            <button
              ref={menuButtonRef}
              type="button"
              className={`navbar__burger ${mobileOpen ? 'navbar__burger--open' : ''}`}
              aria-label={mobileOpen ? 'დახურე მენიუ' : 'გახსენი მენიუ'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="navbarMobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              ref={mobilePanelRef}
              className="navbarMobile__panel"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <motion.div
                className="navbarMobile__links"
                variants={menuContainer}
                initial="hidden"
                animate="visible"
              >
                {!isApplicationsSite &&
                  SECTION_LINKS.map((link) => (
                    <motion.div
                      key={link.id}
                      variants={menuItem}
                    >
                      <Link
                        to={isHome ? `#${link.id}` : `/#${link.id}`}
                        className="navbarMobile__link"
                        onClick={goToSection(link.id)}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                <motion.div variants={menuItem}>
                  <a
                    className="navbarMobile__cta"
                    href={REGISTER_URL}
                    rel="noreferrer"
                    onClick={() => setMobileOpen(false)}
                  >
                    დარეგისტრირდი <i className="bi bi-arrow-right" />
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
