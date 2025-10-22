import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle, XCircle, X, Plus, Calendar } from "lucide-react";
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
  const [userId, setUserId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');

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

  // Create Subscription
  const handleCreateSubscription = async () => {
    if (!userId.trim() || !planId.trim() || !startDate.trim()) {
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
            user_id: userId,
            plan: planId,
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
    setUserId('');
    setPlanId('');
    setStartDate('');
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
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2654] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 my-8">
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
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    User ID *
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID (UUID)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Plan ID *
                  </label>
                  <input
                    type="text"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    placeholder="Enter plan ID (UUID)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>

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
                  <p className="text-white/50 text-xs mt-1">Format: ISO 8601 (e.g., 2025-10-20T10:00:00Z)</p>
                </div>
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
                  disabled={createLoading}
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
                    {/* <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Actions
                    </th> */}
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
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(subscription)}
                              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(subscription)}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-md"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
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