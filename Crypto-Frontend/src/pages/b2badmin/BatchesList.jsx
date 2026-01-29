import React, { useEffect, useState } from "react";
import {
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  Search,
  Users,
  Box,
  MoreVertical,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const baseURL = import.meta.env.VITE_API_BASE_URL;


const BatchesList = () => {
  const [batches, setBatches] = useState([]);

  console.log(batches,"the batches")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    name: "",
    description: "",
    max_users: "",
  });
  const [creating, setCreating] = useState(false);
  const [createResponse, setCreateResponse] = useState(null);

  const [viewingBatch, setViewingBatch] = useState(null);
  const [batchUsers, setBatchUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    mobile: "",
    password: "",
  });

  console.log(userForm,"the  user form")
  const [userFormResponse, setUserFormResponse] = useState(null);
  const [addingUser, setAddingUser] = useState(false);

  const [showAddUserForm, setShowAddUserForm] = useState(false);

 
  const navigate = useNavigate();

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const res = await fetch(`${baseURL}account/batch/list/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });
  
      if (res.status === 401) {
        localStorage.clear();
        navigate("/b2badmin-login");
        return;
      }
  
      const data = await res.json();
      console.log("📦 Batch List Response:", data);
  
      setBatches(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    
    fetchBatches();
  }, [navigate]);

  const handleToggleActive = (batchId) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId ? { ...b, is_active: !b.is_active } : b
      )
    );
  };

  const handleCreateBatch = async () => {
    setCreating(true);
    setCreateResponse(null);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const res = await fetch(`${baseURL}account/batch/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({
          ...newBatch,
          max_users: parseInt(newBatch.max_users),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create batch");
      }

      setBatches((prev) => [...prev, data]);
      setCreateResponse(data);
      setNewBatch({ name: "", description: "", max_users: "" });
      // Close modal on success if desired, or let user close it. Keeping as is.
    } catch (err) {
      setCreateResponse({ error: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleView = async (batch) => {
    setViewingBatch(batch);
    setUserFormResponse(null);
    setShowAddUserForm(false);
    setUserForm({
      email: "",
      first_name: "",
      last_name: "",
      mobile: "",
      password: "",
    });

    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const res = await fetch(
        `${baseURL}account/batch/users/${batch.id}/`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );
      const data = await res.json();
      setBatchUsers(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (batch) => {
    // Keeping original logic (just alert)
    alert(`Delete Batch: ${batch.name}`);
  };

  const handleAddUserToBatch = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    setUserFormResponse(null);

    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const res = await fetch(`${baseURL}account/b2b-user/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({
          ...userForm,
          batch_id: viewingBatch.id,
          send_email: true,
        }),
        
      });

      const data = await res.json();

      console.log(data,"the data from the create b2b user")

      if (!res.ok) {
        throw new Error(data.detail || "Failed to add user");
      }

      setBatchUsers((prev) => [...prev, data]);
      setUserFormResponse({ success: "User added successfully" });
      setUserForm({
        email: "",
        first_name: "",
        last_name: "",
        mobile: "",
        password: "",
      });

      // Refresh batch users and main batch list after 2 seconds
      setTimeout(() => {
        if (viewingBatch) {
          handleView(viewingBatch);
        }
        fetchBatches();
      }, 2000);

    } catch (err) {
      setUserFormResponse({ error: err.message });
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Batch Management</h1>
          <p className="text-slate-400 mt-1 text-sm">Create, monitor, and manage your B2B user batches.</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-black transition-all duration-300 bg-white rounded-lg hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#050505] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/20">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search batches..." 
                    className="w-full bg-[#0a0a0a] border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
                />
            </div>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800">
                <Filter className="w-4 h-4" />
            </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
             </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-400">
               <span className="bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">Error: {error}</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/30 border-b border-zinc-800">
                  <th className="py-4 px-6 text-xs text-zinc-500 uppercase tracking-wider font-medium">Batch Name</th>
                  <th className="py-4 px-6 text-xs text-zinc-500 uppercase tracking-wider font-medium">Description</th>
                  <th className="py-4 px-6 text-xs text-zinc-500 uppercase tracking-wider font-medium">Capacity</th>
                  <th className="py-4 px-6 text-xs text-zinc-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="py-4 px-6 text-xs text-zinc-500 uppercase tracking-wider font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="group hover:bg-zinc-900/40 transition-colors duration-200"
                  >
                    <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                                <Box size={18} />
                            </div>
                            <div>
                                <p className="font-medium text-white">{batch.name}</p>
                                <p className="text-xs text-zinc-500">ID: {batch.id}</p>
                            </div>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <p className="text-sm text-zinc-400 max-w-xs truncate">{batch.description || "No description provided"}</p>
                    </td>
                    <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                             <div className="w-full max-w-[100px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-zinc-400 rounded-full" 
                                    style={{ width: `${(batch.user_count / batch.max_users) * 100}%` }}
                                />
                             </div>
                             <span className="text-xs text-zinc-500 whitespace-nowrap">{batch.user_count} / {batch.max_users}</span>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(batch.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            batch.is_active 
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/20' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800'
                        }`}
                        title="Toggle Status"
                      >
                         <span className={`w-1.5 h-1.5 rounded-full ${batch.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                         {batch.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(batch)}
                          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(batch)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                          title="Delete Batch"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-500 flex flex-col items-center justify-center">
                        <Box size={48} className="text-zinc-800 mb-4" />
                        <p className="text-lg font-medium text-zinc-400">No batches found</p>
                        <p className="text-sm">Get started by creating a new batch.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal - Dark Themed */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#131129] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            <h3 className="text-xl font-bold text-white mb-1">Create New Batch</h3>
            <p className="text-gray-400 text-sm mb-6">Set up a new group for your users.</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Batch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Trading Group"
                  value={newBatch.name}
                  onChange={(e) =>
                    setNewBatch((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full h-11 px-4 bg-[#0B0B15] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Add a brief description..."
                  rows={3}
                  value={newBatch.description}
                  onChange={(e) =>
                    setNewBatch((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-4 bg-[#0B0B15] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Max Users</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newBatch.max_users}
                  onChange={(e) =>
                    setNewBatch((prev) => ({ ...prev, max_users: e.target.value }))
                  }
                  className="w-full h-11 px-4 bg-[#0B0B15] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>

              {createResponse?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {createResponse.error}
                </div>
              )}
              {createResponse?.id && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                   Batch <strong>{createResponse.name}</strong> created successfully!
                </div>
              )}

              <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBatch}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Batch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - Dark Themed */}
      {viewingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           {/* Modal Container */}
          <div className="w-full max-w-4xl bg-[#131129] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
               <div>
                   <div className="flex items-center gap-3 mb-1">
                       <h3 className="text-2xl font-bold text-white">{viewingBatch.name}</h3>
                       <span className={`px-2 py-0.5 rounded text-xs border ${viewingBatch.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-700/30 text-gray-400 border-gray-600/30'}`}>
                           {viewingBatch.is_active ? 'Active' : 'Inactive'}
                       </span>
                   </div>
                   <p className="text-gray-400 text-sm">{viewingBatch.description || "No description available."}</p>
               </div>
               <button
                  onClick={() => setViewingBatch(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0B0B15] p-4 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-xs uppercase font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-white mt-1">{viewingBatch.user_count}</p>
                    </div>
                    <div className="bg-[#0B0B15] p-4 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-xs uppercase font-medium">Batch ID</p>
                        <p className="text-2xl font-bold text-white mt-1">#{viewingBatch.id}</p>
                    </div>
                    <div className="bg-[#0B0B15] p-4 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-xs uppercase font-medium">Capacity</p>
                        <p className="text-2xl font-bold text-white mt-1">{viewingBatch.max_users}</p>
                    </div>
                </div>

                {/* Users Section */}
                <div className="flex justify-between items-center mb-4">
                     <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users size={18} className="text-indigo-400"/>
                        User List
                     </h4>
                     <button
                        onClick={() => setShowAddUserForm((prev) => !prev)}
                        className={`text-sm px-4 py-2 rounded-lg transition-colors border ${
                            showAddUserForm 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                            : 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20 hover:bg-indigo-600/20'
                        }`}
                     >
                       {showAddUserForm ? "Cancel Adding" : "Add New User"}
                     </button>
                </div>

                <div className="space-y-4">
                    {/* Add User Form - Collapsible */}
                    {showAddUserForm ? (
                         <div className="bg-[#0B0B15] border border-indigo-500/20 rounded-xl p-6 animate-in slide-in-from-top-4 duration-300">
                             <h4 className="font-medium text-white mb-4">Register New User</h4>
                             <form onSubmit={handleAddUserToBatch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={userForm.first_name}
                                            onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                            className="w-full h-10 px-3 bg-[#131129] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={userForm.last_name}
                                            onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                            className="w-full h-10 px-3 bg-[#131129] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={userForm.email}
                                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                            className="w-full h-10 px-3 bg-[#131129] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Mobile Number</label>
                                        <input
                                            type="text"
                                            value={userForm.mobile}
                                            onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                                            className="w-full h-10 px-3 bg-[#131129] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs text-gray-500">Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={userForm.password}
                                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                            className="w-full h-10 px-3 bg-[#131129] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {userFormResponse?.error && <p className="text-red-400 text-sm mt-2">{userFormResponse.error}</p>}
                                {userFormResponse?.success && <p className="text-emerald-400 text-sm mt-2">{userFormResponse.success}</p>}

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={addingUser}
                                        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
                                    >
                                        {addingUser ? "Registering..." : "Register User"}
                                    </button>
                                </div>
                             </form>
                         </div>
                    ) : (
                        <div className="bg-[#0B0B15] border border-white/5 rounded-xl overflow-hidden">
                             {batchUsers.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.02]">
                                        <tr>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {batchUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/[0.02]">
                                                <td className="py-3 px-4 text-sm text-gray-300">{u.email}</td>
                                                <td className="py-3 px-4 text-sm text-gray-400 capitalize">{u.role}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             ) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500 text-sm">No users found in this batch yet.</p>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesList;
