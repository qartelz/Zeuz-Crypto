// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Eye, Trash2, CheckCircle, XCircle, X, Plus, Calendar, Search, ChevronDown, Loader } from "lucide-react";
// import toast from "react-hot-toast";

// const baseURL = import.meta.env.VITE_API_BASE_URL;

// const SubscriptionPage = () => {
//   const [subscriptions, setSubscriptions] = useState([]);
//   const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
//   // console.log(filteredSubscriptions,"subscription list")
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [createLoading, setCreateLoading] = useState(false);

//   // Create form fields
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [startDate, setStartDate] = useState('');
  
//   // Lists for dropdowns
//   const [users, setUsers] = useState([]);
//   const [plans, setPlans] = useState([]);
//   const [usersLoading, setUsersLoading] = useState(false);
//   const [plansLoading, setPlansLoading] = useState(false);
  
//   // Search states
//   const [userSearch, setUserSearch] = useState('');
//   const [planSearch, setPlanSearch] = useState('');
//   const [showUserDropdown, setShowUserDropdown] = useState(false);
//   const [showPlanDropdown, setShowPlanDropdown] = useState(false);

//   // Refs for click outside
//   const userDropdownRef = useRef(null);
//   const planDropdownRef = useRef(null);

//   const navigate = useNavigate();
//   const tokens = JSON.parse(localStorage.getItem("authTokens"));

//   // Fetch all subscriptions
//   useEffect(() => {
//     const fetchSubscriptions = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await fetch(
//           `${baseURL}admin/subscriptions/subscriptions/`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${tokens?.access}`,
//             },
//           }
//         );

