
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, CheckCircle, XCircle, X, Plus, Calendar, Search, ChevronDown, Loader, Clock, ThumbsUp, ThumbsDown, Info, Filter, ArrowLeft, Crown, ChevronRight, List } from "lucide-react";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;

/* === Reusable Components matching AdminDashboard === */
function InfoTooltip({ text }) {
  return (
    <div className="group relative inline-block ml-2 z-50">
      <div className="cursor-help text-purple-400/50 hover:text-purple-400 transition-colors">
        <Info size={16} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1f1d2b] border border-purple-500/20 rounded-lg text-xs text-purple-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1f1d2b] box-content"></div>
      </div>
    </div>
  );
}

const SubscriptionPage = () => {
  // Top level tabs: 'b2c' or 'b2b'
  const [mainTab, setMainTab] = useState('b2c');

  // B2B inner views: 'admins', 'batches', 'students', 'requests'
  const [b2bView, setB2bView] = useState('admins');

  // Data States
  const [subscriptions, setSubscriptions] = useState([]); // B2C Subscriptions
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);

  const [batches, setBatches] = useState([]);
  const [b2bAdmins, setB2bAdmins] = useState([]); // New: List of B2B Admins
  const [selectedAdmin, setSelectedAdmin] = useState(null); // New: Selected Admin
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]); // Students in selected batch

  const [requests, setRequests] = useState([]); // B2B Requests

  // Interaction States
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false); // General loading (e.g. initial fetch)
  const [studentsLoading, setStudentsLoading] = useState(false); // Specific for students list
  const [requestsLoading, setRequestsLoading] = useState(false); // Specific for requests list
  const [batchesLoading, setBatchesLoading] = useState(false); // Specific for batches list
  const [adminsLoading, setAdminsLoading] = useState(false); // New

  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create form fields
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [startDate, setStartDate] = useState('');

  // Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [requestToVerify, setRequestToVerify] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false); // Loading state for approval


  // Lists for dropdowns
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  // Search states for dropdowns
  const [userSearch, setUserSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  // Refs for click outside
  const userDropdownRef = useRef(null);
  const planDropdownRef = useRef(null);

  const navigate = useNavigate();
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  // Initial Data Fetch
  useEffect(() => {
    fetchSubscriptions();
    fetchRequests();
    // fetchBatches() moved to depend on view state
  }, [navigate]);

  useEffect(() => {
    if (mainTab === 'b2b') {
      if (b2bView === 'admins') fetchB2BAdmins();
      else if (b2bView === 'batches' && selectedAdmin) fetchBatches(selectedAdmin.id);
      else if (b2bView === 'requests') fetchRequests();
    }
  }, [mainTab, b2bView, selectedAdmin]);

  // --- API Functions ---

  const fetchSubscriptions = async () => {
    if (mainTab !== 'b2c') return; // Optimized fetching
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

  const fetchB2BAdmins = async () => {
    setAdminsLoading(true);
    try {
      console.log("Fetching B2B Admins from:", `${baseURL}account/b2b-admin/approval-list/`);
      const response = await fetch(`${baseURL}account/b2b-admin/approval-list/`, {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("B2B Admin Approval List Raw:", data);
        const results = data.results || data;

        // Filter for 'approved' status and extract the nested 'user' object
        const approvedAdmins = results
          .filter(item => item.status === 'approved')
          .map(item => item.user);

        console.log("Mapped Approved Admins:", approvedAdmins);
        setB2bAdmins(approvedAdmins);
      } else {
        console.error("Failed to fetch admins:", response.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminsLoading(false);
    }
  }

  const fetchBatches = async (adminId = null) => {
    setBatchesLoading(true);
    try {
      let url = `${baseURL}admin/subscriptions/batches/`;
      if (adminId && adminId !== 'ALL') {
        url += `?created_by=${adminId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBatches(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    } finally {
      setBatchesLoading(false);
    }
  }

  const fetchBatchStudents = async (batchId) => {
    setStudentsLoading(true);
    setBatchStudents([]); // Clear previous to prevent stale data
    try {
      const response = await fetch(`${baseURL}admin/subscriptions/batches/${batchId}/students/`, {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBatchStudents(data.results || data);
      }
    } catch (err) {
      toast.error("Failed to fetch students");
    } finally {
      setStudentsLoading(false);
    }
  }

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch(
        `${baseURL}admin/subscriptions/orders/pending_orders/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Pending Requests API Raw Data:", data); // DEBUG
        // Filter logic loosening: check if order_type includes 'B2B' just in case
        const pending = (data.results || data).filter(o => {
          console.log(`Checking order ID ${o.id}: Type=${o.order_type}, Status=${o.status}`);
          return o.order_type === 'B2B_REQUEST' || o.order_type === 'B2B Request';
        });
        console.log("Filtered Pending Requests:", pending); // DEBUG
        setRequests(pending);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setRequestsLoading(false);
    }
  }

  // --- Effects ---

  // Filter Subscriptions (B2C)
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredSubscriptions(subscriptions);
    } else {
      setFilteredSubscriptions(
        subscriptions.filter((s) => s.status.toLowerCase() === filterStatus.toLowerCase())
      );
    }
  }, [subscriptions, filterStatus]);

  // --- Handlers ---

  const handleAdminClick = (admin) => {
    setSelectedAdmin(admin);
    setB2bView('batches');
  }

  const handleBatchClick = (batch) => {
    setSelectedBatch(batch);
    setB2bView('students');
    fetchBatchStudents(batch.id);
  }

  const handleBackToAdmins = () => {
    setSelectedAdmin(null);
    setB2bView('admins');
    setBatches([]);
  }

  const handleBackToBatches = () => {
    setSelectedBatch(null);
    setB2bView('batches');
    setBatchStudents([]);
  }

  const openVerifyModal = (requestOrStudent) => {
    // Normalize data structure depending on source
    if (requestOrStudent.subscription && requestOrStudent.full_name) {
      // Source: Student list
      setRequestToVerify({
        id: requestOrStudent.subscription.id,
        user_username: requestOrStudent.full_name,
        plan_name: requestOrStudent.subscription.plan_name,
        // Map requested_at to created_at because the modal JSX expects created_at
        created_at: requestOrStudent.subscription.requested_at,
        amount: "—",
        batch_name: selectedBatch ? selectedBatch.name : "Unknown Batch",
        // Helper text from serializer might be '90' (int) or '90 Days', ensure we handle it
        plan_duration: requestOrStudent.subscription.plan_duration || "—",
        type: "Student List Source"
      });
    } else {
      // Source: Requests list (SubscriptionOrder objects)
      setRequestToVerify({
        ...requestOrStudent,
        // Ensure we fallback if fields are missing
        batch_name: requestOrStudent.batch_name || "—",
        plan_duration: requestOrStudent.plan_duration || "—"
      });
    }
    setVerifyModalOpen(true);
  }

  const handleApproveRequest = async () => {
    if (!requestToVerify) return;

    try {
      const response = await fetch(`${baseURL}admin/subscriptions/orders/${requestToVerify.id}/complete_order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.ok) {
        toast.success("Request approved and activated!");
        setVerifyModalOpen(false);
        setRequestToVerify(null);
        fetchRequests();
        fetchBatches();
        // If looking at students, refresh list
        if (selectedBatch) fetchBatchStudents(selectedBatch.id);
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to approve request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error approving request");
    }
  }

  const handleRejectRequest = async (orderId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      const response = await fetch(`${baseURL}admin/subscriptions/orders/${orderId}/cancel_order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({ reason: "Admin Rejected" })
      });

      if (response.ok) {
        toast.success("Request rejected");
        fetchRequests();
        if (selectedBatch) fetchBatchStudents(selectedBatch.id);
      } else {
        toast.error("Failed to reject request");
      }
    } catch (err) {
      toast.error("Error rejecting request");
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target)) {
        setShowPlanDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      fetchUsers();
      fetchPlans();
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setStartDate(now.toISOString().slice(0, 16));
    }
  }, [showCreateModal]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch(`${baseURL}account/user-list/`, {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      const data = await response.json();
      setUsers(data.results || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const response = await fetch(`${baseURL}admin/subscriptions/plans/active/`, {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setPlansLoading(false);
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user =>
    (user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase()))
    );
  };

  const getFilteredPlans = () => {
    return plans.filter(plan =>
      plan.name.toLowerCase().includes(planSearch.toLowerCase())
    );
  };

  const handleCreateSubscription = async () => {
    if (!selectedUser || !selectedPlan || !startDate) {
      toast.error("Please fill all fields");
      return;
    }
    setCreateLoading(true);
    try {
      const response = await fetch(`${baseURL}admin/subscriptions/orders/admin_assign_plan/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          plan_id: selectedPlan.id,
          start_date: startDate,
        }),
      });

      if (!response.ok) throw new Error("Failed");
      toast.success("Subscription assigned successfully");
      setShowCreateModal(false);
      setSelectedUser(null);
      setSelectedPlan(null);
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to create subscription");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "EXPIRED": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  // Filter Helpers
  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-4 sm:p-8 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-8 bg-purple-500 rounded-full mr-2"></span>
            Subscription Management
            <InfoTooltip text="Manage plans, user assignments and approve requests" />
          </h1>
          <p className="text-purple-200/50 mt-1 text-sm ml-4">
            {mainTab === 'b2c' ? "Manage individual user subscriptions." : "Manage B2B batches, students, and requests."}
          </p>
        </div>

        {mainTab === 'b2c' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-white transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/20"
          >
            <Plus size={18} className="transition-transform group-hover:rotate-90" />
            <span>Assign Plan</span>
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-6 border-b border-purple-500/10">
        <button
          onClick={() => setMainTab('b2c')}
          className={`pb-4 px-2 text-sm font-medium transition-all ${mainTab === 'b2c'
            ? 'text-purple-400 border-b-2 border-purple-500'
            : 'text-purple-200/50 hover:text-purple-200'
            }`}
        >
          B2C Users
        </button>
        <button
          onClick={() => { setMainTab('b2b'); setB2bView('admins'); setSelectedAdmin(null); }}
          className={`pb-4 px-2 text-sm font-medium transition-all relative ${mainTab === 'b2b'
            ? 'text-purple-400 border-b-2 border-purple-500'
            : 'text-purple-200/50 hover:text-purple-200'
            }`}
        >
          B2B Users
          {requests.length > 0 && !requestsLoading && (
            <span className="ml-2 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-purple-500/20 animate-pulse">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#13111C] border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl min-h-[500px]">

        {/* === B2C View === */}
        {mainTab === 'b2c' && (
          <>
            <div className="p-4 border-b border-purple-500/10 flex flex-wrap gap-4 items-center justify-between bg-purple-500/5">
              <div className="flex gap-2 p-1 bg-[#0a0a0f]/50 rounded-lg border border-purple-500/10">
                {["all", "active", "expired", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filterStatus === status
                      ? "bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/20"
                      : "text-purple-200/50 hover:text-purple-200 hover:bg-white/5"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-purple-200/50">
                <Filter size={14} />
                <span>Total: {filteredSubscriptions.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-purple-500" /></div>
              ) : (sub => (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-purple-500/5 border-b border-purple-500/10 text-purple-200/50 uppercase text-xs tracking-wider">
                      <th className="py-4 px-6 font-medium">User</th>
                      <th className="py-4 px-6 font-medium">Plan</th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium">Duration</th>
                      <th className="py-4 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="group hover:bg-purple-500/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                              {sub.user?.email?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{sub.user?.first_name} {sub.user?.last_name}</p>
                              <p className="text-xs text-purple-200/40">{sub.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm text-purple-100">{sub.plan_name}</span>
                            <span className="text-xs text-emerald-400 font-medium">${sub.final_price}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                            {sub.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />}
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-purple-200/40">
                              <span className="w-10">Start:</span>
                              <span className="text-purple-200/70">{new Date(sub.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-purple-200/40">
                              <span className="w-10">End:</span>
                              <span className="text-purple-200/70">{new Date(sub.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="p-2 text-purple-200/50 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSubscriptions.length === 0 && (
                      <tr><td colSpan={5} className="py-16 text-center text-purple-200/30">No subscriptions found.</td></tr>
                    )}
                  </tbody>
                </table>
              ))()}
            </div>
          </>
        )}

        {/* === B2B View === */}
        {mainTab === 'b2b' && (
          <div className="p-0">
            {/* B2B Toolbar & Breadcrumbs */}
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between bg-purple-500/5">
              <div className="flex items-center gap-2">

                {/* Back Buttons */}
                {b2bView === 'batches' && selectedAdmin && (
                  <button onClick={handleBackToAdmins} className="p-1 hover:bg-purple-500/20 rounded text-purple-200/50 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                )}
                {b2bView === 'students' && (
                  <button onClick={handleBackToBatches} className="p-1 hover:bg-purple-500/20 rounded text-purple-200/50 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                )}

                {/* Title / Breadcrumbs */}
                <h3 className="font-bold text-white flex items-center gap-2">
                  {b2bView === 'admins' && "B2B Admins"}

                  {b2bView === 'batches' && (
                    <>
                      <span className="text-purple-200/50 font-normal">Admin:</span> {selectedAdmin?.first_name} {selectedAdmin?.last_name}
                    </>
                  )}

                  {b2bView === 'students' && (
                    <>
                      <span className="text-purple-200/50 font-normal">Batch:</span> {selectedBatch?.name}
                    </>
                  )}
                  {b2bView === 'requests' && "Pending Requests"}
                </h3>
              </div>

              <div className="flex gap-3">
                {b2bView === 'admins' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500/50 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search admins..."
                      // Implement admin search logic if needed
                      className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50 w-64"
                    />
                  </div>
                )}

                {b2bView === 'batches' && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500/50 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50 w-64"
                      />
                    </div>
                  </>
                )}

                {(b2bView === 'admins' || b2bView === 'batches') && (
                  <button
                    onClick={() => setB2bView('requests')}
                    className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/20 transition-all font-medium text-sm"
                  >
                    <Clock size={16} />
                    {requestsLoading ? (
                      <Loader className="animate-spin w-3 h-3" />
                    ) : (
                      <>
                        Requests
                        {requests.length > 0 && <span className="bg-purple-500 text-white text-[10px] px-1.5 rounded-full font-bold">{requests.length}</span>}
                      </>
                    )}
                  </button>
                )}

                {b2bView === 'requests' && (
                  <button
                    onClick={() => { setB2bView('admins'); setSelectedAdmin(null); }}
                    className="text-xs font-bold uppercase tracking-wider text-purple-200/50 hover:text-white"
                  >
                    Back to Admins
                  </button>
                )}
              </div>
            </div>

            {/* B2B Content */}

            {/* 0: Admins Grid */}
            {b2bView === 'admins' && (
              <div className="p-6">
                {adminsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader className="animate-spin text-purple-500" size={32} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {b2bAdmins.map(admin => (
                      <div
                        key={admin.id}
                        onClick={() => handleAdminClick(admin)}
                        className="group bg-[#0a0a0f] border border-purple-500/10 rounded-xl p-6 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 relative overflow-hidden flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
                          {admin.first_name?.[0] || admin.email?.[0] || 'A'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                            {admin.first_name} {admin.last_name}
                          </h3>
                          <p className="text-xs text-purple-200/40">{admin.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/10 uppercase font-bold">
                              B2B Admin
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-purple-500/30 group-hover:text-white transition-colors" />
                      </div>
                    ))}
                    {b2bAdmins.length === 0 && (
                      <div className="col-span-full py-12 text-center text-purple-200/30">
                        No B2B Admins found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            {/* A: Batches Grid */}
            {
              b2bView === 'batches' && (
                <div className="p-6">
                  {batchesLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader className="animate-spin text-purple-500" size={32} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBatches.map(batch => (
                        <div
                          key={batch.id}
                          onClick={() => handleBatchClick(batch)}
                          className="group bg-[#0a0a0f] border border-purple-500/10 rounded-xl p-6 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-[#13111C] rounded-xl border border-purple-500/10 text-purple-400 group-hover:text-white transition-colors">
                              <Crown size={20} />
                            </div>
                            {batch.pending_requests > 0 && (
                              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                                {batch.pending_requests} Pending
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                            {batch.name}
                          </h3>
                          <p className="text-xs text-purple-200/40 mb-6">Owner ID: {batch.created_by?.slice(0, 8) || "?"}</p>

                          <div className="grid grid-cols-3 gap-2 py-4 border-t border-purple-500/10">
                            <div className="text-center">
                              <p className="text-[10px] text-purple-200/40 uppercase tracking-wider mb-1">Students</p>
                              <p className="text-lg font-bold text-white">{batch.total_students || 0}</p>
                            </div>
                            <div className="text-center border-x border-purple-500/10 px-2">
                              <p className="text-[10px] text-purple-200/40 uppercase tracking-wider mb-1">Active</p>
                              <p className="text-lg font-bold text-emerald-400">{batch.active_subscriptions || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-purple-200/40 uppercase tracking-wider mb-1">Expired</p>
                              <p className="text-lg font-bold text-purple-200/60">{batch.expired_subscriptions || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end text-xs font-bold text-purple-200/30 uppercase tracking-widest group-hover:text-white transition-colors">
                            View Details <ChevronRight size={14} className="ml-1" />
                          </div>
                        </div>
                      ))}
                      {filteredBatches.length === 0 && (
                        <div className="col-span-full py-12 text-center text-purple-200/30 flex flex-col items-center">
                          <List size={32} className="mb-2 opacity-50" />
                          <p>No batches found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            {/* B: Student List */}
            {
              b2bView === 'students' && (
                <div className="overflow-x-auto">
                  {studentsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader className="animate-spin text-purple-500" size={32} />
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-purple-500/5 border-b border-purple-500/10 text-purple-200/50 uppercase text-xs tracking-wider">
                          <th className="px-6 py-4 font-medium">Student</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Plan</th>
                          <th className="px-6 py-4 font-medium">Expiry / Request</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10">
                        {batchStudents.map(student => (
                          <tr key={student.id} className="hover:bg-purple-500/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#0a0a0f] border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                                  {student.full_name?.[0]}
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-sm">{student.full_name}</p>
                                  <p className="text-xs text-purple-200/40">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(student.subscription?.status)}`}>
                                {student.subscription?.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />}
                                {student.subscription?.status || 'NO PLAN'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-purple-100">
                              <div className="flex flex-col">
                                <span>{student.subscription?.plan_name || "—"}</span>
                                {student.subscription?.plan_duration && (
                                  <span className="text-[10px] text-purple-200/50">{student.subscription.plan_duration} Days</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-purple-200/50 font-mono">
                              {student.subscription?.end_date
                                ? new Date(student.subscription.end_date).toLocaleDateString()
                                : student.subscription?.requested_at
                                  ? `Req: ${new Date(student.subscription.requested_at).toLocaleDateString()}`
                                  : "—"
                              }
                            </td>
                            <td className="px-6 py-4 text-right">
                              {student.subscription?.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => openVerifyModal(student)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all shadow-lg shadow-indigo-500/5"
                                >
                                  <CheckCircle size={12} /> Verify
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {batchStudents.length === 0 && (
                          <tr><td colSpan={5} className="py-12 text-center text-purple-200/30">No students in this batch.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            }

            {/* C: Requests List */}
            {
              b2bView === 'requests' && (
                <div className="overflow-x-auto">
                  {requestsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader className="animate-spin text-purple-500" size={32} />
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-purple-500/5 border-b border-purple-500/10 text-purple-200/50 uppercase text-xs tracking-wider">
                          <th className="py-4 px-6 font-medium">B2B User</th>
                          <th className="py-4 px-6 font-medium">Requested Plan</th>
                          <th className="py-4 px-6 font-medium">Duration</th>
                          <th className="py-4 px-6 font-medium">Order Type</th>
                          <th className="py-4 px-6 font-medium">Requested Date</th>
                          <th className="py-4 px-6 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10">
                        {requests.map((req) => (
                          <tr key={req.id} className="group hover:bg-purple-500/5 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                                  <Clock size={14} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{req.user_username || req.user_email || `User #${req.user}`}</p>
                                  <p className="text-xs text-purple-200/40">{req.user_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-sm text-purple-100 font-bold">{req.plan_name || "Unknown Plan"}</span>
                                <span className="text-xs text-purple-200/50">${req.amount}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-purple-200/70">
                              {req.plan_duration ? `${req.plan_duration} Days` : "—"}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 text-[10px] font-bold uppercase">
                                {req.order_type === 'B2B_REQUEST' ? 'B2B Request' : req.order_type}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-purple-200/50">
                              {new Date(req.created_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openVerifyModal(req)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all shadow-lg shadow-indigo-500/5"
                                >
                                  <CheckCircle size={14} /> Verify
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all shadow-lg shadow-red-500/5"
                                >
                                  <ThumbsDown size={14} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {requests.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center text-purple-200/30">
                              <div className="flex flex-col items-center gap-3">
                                <CheckCircle size={40} className="text-purple-500/20" />
                                <p>No pending requests.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            }

          </div >
        )}

      </div >

      {/* Verify Modal */}
      {
        verifyModalOpen && requestToVerify && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#13111C] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-purple-500/20 flex justify-between items-center bg-purple-500/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400"><CheckCircle size={20} /></span>
                  Verify Request
                </h3>
                <button onClick={() => setVerifyModalOpen(false)} className="text-purple-200/50 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-200/50">User</span>
                    <span className="text-sm font-bold text-white">{requestToVerify.user_username || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-200/50">Batch</span>
                    <span className="text-sm font-bold text-purple-100">{requestToVerify.batch_name || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-purple-500/10">
                    <span className="text-sm text-purple-200/50">Plan</span>
                    <span className="text-sm font-bold text-emerald-400">{requestToVerify.plan_name || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-200/50">Duration</span>
                    <span className="text-sm font-bold text-white">{requestToVerify.plan_duration || "—"} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-200/50">Request Date</span>
                    <span className="text-xs font-mono text-purple-200/70">
                      {requestToVerify.created_at ? new Date(requestToVerify.created_at).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 text-center">
                  Confirming will activate this subscription immediately.
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setVerifyModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-purple-500/20 text-purple-200/50 hover:bg-purple-500/10 transition-all font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveRequest}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm"
                  >
                    Confirm Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Modal (Only for B2C essentially) */}
      {
        showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#13111C] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-purple-500/20 flex justify-between items-center bg-purple-500/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                  Assign Subscription
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-purple-200/50 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">

                {/* User Selection */}
                <div className="space-y-2 relative" ref={userDropdownRef}>
                  <label className="text-xs font-bold text-purple-200/50 uppercase tracking-widest">Select User (B2C)</label>
                  <div
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-full h-12 px-4 bg-[#0a0a0f] border border-purple-500/20 rounded-xl flex items-center justify-between cursor-pointer hover:border-purple-500/50 transition-colors"
                  >
                    {selectedUser ? (
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-white">{selectedUser.first_name} {selectedUser.last_name}</span>
                        <span className="text-[10px] text-purple-400">{selectedUser.email}</span>
                      </div>
                    ) : (
                      <span className="text-purple-200/30 text-sm">Search user by name or email...</span>
                    )}
                    <ChevronDown size={18} className="text-purple-500/50" />
                  </div>

                  {showUserDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#13111C] border border-purple-500/20 rounded-xl shadow-2xl z-20 max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-purple-500/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500/50 w-4 h-4" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1">
                        {usersLoading ? (
                          <div className="p-4 text-center"><Loader className="animate-spin w-5 h-5 mx-auto text-purple-600" /></div>
                        ) : getFilteredUsers().length > 0 ? (
                          getFilteredUsers().map(user => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDropdown(false);
                              }}
                              className="p-3 hover:bg-purple-500/10 cursor-pointer border-b border-purple-500/10 last:border-0 text-left"
                            >
                              <p className="text-sm font-medium text-white">{user.first_name} {user.last_name} <span className="text-xs text-purple-400">({user.username})</span></p>
                              <p className="text-xs text-purple-200/50">{user.email}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-purple-200/30">No users found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan Selection */}
                <div className="space-y-2 relative" ref={planDropdownRef}>
                  <label className="text-xs font-bold text-purple-200/50 uppercase tracking-widest">Select Plan</label>
                  <div
                    onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                    className="w-full h-12 px-4 bg-[#0a0a0f] border border-purple-500/20 rounded-xl flex items-center justify-between cursor-pointer hover:border-purple-500/50 transition-colors"
                  >
                    {selectedPlan ? (
                      <div className="flex justify-between w-full pr-2 items-center">
                        <span className="text-sm font-medium text-white">{selectedPlan.name}</span>
                        <span className="text-xs font-bold text-emerald-400">${selectedPlan.price}</span>
                      </div>
                    ) : (
                      <span className="text-purple-200/30 text-sm">Choose a plan...</span>
                    )}
                    <ChevronDown size={18} className="text-purple-500/50" />
                  </div>

                  {showPlanDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#13111C] border border-purple-500/20 rounded-xl shadow-2xl z-20 max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-purple-500/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500/50 w-4 h-4" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search plans..."
                            value={planSearch}
                            onChange={(e) => setPlanSearch(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-purple-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1">
                        {plansLoading ? (
                          <div className="p-4 text-center"><Loader className="animate-spin w-5 h-5 mx-auto text-purple-600" /></div>
                        ) : getFilteredPlans().length > 0 ? (
                          getFilteredPlans().map(plan => (
                            <div
                              key={plan.id}
                              onClick={() => {
                                setSelectedPlan(plan);
                                setShowPlanDropdown(false);
                              }}
                              className="p-3 hover:bg-purple-500/10 cursor-pointer border-b border-purple-500/10 last:border-0"
                            >
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-white">{plan.name}</p>
                                <p className="text-sm font-bold text-emerald-400">${plan.price}</p>
                              </div>
                              <p className="text-xs text-purple-200/50">{plan.duration_days} Days • {plan.user_type}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-purple-200/30">No plans found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-200/50 uppercase tracking-widest">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500/50 w-4 h-4" />
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 bg-[#0a0a0f] border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder-purple-200/20"
                    />
                  </div>
                </div>

                {selectedPlan && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-xs text-indigo-300 text-center">
                      Assigning <strong>{selectedPlan.name}</strong> to <strong>{selectedUser?.first_name || 'Selected User'}</strong>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-3 rounded-xl border border-purple-500/20 text-purple-200/50 hover:bg-purple-500/10 hover:text-white transition-all font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSubscription}
                    disabled={createLoading}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/20 text-white transition-all font-bold text-sm disabled:opacity-50"
                  >
                    {createLoading ? "Processing..." : "Confirm Assignment"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default SubscriptionPage;
