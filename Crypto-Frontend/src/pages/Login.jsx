import React from 'react';
import logo from '../assets/svg/logo.svg';
import bgImage from '../assets/images/Login-bg.png';

const LoginPage = () => {
  return (
    <div
      className="min-h-screen bg-center bg-cover flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-[#0F0A25]/90  border border-[#4733A6] rounded-lg w-full max-w-xl px-10 py-12 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-10 w-auto" /> {/* Smaller logo */}
        </div>

        {/* Heading */}
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-white">Let’s Sign you in</h1>
          <p className="text-white mt-2">Welcome Back!</p>
          <p className="text-gray-400">Please continue with your credentials.</p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="E-Mail ID"
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                       px-4 text-center rounded-xl border border-[#4733A6]
                       outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                       px-4 text-center rounded-xl border border-[#4733A6]
                       outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
        </div>

        {/* Login Button */}
        <div className="flex justify-center mb-6">
          <button
            className="w-24 py-2 rounded-full text-white font-semibold
                       bg-gradient-to-b from-[#7130C3] to-[#FF3BD4]
                       hover:scale-105 hover:shadow-lg hover:shadow-[#FF3BD470]
                       active:scale-95
                       transition-all duration-300
                       backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#FF3BD4]"
          >
            Login
          </button>
        </div>

        {/* Footer Link */}
        <p className="text-white text-sm text-left">
          Don’t have an account?{' '}
          <span className="bg-gradient-to-r from-[#7A00E4] to-[#D643BF] bg-clip-text text-transparent font-medium cursor-pointer">
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
