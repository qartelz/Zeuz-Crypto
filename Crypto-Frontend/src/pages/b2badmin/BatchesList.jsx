import React, { useEffect, useState } from "react";
import {
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const baseURL = import.meta.env.VITE_API_baseURL;

const BatchesList = () => {
  const [batches, setBatches] = useState([]);
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
  const [userFormResponse, setUserFormResponse] = useState(null);
  const [addingUser, setAddingUser] = useState(false);

  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const tokens = JSON.parse(localStorage.getItem("authTokens"));
  const navigate = useNavigate();

  // Move fetchBatches out to call anywhere
  const fetchBatches = async () => {
    setLoading(true);
    try {
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
      setBatches(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [navigate, tokens?.access]);

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
    alert(`Delete Batch: ${batch.name}`);
  };

  const handleAddUserToBatch = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    setUserFormResponse(null);

    try {
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
    <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 rounded-xl shadow-lg border border-white/20 max-w-7xl mx-auto mt-10 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Batches</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-black px-4 py-2 rounded-full text-sm flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Create Batch</span>
        </button>
      </div>

      {loading ? (
        <p className="text-white">Loading batches...</p>
      ) : error ? (
        <p className="text-red-400">Error: {error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Max Users</th>
                <th className="p-3">User Count</th>
                <th className="p-3">Active</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-3">{batch.name}</td>
                  <td className="p-3">{batch.description}</td>
                  <td className="p-3">{batch.max_users}</td>
                  <td className="p-3">{batch.user_count}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(batch.id)}
                      className="text-white hover:text-green-400"
                      title="Toggle Active"
                    >
                      {batch.is_active ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center items-center space-x-4">
                      <button
                        onClick={() => handleView(batch)}
                        className="hover:text-blue-400 transition"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch)}
                        className="hover:text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-white/50">
                    No batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1A1A40] to-[#472783] rounded-lg p-6 w-full max-w-md text-white shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Create New Batch</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Batch Name"
                value={newBatch.name}
                onChange={(e) =>
                  setNewBatch((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60"
              />
              <textarea
                placeholder="Description"
                value={newBatch.description}
                onChange={(e) =>
                  setNewBatch((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60"
              />
              <input
                type="number"
                placeholder="Max Users"
                value={newBatch.max_users}
                onChange={(e) =>
                  setNewBatch((prev) => ({
                    ...prev,
                    max_users: e.target.value,
                  }))
                }
                className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60"
              />

              {createResponse?.error && (
                <p className="text-red-400 text-sm">{createResponse.error}</p>
              )}
              {createResponse?.id && (
                <div className="text-green-400 text-sm border border-green-500 p-2 rounded">
                  Batch Created: <strong>{createResponse.name}</strong>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBatch}
                  disabled={creating}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingBatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A1A40] to-[#472783] rounded-lg p-6 w-full max-w-2xl text-white shadow-lg border border-white/20 relative">
            <button
              className="absolute top-2 right-2 text-white hover:text-red-400"
              onClick={() => setViewingBatch(null)}
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold mb-4">
              Batch: {viewingBatch.name}
            </h3>

            <p className="text-white/80 text-sm mb-2">
              Description: {viewingBatch.description}
            </p>

            <div className="mt-6 border-t border-white/20 pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Users</h4>
                <button
                  onClick={() => setShowAddUserForm((prev) => !prev)}
                  className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  {showAddUserForm ? "Close Form" : "Add User"}
                </button>
              </div>

              {/* Show users only if form is hidden */}
              {!showAddUserForm && (
                <ul className="space-y-1 text-sm mt-2 max-h-40 overflow-y-auto">
                  {batchUsers.length > 0 ? (
                    batchUsers.map((u) => (
                      <li
                        key={u.id}
                        className="border-b border-white/10 py-1 flex justify-between"
                      >
                        <span>{u.email}</span>
                        <span className="text-white/60">{u.role}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-white/50">No users in this batch.</li>
                  )}
                </ul>
              )}

              {/* Add User Form */}
              {showAddUserForm && (
                <form
                  onSubmit={handleAddUserToBatch}
                  className="space-y-3 mt-6"
                >
                  <h4 className="font-semibold text-white">Add User to Batch</h4>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={userForm.first_name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, first_name: e.target.value })
                    }
                    className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={userForm.last_name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, last_name: e.target.value })
                    }
                    className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Mobile"
                    value={userForm.mobile}
                    onChange={(e) =>
                      setUserForm({ ...userForm, mobile: e.target.value })
                    }
                    className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60 text-white"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="w-full p-2 rounded bg-transparent border border-white/30 placeholder-white/60 text-white"
                  />

                  {userFormResponse?.error && (
                    <p className="text-red-400 text-sm">{userFormResponse.error}</p>
                  )}
                  {userFormResponse?.success && (
                    <p className="text-green-400 text-sm">{userFormResponse.success}</p>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(false)}
                      className="px-4 py-2 rounded border border-white/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingUser}
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {addingUser ? "Adding..." : "Add User"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesList;
