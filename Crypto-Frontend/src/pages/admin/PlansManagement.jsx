import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader, Plus, Eye, Trash2, Edit, CheckCircle, XCircle } from "lucide-react"; // Added icons

// Fixed the import.meta issue
const baseURL = import.meta.env.VITE_API_BASE_URL;

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
      const response = await fetch(`${baseURL}admin/subscriptions/plans?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!response.ok) throw new Error(`Failed to load plans`);

      const data = await response.json();

      console.log(data,"the response ofthe plan")
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
      const response = await fetch(`${baseURL}admin/subscriptions/plans/${editData.id}/`, {
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
      const response = await fetch(`${baseURL}admin/subscriptions/plans/${id}/`, {
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
      const response = await fetch(`${baseURL}admin/subscriptions/plans/` , {
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
      console.log(response,"the reposne of the plan api")

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

  // Themed modal input class
  const modalInputClass = "w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all";
  // Themed modal select class
  const modalSelectClass = `${modalInputClass} appearance-none`;
  // Themed modal option class
  const modalOptionClass = "bg-[#160C26] text-white";

  return (
    // Removed gradient background, inheriting from layout
    <div className="text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
                Plans Management
              </h1>
              <p className="text-purple-300/70">
                Create, manage, and track your subscription plans
              </p>
            </div>
            {/* Themed create button */}
            <button
              onClick={openModal}
              className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold transition-all shadow-md shadow-purple-600/20 hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Create Plan
            </button>
          </div>
        </div>

        {/* Filters Section - Themed */}
        <div className="mb-8 p-6 bg-[#160C26] rounded-lg border border-purple-500/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.user_type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, user_type: e.target.value }))
              }
              className={modalSelectClass} // Use themed select
            >
              <option value="" className={modalOptionClass}>
                All User Types
              </option>
              <option value="B2B" className={modalOptionClass}>
                B2B
              </option>
              <option value="B2C" className={modalOptionClass}>
                B2C
              </option>
            </select>

            <select
              value={filters.is_active}
              onChange={(e) =>
                setFilters((f) => ({ ...f, is_active: e.target.value }))
              }
              className={modalSelectClass} // Use themed select
            >
              <option value="" className={modalOptionClass}>
                All Status
              </option>
              <option value="true" className={modalOptionClass}>
                Active
              </option>
              <option value="false" className={modalOptionClass}>
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
              className={modalInputClass} // Use themed input
            />

            <select
              value={filters.ordering}
              onChange={(e) =>
                setFilters((f) => ({ ...f, ordering: e.target.value }))
              }
              className={modalSelectClass} // Use themed select
            >
              <option value="" className={modalOptionClass}>
                Sort By
              </option>
              <option value="name" className={modalOptionClass}>
                Name
              </option>
              <option value="price" className={modalOptionClass}>
                Price
              </option>
              <option value="duration_days" className={modalOptionClass}>
                Duration
              </option>
              <option value="created_at" className={modalOptionClass}>
                Created Date
              </option>
            </select>

            <button
              onClick={fetchPlans}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold transition-all shadow-lg"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Loading & Error States - Themed */}
        {loadingPlans && (
          <div className="text-center py-12">
            <Loader size={40} className="inline-block animate-spin text-purple-400" />
            <p className="text-purple-300/70 mt-4">Loading plans...</p>
          </div>
        )}
        {plansError && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-6">
            {plansError}
          </div>
        )}

        {/* Table Section - Themed */}
        {!loadingPlans && !plansError && plans.length > 0 && (
          <div className="bg-[#160C26] rounded-lg shadow-lg border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-500/20">
                <thead className="bg-purple-500/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      User Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-semibold text-sm">
                          {plan.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-purple-300/80 text-sm">
                          {plan.user_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-purple-300/80 text-sm font-medium">
                          {plan.duration_days} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-purple-300/80 text-sm font-medium">
                          ${plan.price}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {plan.is_active ? (
                          <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 w-fit">
                            <XCircle size={14} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Themed Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              window.location.assign(`/admin/plans/${plan.id}`)
                            }
                            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-blue-200 border border-blue-500/30 transition-all"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(plan)}
                            className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-300 hover:text-green-200 border border-green-500/30 transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(plan.id)}
                            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-red-200 border border-red-500/30 transition-all"
                          >
                            <Trash2 size={16} />
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
          <div className="text-center py-16 bg-[#160C26] rounded-lg border border-purple-500/20">
            <p className="text-purple-300/70 text-lg">
              No plans found. Create your first plan!
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal - Themed */}
        {confirmDeleteId && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#160C26] p-8 rounded-lg shadow-2xl border border-purple-500/30 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-white text-center">
                Confirm Delete
              </h2>
              <p className="mb-8 text-purple-300/80 text-center">
                Are you sure you want to delete this plan? This action cannot
                be undone.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-6 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium transition-all border border-purple-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Plan Modal - Themed */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#160C26] p-8 rounded-lg shadow-2xl border border-purple-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {formErrors && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
                  {formErrors}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Plan Name
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., Premium Plan"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={modalInputClass}
                  />
                </div>

                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe the plan features..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    className={`${modalInputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300/80 text-sm font-medium mb-2">
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
                      className={modalInputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/80 text-sm font-medium mb-2">
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
                      className={modalInputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    User Type
                  </label>
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className={modalSelectClass}
                  >
                    <option value="B2B" className={modalOptionClass}>
                      B2B
                    </option>
                    <option value="B2C" className={modalOptionClass}>
                      B2C
                    </option>
                  </select>
                </div>

                <label className="flex items-center space-x-3 text-white cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded bg-black/20 border-purple-500/30 text-purple-600 focus:ring-2 focus:ring-purple-500/50"
                  />
                  <span className="font-medium text-purple-300/80">Set as Active</span>
                </label>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium transition-all border border-purple-500/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : "Create Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Plan Modal - Themed */}
        {isEditModalOpen && editData && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#160C26] p-8 rounded-lg shadow-2xl border border-purple-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Plan Name
                  </label>
                  <input
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    required
                    className={modalInputClass}
                  />
                </div>

                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    rows={3}
                    required
                    className={`${modalInputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300/80 text-sm font-medium mb-2">
                      Duration (days)
                    </label>
                    <input
                      name="duration_days"
                      type="number"
                      value={editData.duration_days}
                      onChange={handleEditChange}
                      required
                      min="1"
                      className={modalInputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/80 text-sm font-medium mb-2">
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
                      className={modalInputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300/80 text-sm font-medium mb-2">
                    User Type
                  </label>
                  <select
                    name="user_type"
                    value={editData.user_type}
                    onChange={handleEditChange}
                    className={modalSelectClass}
                  >
                    <option value="B2B" className={modalOptionClass}>
                      B2B
                    </option>
                    <option value="B2C" className={modalOptionClass}>
                      B2C
                    </option>
                  </select>
                </div>

                <label className="flex items-center space-x-3 text-white cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editData.is_active}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded bg-black/20 border-purple-500/30 text-purple-600 focus:ring-2 focus:ring-purple-500/50"
                  />
                  <span className="font-medium text-purple-300/80">Set as Active</span>
                </label>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium transition-all border border-purple-500/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Updating...
                      </>
                    ) : "Update Plan"}
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
        toastStyle={{
          backgroundColor: '#160C26',
          color: '#FFFFFF',
          border: '1px solid #A855F7',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};

export default PlansManagement;
