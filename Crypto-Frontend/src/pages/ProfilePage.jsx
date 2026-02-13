import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { User, MapPin, Mail, Save, Edit2, Loader2, CheckCircle, XCircle, Sparkles, CloudCog } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_BASE_URL;
const ProfilePage = () => {
  const { authTokens, user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  console.log(profileData, "the profile data");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    avatar: null
  });

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}account/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          address: data.address || '',
          city: data.city || '',
          avatar: data.avatar || null
        });
      } else {
        toast.custom((t) => (
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">Failed to load profile</p>
          </div>
        ), { position: 'top-right' });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.custom((t) => (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-200">Something went wrong</p>
        </div>
      ), { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${baseURL}account/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          address: formData.address,
          city: formData.city,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data, "the user profile data");
        setProfileData(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          address: data.address || '',
          city: data.city || '',
          avatar: data.avatar || null
        });
        setIsEditing(false);

        toast.custom((t) => (
          <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-xl rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-200">Profile updated successfully!</p>
          </div>
        ), { position: 'top-right' });
      } else {
        toast.custom((t) => (
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">Failed to update profile</p>
          </div>
        ), { position: 'top-right' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.custom((t) => (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-200">Something went wrong</p>
        </div>
      ), { position: 'top-right' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (authTokens?.access) {
      fetchProfile();
    }
  }, [authTokens]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setFormData({
      first_name: profileData.first_name || '',
      last_name: profileData.last_name || '',
      address: profileData.address || '',
      city: profileData.city || '',
      avatar: profileData.avatar || null
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-full mt-14 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        {/* Header with Gradient Text */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage your personal information</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-white/20 text-gray-300 hover:bg-white/5 rounded-lg transition-all text-center"
              >
                Cancel
              </button>
              <button
                onClick={updateProfile}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card with Gradient Border */}
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Subtle Gradient Overlay */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-500/10 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/10 to-transparent pointer-events-none"></div>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              {/* Avatar Section with Glow */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-purple-500/30 shadow-lg shadow-purple-500/20"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-2 border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 backdrop-blur-sm">
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        {formData.first_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-medium text-white">{formData.first_name} {formData.last_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.role || 'User'}</p>
                </div>
              </div>

              {/* Form Section */}
              <div className="flex-1 space-y-5 w-full">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2 font-medium">
                      <User className="w-4 h-4 text-purple-400" />
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter first name"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all backdrop-blur-sm ${!isEditing
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-purple-500/30 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none placeholder:text-gray-500'
                        }`}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2 font-medium">
                      <User className="w-4 h-4 text-purple-400" />
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter last name"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all backdrop-blur-sm ${!isEditing
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-purple-500/30 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none placeholder:text-gray-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-300 mb-2 font-medium">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm cursor-not-allowed backdrop-blur-sm"
                  />
                </div>

                {/* Address Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2 font-medium">
                      <MapPin className="w-4 h-4 text-pink-400" />
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter address"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all backdrop-blur-sm ${!isEditing
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-purple-500/30 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none placeholder:text-gray-500'
                        }`}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2 font-medium">
                      <MapPin className="w-4 h-4 text-pink-400" />
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter city"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all backdrop-blur-sm ${!isEditing
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-purple-500/30 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none placeholder:text-gray-500'
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm font-medium text-purple-300 mt-0.5">Active</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm font-medium text-blue-300 mt-0.5">{user?.date_joined ? new Date(user.date_joined).getFullYear() : 'N/A'}</p>
              </div>
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400">Role</p>
                <p className="text-sm font-medium text-pink-300 mt-0.5">{user?.role || 'User'}</p>
              </div>
            </div>

            {/* Subscription Section */}
            {profileData?.subscription && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
                  <CloudCog className="w-5 h-5 text-purple-400" />
                  Subscription Details
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <p className="text-xs text-gray-400">Plan</p>
                      <p className="text-sm font-semibold text-white mt-1">{profileData.subscription.plan_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${profileData.subscription.status === 'active'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                        }`}>
                        {profileData.subscription.status?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Joined Date</p>
                      <p className="text-sm text-gray-300 mt-1">
                        {new Date(profileData.subscription.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Expires On</p>
                      {authTokens?.user_role === 'ADMIN' ? <p className="text-sm text-gray-300 mt-1">Lifetime</p> :
                        <p className="text-sm text-gray-300 mt-1">
                          {new Date(profileData.subscription.end_date).toLocaleDateString()}
                        </p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;