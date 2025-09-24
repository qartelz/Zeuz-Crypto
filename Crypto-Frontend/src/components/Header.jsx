import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/svg/logo.svg';
import AuthContext from '../contexts/AuthContext';

const Header = () => {
  const { isLoggedIn, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logoutUser();
      navigate('/login'); // Optional: redirect after logout
    } else {
      navigate('/login');
    }
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

        {/* Navigation Links */}
        <div className="flex-1 flex justify-center">
          <ul className="flex space-x-8 ml-[20%] text-[#B5B5B5] font-medium">
            <li><a href="#home" className="hover:text-purple-600">Home</a></li>
            <li><a href="#features" className="hover:text-purple-600">Features</a></li>
            <li><a href="#how" className="hover:text-purple-600">How it Works</a></li>
            <li><a href="#service" className="hover:text-purple-600">Service</a></li>
            <li><a href="#faq" className="hover:text-purple-600">FAQ</a></li>
          </ul>
        </div>

        {/* Auth Button: Sign In or Logout */}
        <div className="p-[1px] rounded-full bg-gradient-to-r from-[#FF3BD4] to-[#7130C3]">
          <button
            onClick={handleAuthAction}
            className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-[#7130C300] to-[#FF3BD4] w-full h-full"
          >
            {isLoggedIn ? 'Logout' : 'Sign In'}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
