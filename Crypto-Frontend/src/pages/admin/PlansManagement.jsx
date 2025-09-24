import React, { useEffect, useState } from "react";

const baseURL = "http://127.0.0.1:8000/api/v1/admin/subscriptions/plans";

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_days: "",
    price: "",
    user_type: "B2B", // default
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  //   const fetchPlans = async () => {
  //     setLoadingPlans(true);
  //     setPlansError(null);
  //     try {
  //       const response = await fetch(baseURL + "/");
  //       if (!response.ok) {
  //         throw new Error(`Failed to load plans: ${response.status} ${response.statusText}`);
  //       }
  //       const data = await response.json();
  //       setPlans(data.results || data);
  //     } catch (err) {
  //       setPlansError(err.message || "Unknown error fetching plans");
  //     } finally {
  //       setLoadingPlans(false);
  //     }
  //   };

  // Inside PlansManagement.jsx

  const [filters, setFilters] = useState({
    user_type: "",
    is_active: "",
    search: "",
    ordering: "",
  });

  // fetchPlans updated with filters
  const fetchPlans = async () => {
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.user_type) queryParams.append("user_type", filters.user_type);
      if (filters.is_active) queryParams.append("is_active", filters.is_active);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.ordering) queryParams.append("ordering", filters.ordering);

      const response = await fetch(`${baseURL}/?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`Failed to load plans`);

      const data = await response.json();
      setPlans(data.results || data);
    } catch (err) {
      setPlansError(err.message);
    } finally {
      setLoadingPlans(false);
    }
  };

  // New states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // Open Edit Modal
  const openEditModal = (plan) => {
    setEditData({ ...plan }); // prefill form with plan data
    setUpdateError(null);
    setUpdateSuccess(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditData(null);
  };

  // Handle edit field changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit updated data (PATCH)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

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
      setUpdateSuccess("Plan updated successfully!");

      // Update local plans state
      setPlans((prev) =>
        prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      );

      setTimeout(() => {
        closeEditModal();
      }, 1200);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Delete Plan

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);


  const handleConfirmDelete = async () => {
    const id = confirmDeleteId;
    if (!id) return;
  
    const tokens = JSON.parse(localStorage.getItem("authTokens"));
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
      } else {
        throw new Error("Failed to delete plan");
      }
    } catch (err) {
      alert(err.message);
    }
  };
  

  const openModal = () => {
    setFormErrors(null);
    setCreateSuccess(null);
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

  const closeModal = () => {
    setIsModalOpen(false);
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
    setCreateSuccess(null);
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
      setCreateSuccess("Plan created successfully!");
      setPlans((prev) => [createdPlan, ...prev]);
      setTimeout(() => {
        closeModal();
        setCreateSuccess(null);
      }, 1500);
    } catch (err) {
      setFormErrors(err.message || "Unknown error creating plan");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-8">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-wide drop-shadow-lg">
            Plans Management
          </h1>
          <button
            onClick={openModal}
            className="bg-white text-[#4733A6] font-semibold px-5 py-2 rounded-full shadow-lg hover:bg-gray-200 transition"
          >
            + Create New Plan
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-xl shadow">
          {/* User Type */}
          <select
            value={filters.user_type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, user_type: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Users</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </select>

          {/* Status */}
          <select
            value={filters.is_active}
            onChange={(e) =>
              setFilters((f) => ({ ...f, is_active: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Search */}

          {/* Sorting */}
          <select
            value={filters.ordering}
            onChange={(e) =>
              setFilters((f) => ({ ...f, ordering: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Sort By</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="duration_days">Duration</option>
            <option value="created_at">Created Date</option>
          </select>

          {/* Apply Button */}
          <button
            onClick={fetchPlans}
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow-md transition"
          >
            Apply Filters
          </button>
        </div>

        {loadingPlans && (
          <p className="text-center text-lg font-medium">Loading plans...</p>
        )}
        {plansError && (
          <p className="text-red-400 text-center mb-6 font-semibold">
            {plansError}
          </p>
        )}

        {!loadingPlans && !plansError && plans.length === 0 && (
          <p className="text-center text-gray-300">No plans found.</p>
        )}

        {!loadingPlans && !plansError && plans.length > 0 && (
          <div className="overflow-x-auto rounded-xl shadow-lg border border-white/20 bg-[#1a1a3b]">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#2b2676]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                    Duration (days)
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {plans.map((plan) => (
                  <tr
                  key={plan.id}
                  className="cursor-pointer hover:bg-[#5546ac]/50 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {plan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.user_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.duration_days}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${plan.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {plan.is_active ? (
                      <span className="inline-block px-3 py-1 rounded-full bg-green-500 text-green-900 font-semibold text-sm">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full bg-red-600 text-red-200 font-semibold text-sm">
                        Inactive
                      </span>
                    )}
                  </td>
                
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    {/* ✅ Only View button navigates */}
                    <button
                      onClick={() => window.location.assign(`/admin/plans/${plan.id}`)}
                      className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm"
                    >
                      View
                    </button>
                
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(plan);
                      }}
                      className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-sm"
                    >
                      Edit
                    </button>
                
                    <button
  onClick={(e) => {
    e.stopPropagation();
    setConfirmDeleteId(plan.id); // open modal for this plan
  }}
  className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
>
  Delete
</button>

{confirmDeleteId && (
  <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-8 rounded-2xl shadow-2xl border border-white/30 max-w-sm w-full text-white text-center">
      <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
      <p className="mb-6 text-gray-300">
        Are you sure you want to delete this plan? 
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setConfirmDeleteId(null)}
          className="px-6 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmDelete}
          className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md transition"
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
)}


                  </td>
                </tr>
                
                ))}
              </tbody>

              {isEditModalOpen && editData && (
                        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div
                          className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-8 rounded-2xl shadow-2xl border border-white/30 max-w-md w-full text-white relative"
                          onClick={(e) => e.stopPropagation()} // prevent row click
                        >
                          <h2 className="text-3xl font-extrabold mb-6 text-center">
                            Edit Plan
                          </h2>
                      
                          {updateError && (
                            <p className="text-red-400 mb-4">{updateError}</p>
                          )}
                          {updateSuccess && (
                            <p className="text-green-400 mb-4">{updateSuccess}</p>
                          )}
                      
                          <form onSubmit={handleEditSubmit} className="space-y-5">
                            {/* Name */}
                            <div>
                              <label className="block mb-1 text-sm font-medium text-gray-200">
                                Name
                              </label>
                              <input
                                name="name"
                                type="text"
                                value={editData.name}
                                onChange={handleEditChange}
                                className="w-full rounded-lg px-4 py-2  border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none"
                                required
                              />
                            </div>
                      
                            {/* Description */}
                            <div>
                              <label className="block mb-1 text-sm font-medium text-gray-200">
                                Description
                              </label>
                              <textarea
                                name="description"
                                rows={3}
                                value={editData.description}
                                onChange={handleEditChange}
                                className="w-full rounded-lg px-4 py-2  border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                                required
                              />
                            </div>
                      
                            {/* Duration + Price */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-200">
                                  Duration (days)
                                </label>
                                <input
                                  name="duration_days"
                                  type="number"
                                  value={editData.duration_days}
                                  onChange={handleEditChange}
                                  className="w-full rounded-lg px-4 py-2  border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-200">
                                  Price ($)
                                </label>
                                <input
                                  name="price"
                                  type="number"
                                  step="0.01"
                                  value={editData.price}
                                  onChange={handleEditChange}
                                  className="w-full rounded-lg px-4 py-2  border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none"
                                  required
                                />
                              </div>
                            </div>
                      
                            {/* User Type */}
                            <div>
                              <label className="block mb-1 text-sm font-medium text-gray-200">
                                User Type
                              </label>
                              <select
                                name="user_type"
                                value={editData.user_type}
                                onChange={handleEditChange}
                                className="w-full rounded-lg px-4 py-2  border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none"
                              >
                                <option value="B2B">B2B</option>
                                <option value="B2C">B2C</option>
                              </select>
                            </div>
                      
                            {/* Active Checkbox */}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="is_active"
                                checked={editData.is_active}
                                onChange={handleEditChange}
                                className="h-5 w-5 border-gray-300 text-indigo-500 focus:ring-indigo-400"
                              />
                              <label className="text-sm">Active</label>
                            </div>
                      
                            {/* Buttons */}
                            <div className="flex justify-end space-x-4 pt-4">
                              <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-6 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={updating}
                                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md transition disabled:opacity-50"
                              >
                                {updating ? "Updating..." : "Update Plan"}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                      
                      )}
            </table>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-8 rounded-2xl shadow-2xl border border-white/30 max-w-md w-full text-white relative">
              <h2 className="text-3xl font-extrabold mb-6 tracking-wide text-center drop-shadow-lg">
                Create New Plan
              </h2>

              {formErrors && (
                <p className="mb-4 text-red-400 font-semibold">{formErrors}</p>
              )}
              {createSuccess && (
                <p className="mb-4 text-green-400 font-semibold">
                  {createSuccess}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block font-semibold uppercase tracking-wide text-gray-300 mb-1"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md px-4 py-2  font-medium border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#8e79e8]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block font-semibold uppercase tracking-wide text-gray-300 mb-1"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="w-full rounded-md px-4 py-2  font-medium border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#8e79e8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="duration_days"
                      className="block font-semibold uppercase tracking-wide text-gray-300 mb-1"
                    >
                      Duration (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="duration_days"
                      name="duration_days"
                      type="number"
                      min="1"
                      value={formData.duration_days}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md px-4 py-2     font-medium border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#8e79e8]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="price"
                      className="block font-semibold uppercase tracking-wide text-gray-300 mb-1"
                    >
                      Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md px-4 py-2  font-medium border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#8e79e8]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="user_type"
                    className="block font-semibold uppercase tracking-wide text-gray-300 mb-1"
                  >
                    User Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="user_type"
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className="w-full rounded-md px-4 py-2  font-medium border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#8e79e8]"
                  >
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="font-semibold text-gray-300"
                  >
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 rounded-full bg-gray-600 hover:bg-gray-700 transition font-semibold"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansManagement;
