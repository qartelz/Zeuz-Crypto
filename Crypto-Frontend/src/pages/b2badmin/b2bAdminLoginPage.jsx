

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import logo from '../../assets/svg/logo.svg';
import bgImage from '../../assets/images/Login-bg.png';
import { Eye, EyeOff } from 'lucide-react';

const B2bAdminLoginPage = () => {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  // Login Handler
  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');

    const result = await loginUser(email, password);

    if (result.success) {
      const loggedInUser = result.user;

      if (loggedInUser.role === 'b2b_admin') {
        setMessage('B2B Admin login successful!');
        setMessageType('success');
        navigate('/b2b/batches');
      } else {
        setMessage('Only B2B Admins can login here.');
        setMessageType('error');
      }
    } else {
      setMessage(result.message || 'Invalid email or password');
      setMessageType('error');
    }

    setLoading(false);
  };

  const renderMessage = () => {
    if (!message) return null;

    let bgColor = 'bg-red-500';
    if (messageType === 'success') bgColor = 'bg-green-500';
    else if (messageType === 'warning') bgColor = 'bg-yellow-500';

    return (
      <div className={`${bgColor} text-white text-sm rounded-md px-4 py-2 mb-4 text-center`}>
        {message}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-center bg-cover flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-[#0F0A25]/90 border border-[#4733A6] rounded-lg w-full max-w-xl px-10 py-12 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </div>

        {/* Heading */}
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-white">
            B2B Admin Sign In
          </h1>
          <p className="text-white mt-2">
            Welcome back.
          </p>
          <p className="text-gray-400">
            Please enter your credentials.
          </p>
        </div>

        {/* Message */}
        {renderMessage()}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          
          {/* Password with eye icon */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 pr-12 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
            />
            <div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A489F5] cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-32 py-2 rounded-full text-white font-semibold
              bg-gradient-to-b from-[#7130C3] to-[#FF3BD4]
              hover:scale-105 hover:shadow-lg hover:shadow-[#FF3BD470]
              active:scale-95 transition-all duration-300
              backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#FF3BD4]
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? '...' : 'Login'}
          </button>
        </div>

      
      </div>
    </div>
  );
};

export default B2bAdminLoginPage;