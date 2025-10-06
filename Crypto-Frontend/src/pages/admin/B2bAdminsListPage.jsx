import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle } from "lucide-react";

const B2bAdminsListPage = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/account/b2b-admin/approval-list/",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_user");
          navigate("/admin-login");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAdmins(data.results || []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [navigate]);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredAdmins(admins);
    } else {
      setFilteredAdmins(admins.filter((a) => a.status === filterStatus));
    }
  }, [admins, filterStatus]);

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/account/b2b-admin/approve/${userId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Approval failed");
      }

      const data = await response.json();

      // Update the approved admin in the state
      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.user.id === userId ? { ...admin, status: "approved" } : admin
        )
      );
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handleView = (admin) => {
    alert(`View B2B Admin: ${admin.user.full_name}`);
  };

  const handleDelete = (admin) => {
    alert(`Delete B2B Admin: ${admin.user.full_name}`);
  };

  return (
    <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 rounded-xl shadow-lg border border-white/20 max-w-7xl mx-auto mt-10">
      <h2 className="text-3xl font-bold  text-white mb-4">B2B Admins</h2>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        {["all", "approved", "rejected", "pending"].map((status) => (
          <button
            key={status}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filterStatus === status
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-white">Loading admins...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Mobile</th>

                <th className="p-3">Approval</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => {
                const u = admin.user;
                const isPending = admin.status === "pending";
                return (
                  <tr
                    key={admin.id}
                    className="border-b border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="p-3 break-all">{u.id}</td>
                    <td className="p-3">
                      {u.full_name || `${u.first_name} ${u.last_name}`}
                    </td>
                    <td className="p-3 break-all">{u.email}</td>
                    <td className="p-3">{u.mobile || "-"}</td>

                    <td className="p-3 capitalize">
  {admin.status === "pending" ? (
    <button
      onClick={() => handleApprove(u.id)}
      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
    >
      Approve
    </button>
  ) : admin.status === "approved" ? (
    <span className="flex items-center text-green-400 font-medium">
      <CheckCircle size={16} className="mr-1" />
      Approved
    </span>
  ) : admin.status === "rejected" ? (
    <span className="flex items-center text-red-400 font-medium">
      ❌ Rejected
    </span>
  ) : (
    <span className="text-gray-400">Unknown</span>
  )}
</td>

                    <td className="p-3 flex space-x-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
                        onClick={() => handleView(admin)}
                        aria-label={`View ${admin.user.full_name}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
                        onClick={() => handleDelete(admin)}
                        aria-label={`Delete ${admin.user.full_name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-white/50">
                    No B2B Admins found for this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default B2bAdminsListPage;
