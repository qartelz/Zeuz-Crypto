import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const baseURL = "http://127.0.0.1:8000/api/v1/admin/subscriptions/plans";

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_days: "",
    price: "",
    user_type: "B2B",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState(null);
  const [creating, setCreating] = useState(false);

  const [filters, setFilters] = useState({
    user_type: "",
    is_active: "",
    search: "",
    ordering: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.user_type) queryParams.append("user_type", filters.user_type);
      if (filters.is_active) queryParams.append("is_active", filters.is_active);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.ordering) queryParams.append("ordering", filters.ordering);

      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(`${baseURL}/?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!response.ok) throw new Error(`Failed to load plans`);

      const data = await response.json();
      setPlans(data.results || data);
    } catch (err) {
      setPlansError(err.message);
      toast.error(`⚠️ ${err.message}`);
    } finally {
      setLoadingPlans(false);
    }
  };

  const openEditModal = (plan) => {
    setEditData({ ...plan });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const tokens = JSON.parse(localStorage.getItem("authTokens"));
    try {
      const response = await fetch(`${baseURL}/${editData.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error("Failed to update plan");

      const updatedPlan = await response.json();
      toast.success("✅ Plan updated successfully!");

      setPlans((prev) =>
        prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      );

      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.message || "❌ Failed to update plan");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    const id = confirmDeleteId;
    if (!id) return;

    const tokens = JSON.parse(localStorage.getItem("authTokens"));
    setIsDeleting(true);

    try {
      const response = await fetch(`${baseURL}/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.status === 204) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        setConfirmDeleteId(null);
        toast.success("🗑️ Plan deleted successfully!");
      } else {
        throw new Error("Failed to delete plan");
      }
    } catch (err) {
      toast.error(err.message || "❌ Failed to delete plan");
    } finally {
      setIsDeleting(false);
    }
  };

  const openModal = () => {
    setFormErrors(null);
    setFormData({
      name: "",
      description: "",
      duration_days: "",
      price: "",
      user_type: "B2B",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors(null);
    setCreating(true);

    if (
      !formData.name ||
      !formData.description ||
      !formData.duration_days ||
      !formData.price ||
      !formData.user_type
    ) {
      setFormErrors("Please fill in all required fields.");
      setCreating(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      duration_days: Number(formData.duration_days),
      price: formData.price.trim(),
      user_type: formData.user_type,
      is_active: formData.is_active,
    };

    const tokens = JSON.parse(localStorage.getItem("authTokens"));

    try {
      const response = await fetch(baseURL + "/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 400) {
        const errorData = await response.json();
        const errors = Object.entries(errorData)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        throw new Error(errors);
      }

      if (!response.ok) {
        throw new Error(
          `Failed to create plan: ${response.status} ${response.statusText}`
        );
      }

      const createdPlan = await response.json();
      toast.success("✅ Plan created successfully!");
      setPlans((prev) => [createdPlan, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "❌ Failed to create plan");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Plans Management
              </h1>
              <p className="text-white/70 text-sm md:text-base">
                Create, manage, and track your subscription plans
              </p>
            </div>
            <button
              onClick={openModal}
              className="bg-white text-[#4733A6] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
            >
              + Create Plan
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 backdrop-blur-md py-6 rounded-2xl shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.user_type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, user_type: e.target.value }))
              }
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              <option value="" className="bg-[#2b2676]">
                All User Types
              </option>
              <option value="B2B" className="bg-[#2b2676]">
                B2B
              </option>
              <option value="B2C" className="bg-[#2b2676]">
                B2C
              </option>
            </select>

            <select
              value={filters.is_active}
              onChange={(e) =>
                setFilters((f) => ({ ...f, is_active: e.target.value }))
              }
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              <option value="" className="bg-[#2b2676]">
                All Status
              </option>
              <option value="true" className="bg-[#2b2676]">
                Active
              </option>
              <option value="false" className="bg-[#2b2676]">
                Inactive
              </option>
            </select>

            <input
              type="text"
              placeholder="Search by name"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />

            <select
              value={filters.ordering}
              onChange={(e) =>
                setFilters((f) => ({ ...f, ordering: e.target.value }))
              }
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              <option value="" className="bg-[#2b2676]">
                Sort By
              </option>
              <option value="name" className="bg-[#2b2676]">
                Name
              </option>
              <option value="price" className="bg-[#2b2676]">
                Price
              </option>
              <option value="duration_days" className="bg-[#2b2676]">
                Duration
              </option>
              <option value="created_at" className="bg-[#2b2676]">
                Created Date
              </option>
            </select>

            <button
              onClick={fetchPlans}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {loadingPlans && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            <p className="text-white mt-4">Loading plans...</p>
          </div>
        )}
        {plansError && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-xl mb-6">
            {plansError}
          </div>
        )}

        {/* Table Section */}
        {!loadingPlans && !plansError && plans.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[#2b2676]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      User Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-semibold text-sm">
                          {plan.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80 text-sm">
                          {plan.user_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80 text-sm font-medium">
                          {plan.duration_days} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80 text-sm font-medium">
                          ${plan.price}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {plan.is_active ? (
                          <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              window.location.assign(`/admin/plans/${plan.id}`)
                            }
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(plan)}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(plan.id)}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loadingPlans && !plansError && plans.length === 0 && (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/70 text-lg">
              No plans found. Create your first plan!
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-white text-center">
                Confirm Delete
              </h2>
              <p className="mb-8 text-white/80 text-center">
                Are you sure you want to delete this plan? This action cannot
                be undone.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Plan Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {formErrors && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6">
                  {formErrors}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Plan Name
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., Premium Plan"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe the plan features..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Duration (days)
                    </label>
                    <input
                      name="duration_days"
                      type="number"
                      placeholder="e.g., 30"
                      value={formData.duration_days}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Price ($)
                    </label>
                    <input
                      name="price"
                      type="number"
                      placeholder="e.g., 29.99"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    User Type
                  </label>
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="B2B" className="bg-[#2b2676]">
                      B2B
                    </option>
                    <option value="B2C" className="bg-[#2b2676]">
                      B2C
                    </option>
                  </select>
                </div>

                <label className="flex items-center space-x-3 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded bg-white/5 border-white/20 text-indigo-600 focus:ring-2 focus:ring-white/50"
                  />
                  <span className="font-medium">Set as Active</span>
                </label>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Plan Modal */}
        {isEditModalOpen && editData && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Plan Name
                  </label>
                  <input
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    rows={3}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Duration (days)
                    </label>
                    <input
                      name="duration_days"
                      type="number"
                      value={editData.duration_days}
                      onChange={handleEditChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Price ($)
                    </label>
                    <input
                      name="price"
                      type="number"
                      value={editData.price}
                      onChange={handleEditChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    User Type
                  </label>
                  <select
                    name="user_type"
                    value={editData.user_type}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="B2B" className="bg-[#2b2676]">
                      B2B
                    </option>
                    <option value="B2C" className="bg-[#2b2676]">
                      B2C
                    </option>
                  </select>
                </div>

                <label className="flex items-center space-x-3 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editData.is_active}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded bg-white/5 border-white/20 text-indigo-600 focus:ring-2 focus:ring-white/50"
                  />
                  <span className="font-medium">Set as Active</span>
                </label>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? "Updating..." : "Update Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default PlansManagement;
