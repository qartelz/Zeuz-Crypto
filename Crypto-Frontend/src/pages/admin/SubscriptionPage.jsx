import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle, XCircle, X, Plus, Calendar, Search, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const SubscriptionPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Create form fields
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [startDate, setStartDate] = useState('');
  
  // Lists for dropdowns
  const [users, setUsers] = useState([]);
  console.log(users,"the filtered users")
  const [plans, setPlans] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  // Refs for click outside
  const userDropdownRef = useRef(null);
  const planDropdownRef = useRef(null);

  const navigate = useNavigate();
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  // Fetch all subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${baseURL}admin/subscriptions/subscriptions/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("authTokens");
          localStorage.removeItem("user");
          navigate("/admin-login");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const sorted = (data.results || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setSubscriptions(sorted);
        setFilteredSubscriptions(sorted);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [navigate]);

  // Filter by status
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredSubscriptions(subscriptions);
    } else {
      setFilteredSubscriptions(
        subscriptions.filter((s) => s.status.toLowerCase() === filterStatus.toLowerCase())
      );
    }
  }, [subscriptions, filterStatus]);

  // Fetch users and plans when modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchUsers();
      fetchPlans();
    }
  }, [showCreateModal]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target)) {
        setShowPlanDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch(`${baseURL}account/users/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only b2b_user and b2c_user roles
        const filteredUsers = (data.results || []).filter(
          user => user.role === 'b2b_user' || user.role === 'b2c_user'
        );
        setUsers(filteredUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Plans
  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const response = await fetch(`${baseURL}admin/subscriptions/plans/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.results || []);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.mobile.includes(userSearch)
  );

  // Filter plans based on search
  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(planSearch.toLowerCase()) ||
    plan.price.includes(planSearch) ||
    plan.user_type.toLowerCase().includes(planSearch.toLowerCase())
  );

  // Create Subscription
  const handleCreateSubscription = async () => {
    if (!selectedUser || !selectedPlan || !startDate.trim()) {
      toast.error("All fields are required", { position: "top-right" });
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch(
        `${baseURL}admin/subscriptions/subscriptions/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.access}`,
          },
          body: JSON.stringify({
            user_id: selectedUser.id,
            plan: selectedPlan.id,
            start_date: startDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.plan?.[0] || data?.start_date?.[0] || data?.message || 'Creation failed';
        throw new Error(errorMessage);
      }

      toast.success('Subscription created successfully!', { position: "top-right" });
      
      closeCreateModal();
      
      // Refresh the subscription list
      const refreshResponse = await fetch(
        `${baseURL}admin/subscriptions/subscriptions/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const sorted = (refreshData.results || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setSubscriptions(sorted);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create subscription', { position: "top-right" });
    } finally {
      setCreateLoading(false);
    }
  };

  // Close Create Modal
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedUser(null);
    setSelectedPlan(null);
    setStartDate('');
    setUserSearch('');
    setPlanSearch('');
    setShowUserDropdown(false);
    setShowPlanDropdown(false);
  };

  const handleView = (subscription) => {
    alert(`View Subscription: ${subscription.plan_name}`);
  };

  const handleDelete = (subscription) => {
    alert(`Delete Subscription: ${subscription.id}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status, isActive) => {
    if (status === "ACTIVE" && isActive) {
      return (
        <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 flex items-center gap-1 w-fit">
          <CheckCircle size={14} />
          Active
        </span>
      );
    } else if (status === "ACTIVE" && !isActive) {
      return (
        <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 flex items-center gap-1 w-fit">
          <Calendar size={14} />
          Scheduled
        </span>
      );
    } else if (status === "CANCELLED") {
      return (
        <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 w-fit">
          <XCircle size={14} />
          Cancelled
        </span>
      );
    } else if (status === "EXPIRED") {
      return (
        <span className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30 flex items-center gap-1 w-fit">
          <XCircle size={14} />
          Expired
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30">
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen rounded-4xl bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 md:p-10 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Subscription Management
            </h1>
            <p className="text-white/70">
              Manage and monitor user subscriptions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-white text-[#4733A6] font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus size={20} />
            Create Subscription
          </button>
        </div>

        {/* Create Subscription Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2654] rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full p-6 my-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Subscription</h2>
                <button
                  onClick={closeCreateModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5 mb-6">
                {/* User Selection */}
                <div ref={userDropdownRef}>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Select User *
                  </label>
                  <div className="relative">
                    <div 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white flex items-center justify-between cursor-pointer hover:bg-white/15 transition-all"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      {selectedUser ? (
                        <div className="flex-1">
                          <div className="font-medium">{selectedUser.full_name}</div>
                          <div className="text-xs text-white/60">{selectedUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-white/50">Choose a user...</span>
                      )}
                      <ChevronDown size={20} className={`text-white/60 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl max-h-64 overflow-hidden">
                        <div className="p-3 border-b border-white/10 sticky top-0 bg-[#1a1a2e]">
                          <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                            <input
                              type="text"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search by name, email, or mobile..."
                              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {usersLoading ? (
                            <div className="p-4 text-center text-white/60">Loading users...</div>
                          ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDropdown(false);
                                  setUserSearch('');
                                }}
                                className="p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5"
                              >
                                <div className="font-medium text-white">{user.full_name}</div>
                                <div className="text-xs text-white/60 mt-0.5">{user.email}</div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-white/50">{user.mobile}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    user.role === 'b2b_user' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {user.role === 'b2b_user' ? 'B2B User' : 'B2C User'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-white/60">No users found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Selection */}
                <div ref={planDropdownRef}>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Select Plan *
                  </label>
                  <div className="relative">
                    <div 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white flex items-center justify-between cursor-pointer hover:bg-white/15 transition-all"
                      onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                    >
                      {selectedPlan ? (
                        <div className="flex-1">
                          <div className="font-medium">{selectedPlan.name}</div>
                          <div className="text-xs text-white/60">
                            ${selectedPlan.price} • {selectedPlan.duration_days} days • {selectedPlan.user_type}
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/50">Choose a plan...</span>
                      )}
                      <ChevronDown size={20} className={`text-white/60 transition-transform ${showPlanDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showPlanDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl max-h-64 overflow-hidden">
                        <div className="p-3 border-b border-white/10 sticky top-0 bg-[#1a1a2e]">
                          <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                            <input
                              type="text"
                              value={planSearch}
                              onChange={(e) => setPlanSearch(e.target.value)}
                              placeholder="Search by name, price, or type..."
                              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {plansLoading ? (
                            <div className="p-4 text-center text-white/60">Loading plans...</div>
                          ) : filteredPlans.length > 0 ? (
                            filteredPlans.map(plan => (
                              <div
                                key={plan.id}
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setShowPlanDropdown(false);
                                  setPlanSearch('');
                                }}
                                className="p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-white">{plan.name}</div>
                                    <div className="text-xs text-white/60 mt-0.5 line-clamp-1">{plan.description}</div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className="font-bold text-green-400">${plan.price}</div>
                                    <div className="text-xs text-white/50">{plan.duration_days}d</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    plan.user_type === 'B2B' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {plan.user_type}
                                  </span>
                                  {plan.is_active && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-white/60">No plans found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                  <p className="text-white/50 text-xs mt-1.5">Select the subscription start date and time</p>
                </div>

                {/* Summary Card */}
                {selectedUser && selectedPlan && (
                  <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-sm text-white/70 mb-2 font-medium">Summary</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">User:</span>
                        <span className="text-white font-medium">{selectedUser.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Plan:</span>
                        <span className="text-white font-medium">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Duration:</span>
                        <span className="text-white font-medium">{selectedPlan.duration_days} days</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10">
                        <span className="text-white/60">Price:</span>
                        <span className="text-green-400 font-bold text-lg">${selectedPlan.price}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubscription}
                  disabled={createLoading || !selectedUser || !selectedPlan || !startDate}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-8 backdrop-blur-md py-4 px-2 rounded-2xl shadow-lg">
          <div className="flex flex-wrap gap-3">
            {["all", "active", "cancelled", "expired"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1 rounded-xl font-semibold transition-all ${
                  filterStatus === status
                    ? "bg-white text-[#4733A6]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            <p className="text-white mt-4">Loading subscriptions...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-xl mb-6">
            Error: {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[#2b2676]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Plan Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Days Remaining
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredSubscriptions.length > 0 ? (
                    filteredSubscriptions.map((subscription) => (
                      <tr
                        key={subscription.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {subscription.plan_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(subscription.start_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(subscription.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(subscription.status, subscription.is_currently_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold">${subscription.final_price}</span>
                            {subscription.discount_amount !== "0.00" && (
                              <span className="text-xs text-white/60 line-through">
                                ${subscription.original_price}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            subscription.days_remaining < 7 
                              ? 'text-red-300' 
                              : subscription.days_remaining < 30 
                              ? 'text-yellow-300' 
                              : 'text-green-300'
                          }`}>
                            {subscription.days_remaining} days
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-white/70 text-lg"
                      >
                        No subscriptions found for this status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;