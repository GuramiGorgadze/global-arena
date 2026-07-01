import React from 'react';
import Logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link
        className="navbar__logo"
        to="/"
      >
        <img
          src={Logo}
          alt="Logo"
        />
        <span className='text'><span className='big'>G-ARENA</span> <br /> National Summit 2026</span>
      </Link>
    </nav>
  );
};

export default Navbar;
