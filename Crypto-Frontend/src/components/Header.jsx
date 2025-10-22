import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/svg/logo.svg';
import { AuthContext } from '../contexts/AuthContext';


const Header = () => {
  const { isLoggedIn, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logoutUser();
    
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex flex-1 justify-center space-x-8 ml-[20%] text-[#B5B5B5] font-medium">
          <li><a href="#home" className="hover:text-purple-600">Home</a></li>
          <li><a href="#features" className="hover:text-purple-600">Features</a></li>
          <li><a href="#how" className="hover:text-purple-600">How it Works</a></li>
          <li><a href="#service" className="hover:text-purple-600">Service</a></li>
          <li><a href="#faq" className="hover:text-purple-600">FAQ</a></li>
        </ul>

        {/* Auth Button with Profile Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn && (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF3BD4]">
              <img
                src="https://i.pravatar.cc/100"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-[1px] rounded-full bg-gradient-to-r from-[#FF3BD4] to-[#7130C3]">
            <button
              onClick={handleAuthAction}
              className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-[#7130C300] to-[#FF3BD4] w-full h-full"
            >
              {isLoggedIn ? 'Logout' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Mobile Profile + Hamburger */}
        <div className="md:hidden flex items-center gap-4">
          {isLoggedIn && (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF3BD4]">
              <img
                src="https://i.pravatar.cc/100"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div
            className="flex flex-col justify-center items-center cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className={`block w-6 h-0.5 bg-[#B5B5B5] mb-1 transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-[#B5B5B5] mb-1 transition-all ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block w-6 h-0.5 bg-[#B5B5B5] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-max-h duration-300 ease-in-out ${isMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
        <ul className="flex flex-col space-y-4 px-6 py-4 text-[#B5B5B5] font-medium">
          <li><a href="#home" onClick={() => setIsMenuOpen(false)} className="hover:text-purple-600">Home</a></li>
          <li><a href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-purple-600">Features</a></li>
          <li><a href="#how" onClick={() => setIsMenuOpen(false)} className="hover:text-purple-600">How it Works</a></li>
          <li><a href="#service" onClick={() => setIsMenuOpen(false)} className="hover:text-purple-600">Service</a></li>
          <li><a href="#faq" onClick={() => setIsMenuOpen(false)} className="hover:text-purple-600">FAQ</a></li>

          {/* Auth Button in Mobile Menu */}
          <li>
            <div className="p-[1px] rounded-full bg-gradient-to-r from-[#FF3BD4] to-[#7130C3]">
              <button
                onClick={handleAuthAction}
                className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-[#7130C300] to-[#FF3BD4] w-full h-full"
              >
                {isLoggedIn ? 'Logout' : 'Sign In'}
              </button>
            </div>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
