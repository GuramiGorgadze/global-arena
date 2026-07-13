import React from 'react';
import Logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { href: '#committees', label: 'კომიტეტები' },
];

const Navbar = () => {
  return (
    <nav className="navbar">
      <a
        className="navbar__logo"
        href="https://g-arena.org"
      >
        <img
          src={Logo}
          alt="Logo"
        />
        <span className="text">
          <span className="big">G-ARENA</span> <br /> National Summit 2026
        </span>
      </a>
    </nav>
  );
};

export default Navbar;
