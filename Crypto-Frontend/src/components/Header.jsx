
  import React from 'react';
  import logo from '../assets/svg/logo.svg';


  const Header = () => {
    return (
      <header className="w-full px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2">
              {/* Replace this with your SVG */}
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

          {/* Sign In Button */}
          <div className="p-[1px] rounded-full bg-gradient-to-r from-[#FF3BD4] to-[#7130C3]">
    <button className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-[#7130C300] to-[#FF3BD4] w-full h-full">
      Sign In
    </button>
  </div>

        </nav>
      </header>
    );
  };

  export default Header;
