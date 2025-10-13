import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const baseURL = "http://127.0.0.1:8000/api/v1/admin/subscriptions/coupons";

const CouponsManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    discount_type: "",
    is_active: "",
    search: "",
    ordering: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    start_date: "",
    end_date: "",
    usage_limit: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState(null);
  const [creating, setCreating] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.discount_type)
        queryParams.append("discount_type", filters.discount_type);
      if (filters.is_active) queryParams.append("is_active", filters.is_active);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.ordering) queryParams.append("ordering", filters.ordering);

      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(`${baseURL}/?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("admin_user");
        navigate("/admin-login");
        return;
      }

      if (!response.ok) throw new Error("Failed to load coupons");
      const data = await response.json();
      setCoupons(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
  
    const tokens = JSON.parse(localStorage.getItem("authTokens"));
  
    try {
      const response = await fetch(`${baseURL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData?.message ||
          errorData?.detail ||
          (errorData?.non_field_errors && errorData.non_field_errors.join(", ")) ||
          "Failed to create coupon";
      
        console.error("Backend Error:", errorData);
      
        throw new Error(errorMessage);
      }
      
  
      const createdCoupon = await response.json();
      setCoupons((prev) => [createdCoupon, ...prev]);
      setIsModalOpen(false);
      toast.success("Coupon created successfully 🎉");
    } catch (err) {
      console.error("Submission Error:", err);
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  


  const openEditModal = (coupon) => {
    setEditData({
      ...coupon,
      start_date: formatDateForInput(coupon.start_date),
      end_date: formatDateForInput(coupon.end_date),
    });
    setIsEditModalOpen(true);
  };
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  
  


  // const handleEditSubmit = async (e) => {
  //   e.preventDefault();
  //   setUpdating(true);
  //   const tokens = JSON.parse(localStorage.getItem("authTokens"));
  //   try {
  //     const response = await fetch(`${baseURL}/${editData.id}/`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${tokens?.access}`,
  //       },
  //       body: JSON.stringify(editData),
  //     });
  
  //     if (!response.ok) {
  //       const errorData = await response.json();
  
  //       const errorMessage =
  //         errorData?.message ||
  //         errorData?.detail ||
  //         (errorData?.non_field_errors && errorData.non_field_errors.join(", ")) ||
  //         "Failed to update coupon";
  
  //       console.error("Backend Error:", errorData);
  
  //       throw new Error(errorMessage);
  //     }
  
  //     const updatedCoupon = await response.json();
  //     setCoupons((prev) =>
  //       prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c))
  //     );
  //     setIsEditModalOpen(false);
  //     toast.success("Coupon updated successfully ✅");
  //   } catch (err) {
  //     toast.error(err.message || "Update failed");
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

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
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error("Backend Error:", responseData); // ❌ Error response from backend
  
        const errorMessage =
          responseData?.message ||
          responseData?.detail ||
          (responseData?.non_field_errors && responseData.non_field_errors.join(", ")) ||
          "Update failed";
  
        throw new Error(errorMessage);
      }
  
      console.log("Edit Success Response:", responseData); 
  
      const successMessage =
        responseData?.message || "Coupon updated successfully ✅";
  
      setCoupons((prev) =>
        prev.map((c) => (c.id === responseData.id ? responseData : c))
      );
      setIsEditModalOpen(false);
      toast.success(successMessage);
    } catch (err) {
      console.error("Submission Error:", err); 
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };
  
  

  


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
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      toast.success("Coupon deleted successfully 🗑️");
    } else {
      throw new Error("Failed to delete coupon");
    }
  } catch (err) {
    toast.error(err.message || "Delete failed");
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
                Coupons Management
              </h1>
              <p className="text-white/70 text-sm md:text-base">
                Create, manage, and track your promotional coupons
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-[#4733A6] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
            >
              + Create Coupon
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 backdrop-blur-md py-6 rounded-2xl shadow-xl ">
          {/* <h2 className="text-white font-semibold mb-4 text-lg">Filters</h2> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.discount_type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, discount_type: e.target.value }))
              }
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              <option value="" className="bg-[#2b2676]">
                All Types
              </option>
              <option value="PERCENTAGE" className="bg-[#2b2676]">
                Percentage
              </option>
              <option value="FIXED" className="bg-[#2b2676]">
                Fixed
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
              placeholder="Search by code"
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
              <option value="code" className="bg-[#2b2676]">
                Code
              </option>
              <option value="discount_value" className="bg-[#2b2676]">
                Discount
              </option>
              <option value="start_date" className="bg-[#2b2676]">
                Start Date
              </option>
              <option value="end_date" className="bg-[#2b2676]">
                End Date
              </option>
              <option value="created_at" className="bg-[#2b2676]">
                Created Date
              </option>
            </select>

            <button
              onClick={fetchCoupons}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            <p className="text-white mt-4">Loading coupons...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Table Section */}
        {!loading && !error && coupons.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[#2b2676]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Validity
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
                  {coupons.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-semibold text-sm">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80 text-sm">
                          {c.discount_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80 text-sm font-medium">
                          {c.discount_value}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80 text-sm">
                          {c.usage_count}/{c.usage_limit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white/80 text-sm">
                          <div>
                            {new Date(c.start_date).toLocaleDateString()}
                          </div>
                          <div className="text-white/60 text-xs">
                            to {new Date(c.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.is_active ? (
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
                        onClick={() => openEditModal(c)}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        Edit
                      </button>
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
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

        {!loading && !error && coupons.length === 0 && (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/70 text-lg">
              No coupons found. Create your first coupon!
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
                Are you sure you want to delete this coupon? This action cannot
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
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Coupon Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* <h2 className="text-3xl font-bold mb-6 text-white text-center">
                Create New Coupon
              </h2> */}
              {formErrors && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6">
                  {formErrors}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Coupon Code
                  </label>
                  <input
  name="code"
  placeholder="e.g., SUMMER2025"
  value={formData.code}
  onChange={handleChange}
  required
  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
/>

                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="PERCENTAGE" className="bg-[#2b2676]">
                      Percentage
                    </option>
                    <option value="FIXED" className="bg-[#2b2676]">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Discount Value
                  </label>
                  <input
                    name="discount_value"
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.discount_value}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-white/90 text-sm font-medium mb-2">
      Start Date
    </label>
    <input
      name="start_date"
      type="date"
      value={formData.start_date}
      onChange={handleChange}
      required
      min={new Date().toISOString().split("T")[0]} 
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
    />
  </div>

  <div>
    <label className="block text-white/90 text-sm font-medium mb-2">
      End Date
    </label>
    <input
      name="end_date"
      type="date"
      value={formData.end_date}
      onChange={handleChange}
      required
      min={new Date().toISOString().split("T")[0]} 
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
    />
  </div>
</div>


                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Usage Limit
                  </label>
                  <input
                    name="usage_limit"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.usage_limit}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
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
                    {creating ? "Creating..." : "Create Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Coupon Modal */}
        {isEditModalOpen && editData && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* <h2 className="text-3xl font-bold mb-6 text-white text-center">
                Edit Coupon
              </h2> */}

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Coupon Code
                  </label>
                  <input
                    name="code"
                    value={editData.code}
                    onChange={handleEditChange}
                    required
                    className="w-full uppercase px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    value={editData.discount_type}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="PERCENTAGE" className="bg-[#2b2676]">
                      Percentage
                    </option>
                    <option value="FIXED" className="bg-[#2b2676]">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Discount Value
                  </label>
                  <input
                    name="discount_value"
                    type="number"
                    value={editData.discount_value}
                    onChange={handleEditChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <input
                      name="start_date"
                      type="date"
                      value={editData.start_date}
                      onChange={handleEditChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      End Date
                    </label>
                    <input
                      name="end_date"
                      type="date"
                      value={editData.end_date}
                      onChange={handleEditChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Usage Limit
                  </label>
                  <input
                    name="usage_limit"
                    type="number"
                    value={editData.usage_limit}
                    onChange={handleEditChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
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
                    {updating ? "Updating..." : "Update Coupon"}
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

export default CouponsManagement;
