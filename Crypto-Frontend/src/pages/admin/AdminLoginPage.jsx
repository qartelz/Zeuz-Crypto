import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import logo from '../../assets/svg/logo.svg';
import bgImage from '../../assets/images/Login-bg.png';

const AdminLoginPage = () => {
  const { loginUser, user ,logoutUser} = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  

  const handleLogin = async () => {
  
    setLoading(true);
    setMessage('');
    setMessageType('');
  
    const result = await loginUser(email, password);
  
    if (result.success) {
      const loggedInUser = result.user;
  
      if (loggedInUser.role === 'admin') {
        setMessage('Admin login successful!');
        setMessageType('success');
  
        // Wait for 1.5 seconds before navigating
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setMessage(result.message || 'Invalid email or password');
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
          <h1 className="text-3xl font-bold text-white">Admin Sign In</h1>
          <p className="text-white mt-2">Welcome back, Admin.</p>
          <p className="text-gray-400">Please enter your credentials.</p>
        </div>

        {/* Messages */}
        {renderMessage()}

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                       px-4 text-center rounded-xl border border-[#4733A6]
                       outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                       px-4 text-center rounded-xl border border-[#4733A6]
                       outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
        </div>

        {/* Login Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-24 py-2 rounded-full text-white font-semibold
                       bg-gradient-to-b from-[#7130C3] to-[#FF3BD4]
                       hover:scale-105 hover:shadow-lg hover:shadow-[#FF3BD470]
                       active:scale-95
                       transition-all duration-300
                       backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#FF3BD4]
                       ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? '...' : 'Login'}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-white text-sm text-center">
          Only authorized admins can access this panel.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
