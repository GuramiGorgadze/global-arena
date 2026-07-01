import { useState, useEffect } from 'react';

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      className={`scroll-btn ${visible ? 'scroll-btn--visible' : ''}`}
      onClick={scrollToTop}
      aria-hidden={!visible}
    >
      <i className="bi bi-chevron-double-up"></i>
    </button>
  );
}

export default ScrollToTopButton;
