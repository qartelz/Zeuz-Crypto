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

  console.log(batches, "the batches")
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

  console.log(userForm, "the  user form")
  const [userFormResponse, setUserFormResponse] = useState(null);
  const [addingUser, setAddingUser] = useState(false);

  const [showAddUserForm, setShowAddUserForm] = useState(false);


  const [studentSearch, setStudentSearch] = useState("");
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
    setStudentSearch(""); // Reset search when viewing new batch
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

      console.log(data, "the data from the create b2b user")

      if (!res.ok) {
        let errorMessage = data.detail || JSON.stringify(data);
        if (!data.detail && typeof data === "object") {
          const firstValue = Object.values(data)[0];
          if (Array.isArray(firstValue) && firstValue.length > 0) {
            errorMessage = firstValue[0];
          }
        }
        throw new Error(errorMessage);
      }

      setUserFormResponse({ success: "User added successfully" });
      setUserForm({
        email: "",
        first_name: "",
        last_name: "",
        mobile: "",
        password: "",
      });

      // Refresh batch users and main batch list immediately
      setTimeout(() => {
        if (viewingBatch) {
          handleView(viewingBatch);
        }
        fetchBatches();
      }, 500);

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
      <div className="  overflow-hidden shadow-2xl">

        {/* Toolbar */}
        <div className="p-4  flex items-center justify-between gap-4 ">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search batches..."
              className="w-full  border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
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
                <tr className=" border-b border-zinc-800">
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${batch.is_active
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Create New Batch</h3>
                <p className="text-zinc-500 text-sm">Set up a new focus group for trading batches.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Batch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Trading Group"
                  value={newBatch.name}
                  onChange={(e) =>
                    setNewBatch((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full h-12 px-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:border-white focus:ring-1 focus:ring-white transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Description</label>
                <textarea
                  placeholder="Add a brief description..."
                  rows={3}
                  value={newBatch.description}
                  onChange={(e) =>
                    setNewBatch((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:border-white focus:ring-1 focus:ring-white transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Max Users</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newBatch.max_users}
                  onChange={(e) =>
                    setNewBatch((prev) => ({ ...prev, max_users: e.target.value }))
                  }
                  className="w-full h-12 px-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:border-white focus:ring-1 focus:ring-white transition-all outline-none"
                />
              </div>

              {createResponse?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {createResponse.error}
                </div>
              )}
              {createResponse?.id && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Batch <strong>{createResponse.name}</strong> created successfully!
                </div>
              )}

              <div className="flex gap-4 mt-8 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBatch}
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/5 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          {/* Modal Container */}
          <div className="w-full max-w-5xl bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Box className="text-white w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{viewingBatch.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${viewingBatch.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                      {viewingBatch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm mt-1 max-w-xl truncate">{viewingBatch.description || "No description available"}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingBatch(null)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">

              {/* Tabs */}
              <div className="flex border-b border-zinc-800 bg-zinc-900/10 px-6">
                <button
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${!showAddUserForm ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => setShowAddUserForm(false)}
                >
                  Overview & Students
                </button>
                <button
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${showAddUserForm ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => setShowAddUserForm(true)}
                >
                  Add New Student
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {!showAddUserForm ? (
                  <div className="space-y-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-zinc-800/50 rounded-lg text-zinc-400">
                            <Users size={18} />
                          </div>
                          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Total Students</p>
                        </div>
                        <p className="text-3xl font-bold text-white ml-1">{viewingBatch.user_count}</p>
                      </div>
                      <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-zinc-800/50 rounded-lg text-zinc-400">
                            <Box size={18} />
                          </div>
                          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Capacity</p>
                        </div>
                        <div className="flex items-end gap-2 ml-1">
                          <p className="text-3xl font-bold text-white">{viewingBatch.max_users}</p>
                          <span className="text-sm text-zinc-500 mb-1.5">seats total</span>
                        </div>
                      </div>
                      {/* <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-zinc-800/50 rounded-lg text-zinc-400">
                            <ToggleLeft size={18} />
                          </div>
                          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">ID Reference</p>
                        </div>
                        <p className="text-lg font-mono font-medium text-zinc-400 ml-1 truncate">#{viewingBatch.id}</p>
                      </div> */}
                    </div>

                    <div>
                      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h4 className="text-lg font-bold text-white">Registered Students</h4>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Search students..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="w-full md:w-64 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-zinc-700 transition-colors"
                            />
                          </div>
                          <button
                            onClick={() => setShowAddUserForm(true)}
                            className="text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors whitespace-nowrap"
                          >
                            + Add Student
                          </button>
                        </div>
                      </div>

                      <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden">
                        {batchUsers.length > 0 ? (
                          (() => {
                            const filteredUsers = batchUsers.filter(u =>
                              (u.first_name + " " + u.last_name).toLowerCase().includes(studentSearch.toLowerCase()) ||
                              u.email.toLowerCase().includes(studentSearch.toLowerCase())
                            );

                            return filteredUsers.length > 0 ? (
                              <table className="w-full text-left">
                                <thead className="bg-zinc-900/50">
                                  <tr>
                                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Student Name & Email</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Mobile</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                  {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                                      <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                            {u.first_name ? u.first_name[0] : (u.email?.[0] || "?")}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-white">{u.first_name} {u.last_name}</p>
                                            <p className="text-xs text-zinc-500">{u.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-sm text-zinc-400">
                                        {u.mobile || "N/A"}
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                          {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6 text-right">
                                        <button
                                          onClick={() => navigate(`/b2b/batches/student/${u.id}`)}
                                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-white text-zinc-400 hover:text-black text-xs font-semibold transition-all"
                                        >
                                          View Profile
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                  <Search size={24} className="text-zinc-600" />
                                </div>
                                <h4 className="text-white font-medium mb-1">No matching students</h4>
                                <p className="text-zinc-500 text-sm mb-4">No students found for "{studentSearch}"</p>
                                <button
                                  onClick={() => setStudentSearch("")}
                                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                >
                                  Clear Search
                                </button>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                              <Users size={24} className="text-zinc-600" />
                            </div>
                            <h4 className="text-white font-medium mb-1">No students yet</h4>
                            <p className="text-zinc-500 text-sm mb-4">This batch is currently empty.</p>
                            <button
                              onClick={() => setShowAddUserForm(true)}
                              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                            >
                              Register first student
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className=" mx-auto">
                    <div className="mb-6">
                      {/* <button
                        onClick={() => setShowAddUserForm(false)}
                        className="text-zinc-500 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
                      >
                        ← Back to list
                      </button> */}
                      <h4 className="text-2xl font-bold text-white mb-2">Register New Student</h4>
                      <p className="text-zinc-400 text-sm">Create a new user account and assign them to this batch immediately.</p>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
                      <form onSubmit={handleAddUserToBatch} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">First Name</label>
                            <input
                              type="text"
                              required
                              value={userForm.first_name}
                              onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                              className="w-full h-11 px-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-white text-sm focus:border-white outline-none transition-all"
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Last Name</label>
                            <input
                              type="text"
                              required
                              value={userForm.last_name}
                              onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                              className="w-full h-11 px-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-white text-sm focus:border-white outline-none transition-all"
                              placeholder="Doe"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                            <input
                              type="email"
                              required
                              value={userForm.email}
                              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                              className="w-full h-11 px-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-white text-sm focus:border-white outline-none transition-all"
                              placeholder="student@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mobile Number</label>
                            <input
                              type="text"
                              value={userForm.mobile}
                              onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                              className="w-full h-11 px-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-white text-sm focus:border-white outline-none transition-all"
                              placeholder="+1 234 567 890"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                            <input
                              type="password"
                              required
                              value={userForm.password}
                              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                              className="w-full h-11 px-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-white text-sm focus:border-white outline-none transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        {userFormResponse?.error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm">
                            {userFormResponse.error}
                          </div>
                        )}
                        {userFormResponse?.success && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-sm">
                            {userFormResponse.success}
                          </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-zinc-800/50 mt-4">
                          <button
                            type="submit"
                            disabled={addingUser}
                            className="px-8 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-xl transition-all disabled:opacity-50"
                          >
                            {addingUser ? "Processing..." : "Create Account"}
                          </button>
                        </div>
                      </form>
                    </div>
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
