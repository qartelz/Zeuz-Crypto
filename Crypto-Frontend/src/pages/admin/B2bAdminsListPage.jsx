

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle, XCircle, X, Plus, EyeOff, Eye as EyeIcon } from "lucide-react";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const B2bAdminsListPage = () => {
  const [admins, setAdmins] = useState([]);
  console.log(admins,"b2b-admin list")
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [useCustomReason, setUseCustomReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  
  // Create form fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);


  const navigate = useNavigate();
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  // ✅ Fetch all admins
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      setError(null);
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
          (a, b) =>
            new Date(b.user.date_joined) - new Date(a.user.date_joined)
        );

        setAdmins(sorted);
        setFilteredAdmins(sorted);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [navigate]);

  // ✅ Filter by status
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredAdmins(admins);
    } else {
      setFilteredAdmins(admins.filter((a) => a.status === filterStatus));
    }
  }, [admins, filterStatus]);

  // ✅ Create B2B Admin
  const handleCreateAdmin = async () => {
    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regMobile.trim() || !regPassword.trim()) {
      toast.error("All fields are required", { position: "top-right" });
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch(`${baseURL}account/b2b-admin/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access}`,
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
        throw new Error(data?.message || 'Registration failed.');
      }

      toast.success('B2B Admin created successfully!', { position: "top-right" });
      
      // Close modal and reset form
      closeCreateModal();
      
      // Refresh the admin list
      const refreshResponse = await fetch(
        `${baseURL}account/b2b-admin/approval-list/`,
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
          (a, b) =>
            new Date(b.user.date_joined) - new Date(a.user.date_joined)
        );
        setAdmins(sorted);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create B2B Admin', { position: "top-right" });
    } finally {
      setCreateLoading(false);
    }
  };

  // ✅ Close Create Modal
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setRegFirstName('');
    setRegLastName('');
    setRegEmail('');
    setRegMobile('');
    setRegPassword('');
    setShowPassword(false);
  };

  // ✅ Approve Admin
  const handleApprove = async (userId) => {
    try {
      const response = await fetch(
        `${baseURL}account/b2b-admin/approve/${userId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Approval failed");

      toast.success("Admin approved successfully!", { position: "top-right" });

      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.user.id === userId ? { ...admin, status: "approved" } : admin
        )
      );
    } catch (err) {
      toast.error(err.message || "Approval failed", { position: "top-right" });
    }
  };

  // ✅ Reject Admin - Open Modal
  const handleReject = (userId) => {
    setSelectedUserId(userId);
    setRejectionReason("Insufficient documentation provided");
    setUseCustomReason(false);
    setShowRejectModal(true);
  };

  // ✅ Confirm Reject
  // const confirmReject = async () => {
  //   if (!rejectionReason.trim()) {
  //     toast.error("Rejection reason is required", { position: "top-right" });
  //     return;
  //   }

  //   try {
  //     const response = await fetch(
  //       `${baseURL}account/b2b-admin/reject/${selectedUserId}/`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${tokens?.access}`,
  //         },
  //         body: JSON.stringify({
  //           action: "reject",
  //           reason: rejectionReason,
  //         }),
  //       }
  //     );

  //     const data = await response.json();

  //     if (!response.ok) throw new Error(data.message || "Rejection failed");

  //     toast.success("Admin rejected successfully!", { position: "top-right" });

  //     setAdmins((prevAdmins) =>
  //       prevAdmins.map((admin) =>
  //         admin.user.id === selectedUserId
  //           ? { ...admin, status: "rejected", rejection_reason: rejectionReason }
  //           : admin
  //       )
  //     );

  //     closeRejectModal();
  //   } catch (err) {
  //     toast.error(err.message || "Rejection failed", { position: "top-right" });
  //   }
  // };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required", { position: "top-right" });
      return;
    }
  
    setRejectLoading(true); // start loading
  
    try {
      const response = await fetch(
        `${baseURL}account/b2b-admin/reject/${selectedUserId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
          body: JSON.stringify({
            action: "reject",
            reason: rejectionReason,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) throw new Error(data.message || "Rejection failed");
  
      toast.success("Admin rejected successfully!", { position: "top-right" });
  
      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.user.id === selectedUserId
            ? { ...admin, status: "rejected", rejection_reason: rejectionReason }
            : admin
        )
      );
  
      closeRejectModal();
    } catch (err) {
      toast.error(err.message || "Rejection failed", { position: "top-right" });
    } finally {
      setRejectLoading(false); // stop loading
    }
  };
  

  // ✅ Close Reject Modal
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setUseCustomReason(false);
    setSelectedUserId(null);
  };

  const handleView = (admin) => {
    if (admin.status === "rejected") {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-gradient-to-br from-[#1a1a2e] to-[#2d2654] text-white border border-red-500/30 shadow-xl rounded-2xl p-4 flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-red-400 flex items-center gap-2">
                <XCircle size={18} /> Rejected Admin
              </span>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-white/80">
              This admin was rejected. <br />
              <span className="text-red-300 font-medium">
                Reason: {admin.rejection_reason || "No reason provided"}
              </span>
            </p>
          </div>
        ),
        { position: "top-right", duration: 4000 }
      );
      return; // 🚫 Prevent navigation
    }
  
    // ✅ Navigate only if not rejected
    navigate(`/admin/adminspage/b2b-admin-details/${admin.user.id}`);
  };
  

  const handleDelete = (admin) => {
    alert(`Delete B2B Admin: ${admin.user.full_name}`);
  };

  return (
    <div className="min-h-screen rounded-4xl  bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 md:p-10 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              B2B Admins Management
            </h1>
            <p className="text-white/70">
              Manage and approve B2B administrator accounts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-white  text-[#4733A6] font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus size={20} />
            Create B2B Admin
          </button>

          {/* Create B2B Admin Modal */}
      {showCreateModal && (
       <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">

          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2654] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 my-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create B2B Admin</h2>
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
                  First Name *
                </label>
                <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Last Name * 
                </label>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Mobile *
                </label>
                <input
                  type="tel"
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
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
                onClick={handleCreateAdmin}
                disabled={createLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

        </div>




        {/* Filter Tabs */}
        <div className="mb-8 backdrop-blur-md py-4 px-2 rounded-2xl shadow-lg">
          <div className="flex flex-wrap gap-3">
            {["all", "approved", "rejected", "pending"].map((status) => (
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
            <p className="text-white mt-4">Loading admins...</p>
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
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Mobile
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => {
                      const u = admin.user;
                      return (
                        <tr
                          key={admin.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {u.full_name || `${u.first_name} ${u.last_name}`}
                          </td>
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4">{u.mobile || "-"}</td>

                          {/* Status Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {admin.status === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(u.id)}
                                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(u.id)}
                                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : admin.status === "approved" ? (
                              <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle size={14} />
                                Approved
                              </span>
                            ) : admin.status === "rejected" ? (
                              <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 w-fit">
                                <XCircle size={14} />
                                Rejected
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30">
                                Unknown
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleView(admin)}
                                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(admin)}
                                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-md"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-white/70 text-lg"
                      >
                        No B2B Admins found for this status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center max-h-screen justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2654] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Reject Admin</h2>
              <button
                onClick={closeRejectModal}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-3">
                Rejection Reason *
              </label>
              
              {/* Quick Select Option */}
              <button
                onClick={() => {
                  setUseCustomReason(false);
                  setRejectionReason("Insufficient documentation provided");
                }}
                className={`w-full px-4 py-3 rounded-xl mb-3 text-left font-medium transition-all ${
                  !useCustomReason
                    ? "bg-red-600 text-white border-2 border-red-500"
                    : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/20"
                }`}
              >
                Insufficient documentation provided
              </button>

              {/* Custom Reason Toggle */}
              <button
                onClick={() => {
                  setUseCustomReason(true);
                  setRejectionReason("");
                }}
                className={`w-full px-4 py-3 rounded-xl mb-3 text-left font-medium transition-all ${
                  useCustomReason
                    ? "bg-red-600 text-white border-2 border-red-500"
                    : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/20"
                }`}
              >
                Custom reason
              </button>

              {/* Custom Textarea (only shown when custom is selected) */}
              {useCustomReason && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Type your custom rejection reason..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none"
                  rows={4}
                  autoFocus
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeRejectModal}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/20"
              >
                Cancel
              </button>
              {/* <button
                onClick={confirmReject}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all shadow-lg hover:shadow-red-500/50"
              >
                Confirm Reject
              </button> */}

<button
  onClick={confirmReject}
  disabled={rejectLoading}
  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {rejectLoading ? "Rejecting..." : "Confirm Reject"}
</button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2bAdminsListPage;