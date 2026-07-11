import React from 'react';
import logo from '../assets/logo.png';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <span className="footer__logo">
            <img
              src={logo}
              alt="TMUN"
            />
          </span>
          <div className="footer__wrapper">
            <p className="footer__wordmark">GLOBAL ARENA</p>
            <p className="footer__tagline">NATIONAL SUMMIT 2026</p>
          </div>
        </div>

        <div className="footer__col">
          <p className="footer__colTitle">კონტაქტი</p>
          <a href="mailto:globalarena.mun@gmail.com">globalarena.mun@gmail.com</a>
          <a href="tel:+995500000000">+995 500 05 10 95</a>
          <div className="footer__socials">
            <a
              href="https://www.instagram.com/globalarena.mun/"
              target="blank"
              aria-label="Instagram"
            >
              <i className="bi bi-instagram" />
            </a>
            <a
              href="https://www.tiktok.com/@g_arenamun?_r=1&_t=ZS-97wupUsEXyB"
              target="blank"
              aria-label="TikTok"
            >
              <i className="bi bi-tiktok" />
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2026 G-ARENA. ყველა უფლება დაცულია.</p>
      </div>
    </footer>
  );
}

export default Footer;