//         if (response.status === 401) {
//           localStorage.removeItem("authTokens");
//           localStorage.removeItem("user");
//           navigate("/admin-login");
//           return;
//         }

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         const sorted = (data.results || []).sort(
//           (a, b) => new Date(b.created_at) - new Date(a.created_at)
//         );

//         setSubscriptions(sorted);
//         setFilteredSubscriptions(sorted);
//       } catch (err) {
//         setError(err.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubscriptions();
//   }, [navigate, tokens?.access]); // Added dependency

//   // Filter by status
//   useEffect(() => {
//     if (filterStatus === "all") {
//       setFilteredSubscriptions(subscriptions);
//     } else {
//       setFilteredSubscriptions(
//         subscriptions.filter((s) => s.status.toLowerCase() === filterStatus.toLowerCase())
//       );
//     }
//   }, [subscriptions, filterStatus]);

//   // Fetch users and plans when modal opens
//   useEffect(() => {
//     if (showCreateModal) {
//       fetchUsers();
//       fetchPlans();
//     }
//   }, [showCreateModal]);

//   // Click outside to close dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
//         setShowUserDropdown(false);
//       }
//       if (planDropdownRef.current && !planDropdownRef.current.contains(event.target)) {
//         setShowPlanDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Fetch Users
//   const fetchUsers = async () => {
//     setUsersLoading(true);
//     try {
//       const response = await fetch(`${baseURL}account/users/`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokens?.access}`,
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         // Filter only b2b_user and b2c_user roles
//         const filteredUsers = (data.results || []).filter(
//           user => user.role === 'b2b_user' || user.role === 'b2c_user'
//         );
//         setUsers(filteredUsers);
//       }
//     } catch (err) {
//       console.error('Error fetching users:', err);
//     } finally {
//       setUsersLoading(false);
//     }
//   };

//   // Fetch Plans
//   const fetchPlans = async () => {
//     setPlansLoading(true);
//     try {
//       const response = await fetch(`${baseURL}admin/subscriptions/plans/`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokens?.access}`,
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setPlans(data.results || []);
//       }
//     } catch (err) {
//       console.error('Error fetching plans:', err);
//     } finally {
//       setPlansLoading(false);
//     }
//   };

//   // Filter users based on search
//   const filteredUserList = users.filter(user => 
//     (user.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
//     (user.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
//     (user.mobile || '').includes(userSearch)
//   );

//   // Filter plans based on search
//   const filteredPlanList = plans.filter(plan => 
//     (plan.name || '').toLowerCase().includes(planSearch.toLowerCase()) ||
//     (plan.price || '').toString().includes(planSearch) || // Ensure price is a string for .includes
//     (plan.user_type || '').toLowerCase().includes(planSearch.toLowerCase())
//   );

//   // Create Subscription
//   const handleCreateSubscription = async () => {
//     if (!selectedUser || !selectedPlan || !startDate.trim()) {
//       toast.error("All fields are required", { position: "top-right" });
//       return;
//     }

//     setCreateLoading(true);

//     try {
//       const response = await fetch(
//         `${baseURL}admin/subscriptions/subscriptions/`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${tokens?.access}`,
//           },
//           body: JSON.stringify({
//             user_id: selectedUser.id,
//             plan: selectedPlan.id,
//             start_date: startDate,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = data?.plan?.[0] || data?.start_date?.[0] || data?.message || 'Creation failed';
//         throw new Error(errorMessage);
//       }

//       toast.success('Subscription created successfully!', { position: "top-right" });
      
//       closeCreateModal();
      
//       // Refresh the subscription list
//       const refreshResponse = await fetch(
//         `${baseURL}admin/subscriptions/subscriptions/`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${tokens?.access}`,
//           },
//         }
//       );
      
//       if (refreshResponse.ok) {
//         const refreshData = await refreshResponse.json();
//         const sorted = (refreshData.results || []).sort(
//           (a, b) => new Date(b.created_at) - new Date(a.created_at)
//         );
//         setSubscriptions(sorted);
//       }
//     } catch (err) {
//       toast.error(err.message || 'Failed to create subscription', { position: "top-right" });
//     } finally {
//       setCreateLoading(false);
//     }
//   };

//   // Close Create Modal
//   const closeCreateModal = () => {
//     setShowCreateModal(false);
//     setSelectedUser(null);
//     setSelectedPlan(null);
//     setStartDate('');
//     setUserSearch('');
//     setPlanSearch('');
//     setShowUserDropdown(false);
//     setShowPlanDropdown(false);
//   };

//   const handleView = (subscription) => {
//     alert(`View Subscription: ${subscription.plan_name}`);
//   };

//   const handleDelete = (subscription) => {
//     alert(`Delete Subscription: ${subscription.id}`);
//   };

//   // Format date for display
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   // Get status badge
//   const getStatusBadge = (status, isActive) => {
//     if (status === "ACTIVE" && isActive) {
//       return (
//         <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 flex items-center gap-1 w-fit">
//           <CheckCircle size={14} />
//           Active
//         </span>
//       );
//     } else if (status === "ACTIVE" && !isActive) {
//       return (
//         <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 flex items-center gap-1 w-fit">
//           <Calendar size={14} />
//           Scheduled
//         </span>
//       );
//     } else if (status === "CANCELLED") {
//       return (
//         <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 w-fit">
//           <XCircle size={14} />
//           Cancelled
//         </span>
//       );
//     } else if (status === "EXPIRED") {
//       return (
//         <span className="px-3 py-1.5 rounded-full bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30 flex items-center gap-1 w-fit">
//           <XCircle size={14} />
//           Expired
//         </span>
//       );
//     }
//     return (
//       <span className="px-3 py-1.5 rounded-full bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30">
//         {status}
//       </span>
//     );
//   };

//   // Themed modal input class
//   const modalInputClass = "w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all";
//   const modalDateClass = `${modalInputClass} text-purple-300/70`;

//   return (
//     // Removed gradient, inheriting from layout
//     <div className="text-white p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
//   {/* Title Section */}
//   <div className="text-center md:text-left">
//     <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
//       Subscription Management
//     </h1>
//     <p className="text-purple-300/70 text-sm sm:text-base">
//       Manage and monitor user subscriptions
//     </p>
//   </div>

//   {/* Button */}
//   <div className="flex justify-center md:justify-end">
//     <button
//       onClick={() => setShowCreateModal(true)}
//       className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold transition-all shadow-md shadow-purple-600/20 hover:bg-purple-700 flex items-center gap-2 w-full sm:w-auto justify-center"
//     >
//       <Plus size={20} />
//       Create Subscription
//     </button>
//   </div>
// </div>


//         {/* Create Subscription Modal (Themed) */}
//         {showCreateModal && (
//           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">
//             <div className="bg-[#160C26] rounded-lg shadow-2xl border border-purple-500/30 max-w-lg w-full p-6 my-8">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-2xl font-bold text-white">Create Subscription</h2>
//                 <button
//                   onClick={closeCreateModal}
//                   className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors"
//                 >
//                   <X size={20} className="text-purple-300" />
//                 </button>
//               </div>

//               {/* Form */}
//               <div className="space-y-5 mb-6">
//                 {/* User Selection */}
//                 <div ref={userDropdownRef}>
//                   <label className="block text-purple-300/80 text-sm font-medium mb-2">
//                     Select User *
//                   </label>
//                   <div className="relative">
//                     <div 
//                       className={`${modalInputClass} flex items-center justify-between cursor-pointer hover:bg-black/30`}
//                       onClick={() => setShowUserDropdown(!showUserDropdown)}
//                     >
//                       {selectedUser ? (
//                         <div className="flex-1">
//                           <div className="font-medium">{selectedUser.full_name}</div>
//                           <div className="text-xs text-purple-300/60">{selectedUser.email}</div>
//                         </div>
//                       ) : (
//                         <span className="text-purple-300/50">Choose a user...</span>
//                       )}
//                       <ChevronDown size={20} className={`text-purple-300/60 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
//                     </div>

//                     {showUserDropdown && (
//                       <div className="absolute z-10 w-full mt-2 bg-[#1E1234] border border-purple-500/30 rounded-lg shadow-2xl max-h-64 overflow-hidden flex flex-col">
//                         <div className="p-3 border-b border-purple-500/20 sticky top-0 bg-[#1E1234]">
//                           <div className="relative">
//                             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/50" />
//                             <input
//                               type="text"
//                               value={userSearch}
//                               onChange={(e) => setUserSearch(e.target.value)}
//                               placeholder="Search by name, email, or mobile..."
//                               className="w-full pl-10 pr-4 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
//                               onClick={(e) => e.stopPropagation()}
//                             />
//                           </div>
//                         </div>
//                         <div className="overflow-y-auto max-h-48">
//                           {usersLoading ? (
//                             <div className="p-4 text-center text-purple-300/60">Loading users...</div>
//                           ) : filteredUserList.length > 0 ? (
//                             filteredUserList.map(user => (
//                               <div
//                                 key={user.id}
//                                 onClick={() => {
//                                   setSelectedUser(user);
//                                   setShowUserDropdown(false);
//                                   setUserSearch('');
//                                 }}
//                                 className="p-3 hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-purple-500/10"
//                               >
//                                 <div className="font-medium text-white">{user.full_name}</div>
//                                 <div className="text-xs text-purple-300/60 mt-0.5">{user.email}</div>
//                                 <div className="flex items-center gap-3 mt-1">
//                                   <span className="text-xs text-purple-300/50">{user.mobile}</span>
//                                   <span className={`text-xs px-2 py-0.5 rounded ${
//                                     user.role === 'b2b_user' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
//                                   }`}>
//                                     {user.role === 'b2b_user' ? 'B2B User' : 'B2C User'}
//                                   </span>
//                                 </div>
//                               </div>
//                             ))
//                           ) : (
//                             <div className="p-4 text-center text-purple-300/60">No users found</div>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Plan Selection */}
//                 <div ref={planDropdownRef}>
//                   <label className="block text-purple-300/80 text-sm font-medium mb-2">
//                     Select Plan *
//                   </label>
//                   <div className="relative">
//                     <div 
//                       className={`${modalInputClass} flex items-center justify-between cursor-pointer hover:bg-black/30`}
//                       onClick={() => setShowPlanDropdown(!showPlanDropdown)}
//                     >
//                       {selectedPlan ? (
//                         <div className="flex-1">
//                           <div className="font-medium">{selectedPlan.name}</div>
//                           <div className="text-xs text-purple-300/60">
//                             ${selectedPlan.price} • {selectedPlan.duration_days} days • {selectedPlan.user_type}
//                           </div>
//                         </div>
//                       ) : (
//                         <span className="text-purple-300/50">Choose a plan...</span>
//                       )}
//                       <ChevronDown size={20} className={`text-purple-300/60 transition-transform ${showPlanDropdown ? 'rotate-180' : ''}`} />
//                     </div>

//                     {showPlanDropdown && (
//                       <div className="absolute z-10 w-full mt-2 bg-[#1E1234] border border-purple-500/30 rounded-lg shadow-2xl max-h-64 overflow-hidden flex flex-col">
//                         <div className="p-3 border-b border-purple-500/20 sticky top-0 bg-[#1E1234]">
//                           <div className="relative">
//                             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/50" />
//                             <input
//                               type="text"
//                               value={planSearch}
//                               onChange={(e) => setPlanSearch(e.target.value)}
//                               placeholder="Search by name, price, or type..."
//                               className="w-full pl-10 pr-4 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
//                               onClick={(e) => e.stopPropagation()}
//                             />
//                           </div>
//                         </div>
//                         <div className="overflow-y-auto max-h-48">
//                           {plansLoading ? (
//                             <div className="p-4 text-center text-purple-300/60">Loading plans...</div>
//                           ) : filteredPlanList.length > 0 ? (
//                             filteredPlanList.map(plan => (
//                               <div
//                                 key={plan.id}
//                                 onClick={() => {
//                                   setSelectedPlan(plan);
//                                   setShowPlanDropdown(false);
//                                   setPlanSearch('');
//                                 }}
//                                 className="p-3 hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-purple-500/10"
//                               >
//                                 <div className="flex items-start justify-between">
//                                   <div className="flex-1">
//                                     <div className="font-medium text-white">{plan.name}</div>
//                                     <div className="text-xs text-purple-300/60 mt-0.5 line-clamp-1">{plan.description}</div>
//                                   </div>
//                                   <div className="text-right ml-3">
//                                     <div className="font-bold text-green-400">${plan.price}</div>
//                                     <div className="text-xs text-purple-300/50">{plan.duration_days}d</div>
//                                   </div>
//                                 </div>
//                                 <div className="flex items-center gap-2 mt-2">
//                                   <span className={`text-xs px-2 py-0.5 rounded ${
//                                     plan.user_type === 'B2B' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
//                                   }`}>
//                                     {plan.user_type}
//                                   </span>
//                                   {plan.is_active && (
//                                     <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300">
//                                       Active
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>
//                             ))
//                           ) : (
//                             <div className="p-4 text-center text-purple-300/60">No plans found</div>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Start Date */}
//                 <div>
//                   <label className="block text-purple-300/80 text-sm font-medium mb-2">
//                     Start Date *
//                   </label>
//                   <input
//                     type="datetime-local"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                     className={`${modalDateClass} ${!startDate ? 'text-purple-300/50' : 'text-white'}`}
//                   />
//                   <p className="text-purple-300/50 text-xs mt-1.5">Select the subscription start date and time</p>
//                 </div>

//                 {/* Summary Card */}
//                 {selectedUser && selectedPlan && (
//                   <div className="mt-4 p-4 bg-black/20 border border-purple-500/20 rounded-lg">
//                     <div className="text-sm text-purple-300/70 mb-2 font-medium">Summary</div>
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-purple-300/60">User:</span>
//                         <span className="text-white font-medium">{selectedUser.full_name}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-purple-300/60">Plan:</span>
//                         <span className="text-white font-medium">{selectedPlan.name}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-purple-300/60">Duration:</span>
//                         <span className="text-white font-medium">{selectedPlan.duration_days} days</span>
//                       </div>
//                       <div className="flex justify-between pt-2 border-t border-purple-500/20">
//                         <span className="text-purple-300/60">Price:</span>
//                         <span className="text-green-400 font-bold text-lg">${selectedPlan.price}</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Actions */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={closeCreateModal}
//                   className="flex-1 px-4 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-white font-medium transition-all border border-purple-500/30"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCreateSubscription}
//                   disabled={createLoading || !selectedUser || !selectedPlan || !startDate}
//                   className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {createLoading ? 'Creating...' : 'Create Subscription'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Filter Tabs */}
//         <div className="mb-6 border-b border-purple-500/20">
//           <div className="flex flex-wrap gap-4">
//             {["all", "active", "cancelled", "expired"].map((status) => (
//               <button
//                 key={status}
//                 onClick={() => setFilterStatus(status)}
//                 className={`px-3 py-2 font-semibold transition-all text-sm ${
//                   filterStatus === status
//                     ? "text-white border-b-2 border-purple-500"
//                     : "text-purple-300/70 hover:text-white"
//                 }`}
//               >
//                 {status.charAt(0).toUpperCase() + status.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="text-center py-12">
//             <Loader size={40} className="inline-block animate-spin text-purple-400" />
//             <p className="text-purple-300/70 mt-4 text-lg font-medium">Loading subscriptions...</p>
//           </div>
//         )}

//         {/* Error */}
//         {error && (
//           <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg mb-6">
//             Error: {error}
//           </div>
//         )}

//         {/* Table */}
//         {!loading && !error && (
//           <div className="bg-[#160C26] border border-purple-500/20 rounded-lg shadow-lg overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-purple-500/20">
//                 <thead className="bg-purple-500/10">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
//                       Plan Name
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
//                       Start Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
//                       End Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
//                       Price
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
//                       Days Remaining
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-purple-500/20">
//                   {filteredSubscriptions.length > 0 ? (
//                     filteredSubscriptions.map((subscription) => (
//                       <tr
//                         key={subscription.id}
//                         className="hover:bg-purple-500/5 transition-colors"
//                       >
//                         <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
//                           {subscription.plan_name}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-purple-300/80">
//                           {formatDate(subscription.start_date)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-purple-300/80">
//                           {formatDate(subscription.end_date)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {getStatusBadge(subscription.status, subscription.is_currently_active)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex flex-col">
//                             <span className="font-semibold text-white">${subscription.final_price}</span>
//                             {subscription.discount_amount !== "0.00" && (
//                               <span className="text-xs text-purple-300/60 line-through">
//                                 ${subscription.original_price}
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`font-medium ${
//                             subscription.days_remaining < 7 
//                               ? 'text-red-300' 
//                               : subscription.days_remaining < 30 
//                               ? 'text-yellow-300' 
//                               : 'text-green-300'
//                           }`}>
//                             {subscription.days_remaining} days
//                           </span>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={6}
//                         className="px-6 py-16 text-center text-purple-300/70 text-lg"
//                       >
//                         No subscriptions found for this status.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SubscriptionPage;


