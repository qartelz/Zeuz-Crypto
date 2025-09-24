import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const baseURL = "http://127.0.0.1:8000/api/v1/admin/subscriptions/coupons";

const CouponsManagement = () => {
 
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Filters
  const [filters, setFilters] = useState({
    discount_type: "",
    is_active: "",
    search: "",
    ordering: "",
  });

  // Modal states
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

  // Edit Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Fetch Coupons with filters
  const fetchCoupons = async () => {


    setLoading(true);
    setError(null);

    
    try {
      const queryParams = new URLSearchParams();
      if (filters.discount_type)
        queryParams.append("discount_type", filters.discount_type);
      if (filters.is_active)
        queryParams.append("is_active", filters.is_active);
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

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Create Coupon
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

      if (!response.ok) throw new Error("Failed to create coupon");

      const createdCoupon = await response.json();
      setCoupons((prev) => [createdCoupon, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      setFormErrors(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Edit Coupon

  const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); 
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
      const response = await fetch(`${baseURL}/${editData.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify(editData),
      });
      if (!response.ok) throw new Error("Failed to update coupon");
      const updatedCoupon = await response.json();
      setCoupons((prev) =>
        prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c))
      );
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Delete Coupon

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
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setConfirmDeleteId(null);
      } else {
        throw new Error("Failed to delete coupon");
      }
    } catch (err) {
      alert(err.message);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-8">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold">Coupons Management</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-[#4733A6] px-5 py-2 rounded-full font-semibold"
          >
            + Create Coupon
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 bg-white/5 p-4 rounded-xl shadow">
          <select
            value={filters.discount_type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, discount_type: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border text-white"
          >
            <option value="">All Types</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed</option>
          </select>

          <select
            value={filters.is_active}
            onChange={(e) =>
              setFilters((f) => ({ ...f, is_active: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border text-white"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <input
            type="text"
            placeholder="Search by code"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border "
          />

          <select
            value={filters.ordering}
            onChange={(e) =>
              setFilters((f) => ({ ...f, ordering: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border text-white"
          >
            <option value="">Sort By</option>
            <option value="code">Code</option>
            <option value="discount_value">Discount</option>
            <option value="start_date">Start Date</option>
            <option value="end_date">End Date</option>
            <option value="created_at">Created Date</option>
          </select>

          <button
            onClick={fetchCoupons}
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg"
          >
            Apply Filters
          </button>
        </div>

        {loading && <p>Loading coupons...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && coupons.length > 0 && (
          <div className="overflow-x-auto rounded-xl shadow-lg border bg-[#1a1a3b]">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#2b2676]">
                <tr>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Value</th>
                  <th className="px-6 py-3 text-left">Usage</th>
                  <th className="px-6 py-3 text-left">Validity</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#5546ac]/50">
                    <td className="px-6 py-3">{c.code}</td>
                    <td className="px-6 py-3">{c.discount_type}</td>
                    <td className="px-6 py-3">{c.discount_value}</td>
                    <td className="px-6 py-3">
                      {c.usage_count}/{c.usage_limit}
                    </td>
                    <td className="px-6 py-3">
                      {new Date(c.start_date).toLocaleDateString()} -{" "}
                      {new Date(c.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      {c.is_active ? (
                        <span className="px-3 py-1 rounded-full bg-green-500 text-black">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-500">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="px-3 py-1 rounded bg-green-500 text-white"
                      >
                        Edit
                      </button>
                     <button
  onClick={() => setConfirmDeleteId(c.id)}
  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
>
  Delete
</button>

{confirmDeleteId && (
  <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 rounded-2xl shadow-2xl border border-white/20 max-w-sm w-full text-white text-center">
      <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
      <p className="mb-6 text-gray-300">
        Are you sure you want to delete this coupon? 
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
            </table>
          </div>
        )}

        {/* Create Coupon Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center">
          <div className="bg-[#2b2676] p-6 rounded-xl max-w-md w-full text-white">
            <h2 className="text-xl font-bold mb-4">Create Coupon</h2>
            {formErrors && <p className="text-red-400">{formErrors}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="code"
                placeholder="Code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-transparent border border-white/20 text-white placeholder-white"
              />
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-transparent border border-white/20 text-white"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
              <input
                name="discount_value"
                type="number"
                placeholder="Discount Value"
                value={formData.discount_value}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-transparent border border-white/20 text-white placeholder-white"
              />
              <input
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-transparent border border-white/20 text-white"
              />
              <input
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-transparent border border-white/20 text-white"
              />
              <input
                name="usage_limit"
                type="number"
                placeholder="Usage Limit"
                value={formData.usage_limit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-transparent border border-white/20 text-white placeholder-white"
              />
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span>Active</span>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 rounded"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        )}

        {/* Edit Coupon Modal */}
        {isEditModalOpen && editData && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-6 rounded-2xl shadow-2xl max-w-md w-full text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">Edit Coupon</h2>
        
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input
                name="code"
                value={editData.code}
                onChange={handleEditChange}
                required
                placeholder="Coupon Code"
                className="w-full px-4 py-2 rounded-md 
                           border border-gray-300 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
        
              <select
                name="discount_type"
                value={editData.discount_type}
                onChange={handleEditChange}
                className="w-full px-4 py-2 rounded-md  
                           border border-gray-300 focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
        
              <input
                name="discount_value"
                type="number"
                value={editData.discount_value}
                onChange={handleEditChange}
                required
                placeholder="Discount Value"
                className="w-full px-4 py-2 rounded-md 
                           border border-gray-300 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
        
              <input
                name="start_date"
                type="datetime-local"
                value={editData.start_date}
                onChange={handleEditChange}
                required
                className="w-full px-4 py-2 rounded-md 
                           border border-gray-300 focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
        
              <input
                name="end_date"
                type="datetime-local"
                value={editData.end_date}
                onChange={handleEditChange}
                required
                className="w-full px-4 py-2 rounded-md 
                           border border-gray-300 focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
        
              <input
                name="usage_limit"
                type="number"
                value={editData.usage_limit}
                onChange={handleEditChange}
                required
                placeholder="Usage Limit"
                className="w-full px-4 py-2 rounded-md 
                           border border-gray-300 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
        
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={editData.is_active}
                  onChange={handleEditChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <span>Active</span>
              </label>
        
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Update"}
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

export default CouponsManagement;
