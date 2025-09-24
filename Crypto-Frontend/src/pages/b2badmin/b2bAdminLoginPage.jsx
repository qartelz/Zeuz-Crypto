import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import logo from '../../assets/svg/logo.svg';
import bgImage from '../../assets/images/Login-bg.png';

const B2bAdminLoginPage = () => {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');

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

  // Register Handler
  const handleRegister = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');
  
    const tokens = JSON.parse(localStorage.getItem('authTokens'));
  
    if (!tokens || !tokens.access) {
      setMessage('You must be logged in as an admin to register a B2B admin.');
      setMessageType('error');
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/account/b2b-admin/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({
          email: regEmail,
          mobile: regMobile,
          first_name: regFirstName,
          last_name: regLastName,
          password: regPassword,
          send_email: true,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        const errorMsg = data?.message || 'Registration failed.';
        throw new Error(errorMsg);
      }
  
      setMessage("Registration successful! Please wait for approval.");
      setMessageType("success");
  
     
      setTimeout(() => {
        setIsRegistering(false);
        setMessage('');
        setMessageType('');
      }, 2000);
  
    } catch (err) {
      setMessage(err.message || "Something went wrong");
      setMessageType("error");
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
            {isRegistering ? 'B2B Admin Registration' : 'B2B Admin Sign In'}
          </h1>
          <p className="text-white mt-2">
            {isRegistering ? 'Fill the form to register.' : 'Welcome back.'}
          </p>
          <p className="text-gray-400">
            {isRegistering ? 'Your account will require approval.' : 'Please enter your credentials.'}
          </p>
        </div>

        {/* Message */}
        {renderMessage()}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {isRegistering ? (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <input
                type="text"
                placeholder="Mobile"
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 text-center rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
              />
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
            className={`w-32 py-2 rounded-full text-white font-semibold
              bg-gradient-to-b from-[#7130C3] to-[#FF3BD4]
              hover:scale-105 hover:shadow-lg hover:shadow-[#FF3BD470]
              active:scale-95 transition-all duration-300
              backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#FF3BD4]
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? '...' : isRegistering ? 'Register' : 'Login'}
          </button>
        </div>

        {/* Toggle Form Link */}
        <p className="text-white text-sm text-center">
          {isRegistering ? (
            <>
              Already registered?{' '}
              <button
                onClick={() => setIsRegistering(false)}
                className="text-[#FF3BD4] hover:underline font-medium"
              >
                Login
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button
                onClick={() => setIsRegistering(true)}
                className="text-[#FF3BD4] hover:underline font-medium"
              >
                Register as B2B Admin
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default B2bAdminLoginPage;
