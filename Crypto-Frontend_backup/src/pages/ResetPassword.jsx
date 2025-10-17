import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PasswordReset = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/account/password-reset/confirm/${token}/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: newPassword,
            password_confirm: confirmPassword,
          }),
          
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black bg-opacity-90">
      <div className="bg-[#0F0A25]/90 border border-[#4733A6] rounded-lg max-w-md w-full px-10 py-12 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Reset Your Password
        </h2>

        {/* Messages */}
        {error && (
          <div className="bg-red-600 text-white text-center rounded-md py-2 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-600 text-white text-center rounded-md py-2 mb-6">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-12 bg-[#0C0820] text-white placeholder-[#A489F5] px-4 rounded-xl border border-[#4733A6] outline-none focus:ring-2 focus:ring-[#A489F5] transition"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#FF3BD4] to-[#7130C3] hover:scale-105 hover:shadow-lg hover:shadow-[#FF3BD470] active:scale-95 transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF3BD4] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
