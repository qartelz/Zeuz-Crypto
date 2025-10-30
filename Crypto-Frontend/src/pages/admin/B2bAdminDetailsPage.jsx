import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Briefcase, Mail, Phone, Calendar, 
  Wallet, Shield, ChevronRight, Loader, Search, Eye,
  ChevronLeft
} from 'lucide-react';

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      <span className="text-xl font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
};

const B2bAdminDetailsPage = () => {
  const { adminId } = useParams();
  const navigate = useNavigate();
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  const [loading, setLoading] = useState(true);
  const [adminDetails, setAdminDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('batches');
  const [toast, setToast] = useState(null);
  
  // Batches state
  const [batches, setBatches] = useState([]);
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesNext, setBatchesNext] = useState(null);
  const [batchesLoading, setBatchesLoading] = useState(false);
  
  // Users state
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersNext, setUsersNext] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Batch users state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchUsers, setBatchUsers] = useState([]);
  const [batchUsersPage, setBatchUsersPage] = useState(1);
  const [batchUsersNext, setBatchUsersNext] = useState(null);
  const [batchUsersLoading, setBatchUsersLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchAdminDetails();
  }, [adminId]);

  useEffect(() => {
    if (adminDetails) {
      if (activeTab === 'batches') {
        fetchBatches(1);
      } else if (activeTab === 'users') {
        fetchUsers(1);
      }
    }
  }, [activeTab, adminDetails]);

  const fetchAdminDetails = async () => {
    try {
      const response = await fetch(
        `${baseURL}account/b2b-admin/approval-list/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch admin details');

      const data = await response.json();
      const admin = data.results.find(a => a.user.id === adminId);
      
      if (admin) {
        setAdminDetails(admin);
      } else {
        showToast('Admin not found', 'error');
        navigate('/admin/adminspage');
      }
    } catch (error) {
      showToast('Error fetching admin details', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async (page = 1) => {
    setBatchesLoading(true);
    try {
      const response = await fetch(
        `${baseURL}account/batches/by-b2b-admin/${adminId}/?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch batches');

      const data = await response.json();
      
      if (page === 1) {
        setBatches(data.results);
      } else {
        setBatches(prev => [...prev, ...data.results]);
      }
      
      setBatchesNext(data.next);
      setBatchesPage(page);
    } catch (error) {
      showToast('Error fetching batches', 'error');
      console.error(error);
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    setUsersLoading(true);
    try {
      const response = await fetch(
        `${baseURL}account/batches/b2b-admin/${adminId}/?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      
      if (page === 1) {
        setUsers(data.results);
      } else {
        setUsers(prev => [...prev, ...data.results]);
      }
      
      setUsersNext(data.next);
      setUsersPage(page);
    } catch (error) {
      showToast('Error fetching users', 'error');
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBatchUsers = async (batchId, page = 1) => {
    setBatchUsersLoading(true);
    try {
      const response = await fetch(
        `${baseURL}account/batch/users/${batchId}/?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch batch users');

      const data = await response.json();
      
      if (page === 1) {
        setBatchUsers(data.results);
      } else {
        setBatchUsers(prev => [...prev, ...data.results]);
      }
      
      setBatchUsersNext(data.next);
      setBatchUsersPage(page);
    } catch (error) {
      showToast('Error fetching batch users', 'error');
      console.error(error);
    } finally {
      setBatchUsersLoading(false);
    }
  };

  const handleBatchClick = (batch) => {
    setSelectedBatch(batch);
    fetchBatchUsers(batch.id, 1);
  };

  const handleBackFromBatchUsers = () => {
    setSelectedBatch(null);
    setBatchUsers([]);
    setBatchUsersPage(1);
    setBatchUsersNext(null);
  };

  const handleViewUser = async (user) => {
    // Check if user is rejected before navigating
    try {
      const response = await fetch(
        `${baseURL}account/users/${user.id}/details/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (!response.ok) {
        showToast('Failed to fetch user details', 'error');
        return;
      }

      const data = await response.json();
      
      // Check if user is rejected
      if (data.admin_users && data.admin_users.length > 0) {
        const rejectedUser = data.admin_users.find(admin => admin.status === "rejected");
        if (rejectedUser) {
          showToast(
            `This user was rejected. Reason: ${rejectedUser.rejection_reason || "No reason provided"}`,
            'error'
          );
          return;
        }
      }
      
      // Navigate if not rejected
      navigate(`/admin/adminspage/user-profile/${user.id}`);
    } catch (error) {
      showToast('Error checking user status', 'error');
      console.error(error);
    }
  };

  const filterItems = (items, query) => {
    if (!query.trim()) return items;
    
    return items.filter(item => {
      const searchFields = item.name 
        ? [item.name, item.description]
        : [item.full_name, item.email, item.mobile];
      
      return searchFields.some(field => 
        field?.toLowerCase().includes(query.toLowerCase())
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="inline-block animate-spin text-purple-400" size={48} />
          <p className="text-purple-300 mt-4 text-lg">Loading admin details...</p>
        </div>
      </div>
    );
  }

  if (!adminDetails) {
    return null;
  }

  const filteredBatches = filterItems(batches, searchQuery);
  const filteredUsers = filterItems(users, searchQuery);
  const filteredBatchUsers = filterItems(batchUsers, searchQuery);

  return (
    <div className="min-h-screen text-white p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate('/admin/adminspage')}
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            B2B Admins
          </button>
          {selectedBatch && (
            <>
              <ChevronRight size={16} className="text-purple-400" />
              <button
                onClick={handleBackFromBatchUsers}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Batches
              </button>
              <ChevronRight size={16} className="text-purple-400" />
              <span className="text-white">{selectedBatch.name}</span>
            </>
          )}
        </div>

        {/* Admin Details Header */}
        <div className="rounded-2xl border border-purple-500/30 bg-[#120B20]/60 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {adminDetails.user.first_name?.[0] || 'A'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {adminDetails.user.full_name || `${adminDetails.user.first_name} ${adminDetails.user.last_name}`}
                  </h1>
                  <p className="text-white/80 flex items-center gap-2">
                    <Shield size={16} />
                    B2B Administrator
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                adminDetails.status === 'approved' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : adminDetails.status === 'rejected'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {adminDetails.status.charAt(0).toUpperCase() + adminDetails.status.slice(1)}
              </div>
            </div>
          </div>

          <div className="bg-[#120B20]/80 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-purple-400" />
                <div>
                  <p className="text-xs text-purple-300/70">Email</p>
                  <p className="font-medium text-white text-sm">{adminDetails.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-purple-400" />
                <div>
                  <p className="text-xs text-purple-300/70">Mobile</p>
                  <p className="font-medium text-white text-sm">{adminDetails.user.mobile || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-purple-400" />
                <div>
                  <p className="text-xs text-purple-300/70">Joined</p>
                  <p className="font-medium text-white text-sm">
                    {new Date(adminDetails.user.date_joined).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wallet size={20} className="text-emerald-400" />
                <div>
                  <p className="text-xs text-purple-300/70">Wallet Balance</p>
                  <p className="font-medium text-emerald-400 text-sm">
                    ${parseFloat(adminDetails.user.wallet.balance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {!selectedBatch && (
          <div className="mb-6 rounded-2xl w-96 border border-purple-500/20 bg-[#120B20]/40 overflow-hidden">
            <div className="flex space-x-0">
              <button
                onClick={() => setActiveTab('batches')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-semibold transition-all duration-300 ${
                  activeTab === 'batches'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-500/10'
                }`}
              >
                <Briefcase size={18} />
                <span className="text-sm">Batches</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-semibold transition-all duration-300 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-500/10'
                }`}
              >
                <Users size={18} />
                <span className="text-sm">Users</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 w-1/2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" size={20} />
            <input
              type="text"
              placeholder={`Search ${selectedBatch ? 'batch users' : activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#120B20]/60 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Content Area */}
        {selectedBatch ? (
          // Batch Users View
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <button
                  onClick={handleBackFromBatchUsers}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-3 transition-colors"
                >
                  <ChevronLeft size={20} />
                  Back to Batches
                </button>
                <h2 className="text-2xl font-bold text-white">{selectedBatch.name}</h2>
                <p className="text-purple-300">{selectedBatch.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-300/70">Total Users</p>
                <p className="text-3xl font-bold text-white">{selectedBatch.user_count}</p>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/40 overflow-hidden">
              <div className="bg-purple-500/10 px-6 py-4 border-b border-purple-500/20">
                <h3 className="text-lg font-semibold text-white">Batch Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-500/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Mobile</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Wallet Balance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatchUsers.map((user) => (
                      <tr key={user.id} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                        <td className="px-6 py-4 text-white">{user.full_name}</td>
                        <td className="px-6 py-4 text-purple-200">{user.email}</td>
                        <td className="px-6 py-4 text-purple-200">{user.mobile}</td>
                        <td className="px-6 py-4 text-emerald-400 font-medium">
                          ${parseFloat(user.wallet.balance).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {batchUsersLoading && (
                <div className="text-center py-8">
                  <Loader className="animate-spin inline-block text-purple-400" size={32} />
                </div>
              )}

              {batchUsersNext && !batchUsersLoading && (
                <div className="p-6 text-center border-t border-purple-500/20">
                  <button
                    onClick={() => fetchBatchUsers(selectedBatch.id, batchUsersPage + 1)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-semibold transition-all"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'batches' ? (
          // Batches View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => handleBatchClick(batch)}
                className="group rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-6 transition-all duration-300 hover:border-purple-400/40 hover:bg-[#160C26]/70 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Briefcase size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {batch.name}
                      </h3>
                      <p className="text-sm text-purple-300/70">
                        {batch.user_count} / {batch.max_users} users
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-purple-400 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
                <p className="text-purple-300/80 text-sm mb-4 line-clamp-2">{batch.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    batch.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {batch.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-purple-300/70">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Users View
          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/40 overflow-hidden">
            <div className="bg-purple-500/10 px-6 py-4 border-b border-purple-500/20">
              <h3 className="text-lg font-semibold text-white">All Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-500/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Wallet Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                      <td className="px-6 py-4 text-white">{user.full_name}</td>
                      <td className="px-6 py-4 text-purple-200">{user.email}</td>
                      <td className="px-6 py-4 text-purple-200">{user.mobile}</td>
                      <td className="px-6 py-4 text-emerald-400 font-medium">
                        ${parseFloat(user.wallet.balance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {usersLoading && (
              <div className="text-center py-8">
                <Loader className="animate-spin inline-block text-purple-400" size={32} />
              </div>
            )}

            {usersNext && !usersLoading && (
              <div className="p-6 text-center border-t border-purple-500/20">
                <button
                  onClick={() => fetchUsers(usersPage + 1)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-semibold transition-all"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {batchesLoading && activeTab === 'batches' && batches.length === 0 && (
          <div className="text-center py-16">
            <Loader className="animate-spin inline-block text-purple-400 mb-4" size={48} />
            <p className="text-purple-300">Loading batches...</p>
          </div>
        )}

        {!batchesLoading && activeTab === 'batches' && filteredBatches.length === 0 && batches.length > 0 && (
          <div className="text-center py-16 text-purple-300/70">
            <p>No batches found matching your search.</p>
          </div>
        )}

        {!batchesLoading && activeTab === 'batches' && batches.length === 0 && (
          <div className="text-center py-16 text-purple-300/70">
            <Briefcase size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-medium mb-2">No Batches Yet</h3>
            <p className="text-sm opacity-70">This admin hasn't created any batches.</p>
          </div>
        )}

        {!usersLoading && activeTab === 'users' && filteredUsers.length === 0 && users.length > 0 && (
          <div className="text-center py-16 text-purple-300/70">
            <p>No users found matching your search.</p>
          </div>
        )}

        {!usersLoading && activeTab === 'users' && users.length === 0 && (
          <div className="text-center py-16 text-purple-300/70">
            <Users size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-medium mb-2">No Users Yet</h3>
            <p className="text-sm opacity-70">This admin has no users assigned.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default B2bAdminDetailsPage;