import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle, XCircle, X, Plus, Calendar, Search, ChevronDown, ChevronUp, Loader } from "lucide-react";
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
  const [expandedRows, setExpandedRows] = useState(new Set()); // Track expanded rows

  // Create form fields
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [startDate, setStartDate] = useState('');
  
  // Lists for dropdowns
  const [users, setUsers] = useState([]);
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

  // Toggle row expansion
  const toggleRowExpansion = (subscriptionId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subscriptionId)) {
        newSet.delete(subscriptionId);
      } else {
        newSet.add(subscriptionId);
      }
      return newSet;
    });
  };

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
  }, [navigate, tokens?.access]);

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
  const filteredUserList = users.filter(user => 
    (user.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.mobile || '').includes(userSearch)
  );

  // Filter plans based on search
  const filteredPlanList = plans.filter(plan => 
    (plan.name || '').toLowerCase().includes(planSearch.toLowerCase()) ||
    (plan.price || '').toString().includes(planSearch) ||
    (plan.user_type || '').toLowerCase().includes(planSearch.toLowerCase())
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status, isActive) => {
    if (status === "ACTIVE" && isActive) {
      return (
        <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 flex items-center gap-1 w-fit">
          <CheckCircle size={14} />
          Active
        </span>
      );
    } else if (status === "ACTIVE" && !isActive) {
      return (
        <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 flex items-center gap-1 w-fit">
          <Calendar size={14} />
          Scheduled
        </span>
      );
    } else if (status === "CANCELLED") {
      return (
        <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 w-fit">
          <XCircle size={14} />
          Cancelled
        </span>
      );
    } else if (status === "EXPIRED") {
      return (
        <span className="px-3 py-1.5 rounded-full bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30 flex items-center gap-1 w-fit">
          <XCircle size={14} />
          Expired
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-full bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30">
        {status}
      </span>
    );
  };

  // Get user full name
  const getUserFullName = (user) => {
    if (!user) return "N/A";
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || "N/A";
  };

  const modalInputClass = "w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all";
  const modalDateClass = `${modalInputClass} text-purple-300/70`;

  return (
    <div className="text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
              Subscription Management
            </h1>
            <p className="text-purple-300/70 text-sm sm:text-base">
              Manage and monitor user subscriptions
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold transition-all shadow-md shadow-purple-600/20 hover:bg-purple-700 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Plus size={20} />
              Create Subscription
            </button>
          </div>
        </div>

        {/* Create Subscription Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">
            <div className="bg-[#160C26] rounded-lg shadow-2xl border border-purple-500/30 max-w-lg w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Subscription</h2>
                <button
                  onClick={closeCreateModal}
                  className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors"
                >
                  <X size={20} className="text-purple-300" />
                </button>
              </div>

              <div className="space-y-5 mb-6">
                {/* User Selection */}
                <div ref={userDropdownRef}>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Select User *
                  </label>
                  <div className="relative">
                    <div 
                      className={`${modalInputClass} flex items-center justify-between cursor-pointer hover:bg-black/30`}
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      {selectedUser ? (
                        <div className="flex-1">
                          <div className="font-medium">{selectedUser.full_name}</div>
                          <div className="text-xs text-purple-300/60">{selectedUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-purple-300/50">Choose a user...</span>
                      )}
                      <ChevronDown size={20} className={`text-purple-300/60 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#1E1234] border border-purple-500/30 rounded-lg shadow-2xl max-h-64 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-purple-500/20 sticky top-0 bg-[#1E1234]">
                          <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/50" />
                            <input
                              type="text"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search by name, email, or mobile..."
                              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {usersLoading ? (
                            <div className="p-4 text-center text-purple-300/60">Loading users...</div>
                          ) : filteredUserList.length > 0 ? (
                            filteredUserList.map(user => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDropdown(false);
                                  setUserSearch('');
                                }}
                                className="p-3 hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-purple-500/10"
                              >
                                <div className="font-medium text-white">{user.full_name}</div>
                                <div className="text-xs text-purple-300/60 mt-0.5">{user.email}</div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-purple-300/50">{user.mobile}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    user.role === 'b2b_user' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {user.role === 'b2b_user' ? 'B2B User' : 'B2C User'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-purple-300/60">No users found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Selection */}
                <div ref={planDropdownRef}>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Select Plan *
                  </label>
                  <div className="relative">
                    <div 
                      className={`${modalInputClass} flex items-center justify-between cursor-pointer hover:bg-black/30`}
                      onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                    >
                      {selectedPlan ? (
                        <div className="flex-1">
                          <div className="font-medium">{selectedPlan.name}</div>
                          <div className="text-xs text-purple-300/60">
                            ${selectedPlan.price} • {selectedPlan.duration_days} days • {selectedPlan.user_type}
                          </div>
                        </div>
                      ) : (
                        <span className="text-purple-300/50">Choose a plan...</span>
                      )}
                      <ChevronDown size={20} className={`text-purple-300/60 transition-transform ${showPlanDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showPlanDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#1E1234] border border-purple-500/30 rounded-lg shadow-2xl max-h-64 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-purple-500/20 sticky top-0 bg-[#1E1234]">
                          <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/50" />
                            <input
                              type="text"
                              value={planSearch}
                              onChange={(e) => setPlanSearch(e.target.value)}
                              placeholder="Search by name, price, or type..."
                              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {plansLoading ? (
                            <div className="p-4 text-center text-purple-300/60">Loading plans...</div>
                          ) : filteredPlanList.length > 0 ? (
                            filteredPlanList.map(plan => (
                              <div
                                key={plan.id}
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setShowPlanDropdown(false);
                                  setPlanSearch('');
                                }}
                                className="p-3 hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-purple-500/10"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-white">{plan.name}</div>
                                    <div className="text-xs text-purple-300/60 mt-0.5 line-clamp-1">{plan.description}</div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className="font-bold text-green-400">${plan.price}</div>
                                    <div className="text-xs text-purple-300/50">{plan.duration_days}d</div>
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
                            <div className="p-4 text-center text-purple-300/60">No plans found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${modalDateClass} ${!startDate ? 'text-purple-300/50' : 'text-white'}`}
                  />
                  <p className="text-purple-300/50 text-xs mt-1.5">Select the subscription start date and time</p>
                </div>

                {/* Summary Card */}
                {selectedUser && selectedPlan && (
                  <div className="mt-4 p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                    <div className="text-sm text-purple-300/70 mb-2 font-medium">Summary</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-300/60">User:</span>
                        <span className="text-white font-medium">{selectedUser.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300/60">Plan:</span>
                        <span className="text-white font-medium">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300/60">Duration:</span>
                        <span className="text-white font-medium">{selectedPlan.duration_days} days</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-purple-500/20">
                        <span className="text-purple-300/60">Price:</span>
                        <span className="text-green-400 font-bold text-lg">${selectedPlan.price}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-white font-medium transition-all border border-purple-500/30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubscription}
                  disabled={createLoading || !selectedUser || !selectedPlan || !startDate}
                  className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-purple-500/20">
          <div className="flex flex-wrap gap-4">
            {["all", "active", "cancelled", "expired"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 font-semibold transition-all text-sm ${
                  filterStatus === status
                    ? "text-white border-b-2 border-purple-500"
                    : "text-purple-300/70 hover:text-white"
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
            <Loader size={40} className="inline-block animate-spin text-purple-400" />
            <p className="text-purple-300/70 mt-4 text-lg font-medium">Loading subscriptions...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-[#160C26] border border-purple-500/20 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-purple-500/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider w-12">
                      
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Plan Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Days Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.length > 0 ? (
                    filteredSubscriptions.map((subscription) => {
                      const isExpanded = expandedRows.has(subscription.id);
                      return (
                        <React.Fragment key={subscription.id}>
                          {/* Main Row */}
                          <tr className="border-b border-purple-500/20 hover:bg-purple-500/5 transition-colors">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleRowExpansion(subscription.id)}
                                className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp size={18} className="text-purple-300" />
                                ) : (
                                  <ChevronDown size={18} className="text-purple-300" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                              {getUserFullName(subscription.user)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-purple-300/80">
                              {subscription.user?.email || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                              {subscription.plan_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(subscription.status, subscription.is_currently_active)}
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
                          
                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-purple-500/5 border-b border-purple-500/20">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/20">
                                  <div className="space-y-3">
                                    <div className="flex items-start">
                                      <span className="text-purple-300/60 text-sm font-medium min-w-[140px]">Subscription ID:</span>
                                      <span className="text-white text-sm font-mono break-all">{subscription.id}</span>
                                    </div>
                                    <div className="flex items-start">
                                      <span className="text-purple-300/60 text-sm font-medium min-w-[140px]">User ID:</span>
                                      <span className="text-white text-sm font-mono break-all">{subscription.user?.id || "N/A"}</span>
                                    </div>
                                    <div className="flex items-start">
                                      <span className="text-purple-300/60 text-sm font-medium min-w-[140px]">Start Date:</span>
                                      <span className="text-white text-sm">{formatDate(subscription.start_date)}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-start">
                                      <span className="text-purple-300/60 text-sm font-medium min-w-[140px]">End Date:</span>
                                      <span className="text-white text-sm">{formatDate(subscription.end_date)}</span>
                                    </div>
                                    <div className="flex items-start">
                                      <span className="text-purple-300/60 text-sm font-medium min-w-[140px]">Price:</span>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-green-400 text-sm">${subscription.final_price}</span>
                                        {subscription.discount_amount !== "0.00" && (
                                          <span className="text-xs text-purple-300/60 line-through">
                                            ${subscription.original_price}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-start">
                                      <span className="text-purple-300/60 text-sm font-medium min-w-[140px]">Created At:</span>
                                      <span className="text-white text-sm">{formatDate(subscription.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-purple-300/70 text-lg"
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


