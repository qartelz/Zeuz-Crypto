import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/svg/logo.svg';
import bgImage from '../assets/images/Login-bg.png';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatErrors = (errorData) => {
    if (typeof errorData === 'string') return errorData;

    // Combine all field errors into a single message string
    const errors = Object.entries(errorData)
      .map(([field, msgs]) => `${msgs.join(', ')}`)
      .join(' ');
    return errors || 'Registration failed. Please try again.';
  };

  const handleRegister = async () => {
    setMessage('');
    setMessageType('');

    if (formData.password !== formData.password_confirm) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/account/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Registration successful!');
        setMessageType('success');

        // Optionally: store tokens if needed
        // localStorage.setItem('access_token', data.access);
        // localStorage.setItem('refresh_token', data.refresh);

        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        const errorMessage = formatErrors(data);
        setMessage(errorMessage);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    }

    setLoading(false);
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
          <h1 className="text-3xl font-bold text-white">Create your Account</h1>
          <p className="text-gray-400 mt-1">Start your journey with us today.</p>
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

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="text"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
          <input
            type="password"
            name="password_confirm"
            placeholder="Confirm Password"
            value={formData.password_confirm}
            onChange={handleChange}
            className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
          />
        </div>

        {/* Register Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-32 py-2 rounded-full text-white font-semibold
                        bg-gradient-to-b from-[#7130C3] to-[#FF3BD4]
                        hover:scale-105 hover:shadow-lg hover:shadow-[#FF3BD470]
                        active:scale-95
                        transition-all duration-300
                        backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#FF3BD4]
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>

        {/* Login Link */}
        <p className="text-white text-sm text-left">
          Already have an account?{' '}
          <span
            className="bg-gradient-to-r from-[#7A00E4] to-[#D643BF] bg-clip-text text-transparent font-medium cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
