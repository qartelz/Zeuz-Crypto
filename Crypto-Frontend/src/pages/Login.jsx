import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/svg/logo.svg';
import bgImage from '../assets/images/Login-bg.png';
import { AuthContext } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser, user } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showModal, setShowModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch(`${baseURL}account/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const result = await loginUser(email, password);

        if (result.success && (result.user.role === 'b2b_user' || result.user.role === 'b2c_user')) {
          setMessage('Login successful!');
          setMessageType('success');
          navigate('/');
        } else {
          setMessage(result.message || 'Invalid credentials');
          setMessageType('error');
        }
      } else {
        const errorMessage =
          data.non_field_errors?.[0] ||
          data.detail ||
          data.message ||
          'Invalid email or password.';
        setMessage(errorMessage);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setForgotMessage('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const response = await fetch(`${baseURL}account/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotMessage('A reset link has been sent.');
      } else {
        setForgotMessage(data.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setForgotMessage('Something went wrong. Please try again.');
    }

    setForgotLoading(false);
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
          <h1 className="text-3xl font-bold text-white">Let’s Sign you in</h1>
          <p className="text-white mt-2">Welcome Back!</p>
          <p className="text-gray-400">Please continue with your credentials.</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`text-center mb-6 px-4 py-3 rounded-md shadow-md text-sm font-medium
            ${
              messageType === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500'
                : 'bg-green-500/10 text-green-400 border border-green-500'
            }`}
          >
            {message}
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="E-Mail ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                       px-4 text-center rounded-xl border border-[#4733A6]
                       outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                         px-4 text-center rounded-xl border border-[#4733A6]
                         outline-none focus:ring-2 focus:ring-[#A489F5] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="mb-4 text-right">
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-[#A489F5] hover:underline"
          >
            Forgot Password?
          </button>
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

        {/* Footer Link */}
        <p className="text-white text-sm text-left">
          Don’t have an account?{' '}
          <span
            className="bg-gradient-to-r from-[#7A00E4] to-[#D643BF] bg-clip-text text-transparent font-medium cursor-pointer"
            onClick={() => navigate('/register')}
          >
            Register here
          </span>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1c1835] border border-[#4733A6] w-full max-w-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl text-white font-semibold mb-4">Forgot Password</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                         px-4 rounded-xl border border-[#4733A6] mb-4
                         outline-none focus:ring-2 focus:ring-[#A489F5] transition"
            />
            {forgotMessage && (
              <div className="text-sm text-center text-yellow-400 mb-4">
                {forgotMessage}
              </div>
            )}
            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="bg-[#7130C3] text-white px-4 py-2 rounded-md hover:bg-[#8e3cf0] transition"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1c1835] border border-[#4733A6] w-full max-w-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl text-white font-semibold mb-4">Reset Password</h2>

            <input
              type="text"
              placeholder="Enter Reset Token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                         px-4 rounded-xl border border-[#4733A6] mb-4
                         outline-none focus:ring-2 focus:ring-[#A489F5] transition"
            />

            {/* New Password */}
            <div className="relative mb-4">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                           px-4 rounded-xl border border-[#4733A6]
                           outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-3 text-gray-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative mb-4">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5]
                           px-4 rounded-xl border border-[#4733A6]
                           outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-3 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {resetMessage && (
              <div className="text-sm text-center text-yellow-400 mb-4">
                {resetMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
