import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Loader, Plus, Eye, Trash2, Edit, CheckCircle, XCircle } from "lucide-react"; // Added icons

// Fixed the import.meta issue
const baseURL = import.meta.env.VITE_API_BASE_URL;

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
  const [isDeleting, setIsDeleting] = useState(false); // Added isDeleting state

  useEffect(() => {
    fetchCoupons();
  }, []); // Removed fetchCoupons from dependency array to prevent re-fetch on filter change

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
      const response = await fetch(`${baseURL}admin/subscriptions/coupons/?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("authTokens"); // Use correct key
        localStorage.removeItem("user"); // Use correct key
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
      const response = await fetch(`${baseURL}admin/subscriptions/coupons/`, {
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
    // Adjust for timezone offset to get correct YYYY-MM-DD
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
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
  
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const tokens = JSON.parse(localStorage.getItem("authTokens"));
  
    try {
      const response = await fetch(`${baseURL}admin/subscriptions/coupons/${editData.id}/`, {
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

  setIsDeleting(true); // Set deleting state
  const tokens = JSON.parse(localStorage.getItem("authTokens"));
  try {
    const response = await fetch(`${baseURL}admin/subscriptions/coupons/${id}/`, {
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
  } finally {
    setIsDeleting(false); // Unset deleting state
  }
};

  // Themed modal input class
  const modalInputClass = "w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all";
  const modalSelectClass = `${modalInputClass} appearance-none`;
  const modalDateClass = `${modalInputClass} text-purple-300/70`;


  return (
    // Removed gradient, inheriting from layout
    <div className="text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
              Coupons Management
            </h1>
            <p className="text-purple-300/70">
              Create, manage, and track your promotional coupons
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold transition-all shadow-md shadow-purple-600/20 hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Coupon
          </button>
        </div>

       {/* Filters + Sort Section */}
<div className="mb-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    {/* Discount Type */}
    <div className="relative w-full">
      <select
        value={filters.discount_type}
        onChange={(e) =>
          setFilters((f) => ({ ...f, discount_type: e.target.value }))
        }
        className="w-full appearance-none px-4 py-2.5 rounded-lg bg-[#160C26] border border-purple-500/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
      >
        <option value="" className="bg-[#160C26]">All Types</option>
        <option value="PERCENTAGE" className="bg-[#160C26]">Percentage</option>
        <option value="FIXED" className="bg-[#160C26]">Fixed</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-3 text-purple-400">
        ▼
      </span>
    </div>

    {/* Status */}
    <div className="relative w-full">
      <select
        value={filters.is_active}
        onChange={(e) =>
          setFilters((f) => ({ ...f, is_active: e.target.value }))
        }
        className="w-full appearance-none px-4 py-2.5 rounded-lg bg-[#160C26] border border-purple-500/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
      >
        <option value="" className="bg-[#160C26]">All Status</option>
        <option value="true" className="bg-[#160C26]">Active</option>
        <option value="false" className="bg-[#160C26]">Inactive</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-3 text-purple-400">
        ▼
      </span>
    </div>

    {/* Search by Code */}
    <input
      type="text"
      placeholder="Search by code"
      value={filters.search}
      onChange={(e) =>
        setFilters((f) => ({ ...f, search: e.target.value }))
      }
      className="w-full px-4 py-2.5 rounded-lg bg-[#160C26] border border-purple-500/30 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
    />

    {/* Sort By */}
    <div className="relative w-full">
      <select
        value={filters.ordering}
        onChange={(e) =>
          setFilters((f) => ({ ...f, ordering: e.target.value }))
        }
        className="w-full appearance-none px-4 py-2.5 rounded-lg bg-[#160C26] border border-purple-500/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
      >
        <option value="" className="bg-[#160C26]">Sort By</option>
        <option value="code" className="bg-[#160C26]">Code</option>
        <option value="discount_value" className="bg-[#160C26]">Discount</option>
        <option value="start_date" className="bg-[#160C26]">Start Date</option>
        <option value="end_date" className="bg-[#160C26]">End Date</option>
        <option value="created_at" className="bg-[#160C26]">Created Date</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-3 text-purple-400">
        ▼
      </span>
    </div>

    {/* Apply Filters Button */}
    <button
      onClick={fetchCoupons}
      className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg text-white font-semibold transition-all shadow-md shadow-purple-600/20"
    >
      Apply Filters
    </button>
  </div>
</div>


        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-12">
            <Loader size={40} className="inline-block animate-spin text-purple-400" />
            <p className="text-purple-300/70 mt-4 text-lg font-medium">Loading coupons...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Table Section */}
        {!loading && !error && coupons.length > 0 && (
          <div className="bg-[#160C26] border border-purple-500/20 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-500/20">
                <thead className="bg-purple-500/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/20">
                  {coupons.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-semibold text-sm">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-purple-300/80 text-sm capitalize">
                          {c.discount_type.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium text-sm">
                          {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `$${c.discount_value}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-purple-300/80 text-sm">
                          {c.usage_count}/{c.usage_limit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-purple-300/80 text-sm">
                          <div>
                            {new Date(c.start_date).toLocaleDateString()}
                          </div>
                          <div className="text-purple-300/60 text-xs">
                            to {new Date(c.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.is_active ? (
                          <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-300 transition-all"
                            aria-label="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 transition-all"
                            aria-label="Delete"
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

        {!loading && !error && coupons.length === 0 && (
          <div className="text-center py-16 bg-[#160C26] border border-purple-500/20 rounded-lg">
            <p className="text-purple-300/70 text-lg">
              No coupons found. Create your first coupon!
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#160C26] p-8 rounded-lg shadow-2xl border border-purple-500/30 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-white text-center">
                Confirm Delete
              </h2>
              <p className="mb-8 text-purple-300/80 text-center">
                Are you sure you want to delete this coupon? This action cannot
                be undone.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-6 py-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-white font-medium transition-all border border-purple-500/30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Coupon Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#160C26] p-8 rounded-lg shadow-2xl border border-purple-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold mb-6 text-white text-center">
                Create New Coupon
              </h2>
              {formErrors && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
                  {formErrors}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Coupon Code
                  </label>
                  <input
                    name="code"
                    placeholder="e.g., SUMMER2025"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className={`${modalInputClass} uppercase placeholder:normal-case`}
                  />
                </div>

                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                    className={modalSelectClass}
                  >
                    <option value="PERCENTAGE" className="bg-[#160C26]">
                      Percentage
                    </option>
                    <option value="FIXED" className="bg-[#160C26]">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Discount Value ({formData.discount_type === 'PERCENTAGE' ? '%' : '$'})
                  </label>
                  <input
                    name="discount_value"
                    type="number"
                    placeholder={formData.discount_type === 'PERCENTAGE' ? "e.g., 20" : "e.g., 50.00"}
                    value={formData.discount_value}
                    onChange={handleChange}
                    required
                    min="0"
                    step={formData.discount_type === 'PERCENTAGE' ? "1" : "0.01"}
                    className={modalInputClass}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300/90 text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <input
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split("T")[0]} 
                      className={`${modalDateClass} ${!formData.start_date ? 'text-purple-300/50' : 'text-white'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/90 text-sm font-medium mb-2">
                      End Date
                    </label>
                    <input
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.start_date || new Date().toISOString().split("T")[0]} 
                      className={`${modalDateClass} ${!formData.end_date ? 'text-purple-300/50' : 'text-white'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Usage Limit
                  </label>
                  <input
                    name="usage_limit"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.usage_limit}
                    onChange={handleChange}
                    required
                    min="1"
                    className={modalInputClass}
                  />
                </div>

                <label className="flex items-center space-x-3 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded bg-black/20 border-purple-500/30 text-purple-600 focus:ring-2 focus:ring-purple-500/50"
                  />
                  <span className="font-medium text-purple-300/90">Set as Active</span>
                </label>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-white font-medium transition-all border border-purple-500/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#160C26] p-8 rounded-lg shadow-2xl border border-purple-500/30 max-w-lg w-full  overflow-y-auto">
              <h2 className="text-3xl font-bold mb-6 text-white text-center">
                Edit Coupon
              </h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Coupon Code
                  </label>
                  <input
                    name="code"
                    value={editData.code}
                    onChange={handleEditChange}
                    required
                    className={`${modalInputClass} uppercase`}
                  />
                </div>

                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    value={editData.discount_type}
                    onChange={handleEditChange}
                    className={modalSelectClass}
                  >
                    <option value="PERCENTAGE" className="bg-[#160C26]">
                      Percentage
                    </option>
                    <option value="FIXED" className="bg-[#160C26]">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Discount Value ({editData.discount_type === 'PERCENTAGE' ? '%' : '$'})
                  </label>
                  <input
                    name="discount_value"
                    type="number"
                    value={editData.discount_value}
                    onChange={handleEditChange}
                    required
                    min="0"
                    step={editData.discount_type === 'PERCENTAGE' ? "1" : "0.01"}
                    className={modalInputClass}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300/90 text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <input
                      name="start_date"
                      type="date"
                      value={editData.start_date}
                      onChange={handleEditChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className={`${modalDateClass} text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300/90 text-sm font-medium mb-2">
                      End Date
                    </label>
                    <input
                      name="end_date"
                      type="date"
                      value={editData.end_date}
                      onChange={handleEditChange}
                      required
                      min={editData.start_date || new Date().toISOString().split("T")[0]}
                      className={`${modalDateClass} text-white`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300/90 text-sm font-medium mb-2">
                    Usage Limit
                  </label>
                  <input
                    name="usage_limit"
                    type="number"
                    value={editData.usage_limit}
                    onChange={handleEditChange}
                    required
                    min="1"
                    className={modalInputClass}
                  />
                </div>

                <label className="flex items-center space-x-3 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editData.is_active}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded bg-black/20 border-purple-500/30 text-purple-600 focus:ring-2 focus:ring-purple-500/50"
                  />
                  <span className="font-medium text-purple-300/90">Set as Active</span>
                </label>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-white font-medium transition-all border border-purple-500/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
