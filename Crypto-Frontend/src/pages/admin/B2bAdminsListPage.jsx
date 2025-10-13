import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle, XCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                B2B Admins Management
              </h1>
              <p className="text-white/70 text-sm md:text-base">
                Manage and approve B2B administrator accounts
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs Section */}
        <div className="mb-8 backdrop-blur-md py-6 rounded-2xl shadow-xl">
          <div className="flex flex-wrap gap-3">
            {["all", "approved", "rejected", "pending"].map((status) => (
              <button
                key={status}
                className={`px-4 py-1 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  filterStatus === status
                    ? "bg-white text-[#4733A6]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            <p className="text-white mt-4">Loading admins...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-xl mb-6">
            Error: {error}
          </div>
        )}

        {/* Table Section */}
        {!loading && !error && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[#2b2676]">
                  <tr>
                    {/* <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      ID
                    </th> */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Mobile
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
                  {filteredAdmins.map((admin) => {
                    const u = admin.user;
                    return (
                      <tr
                        key={admin.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white/80 text-sm font-medium">
                            {u.id}
                          </span>
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white font-semibold text-sm">
                            {u.full_name || `${u.first_name} ${u.last_name}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/80 text-sm">
                            {u.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white/80 text-sm">
                            {u.mobile || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {admin.status === "pending" ? (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              Approve
                            </button>
                          ) : admin.status === "approved" ? (
                            <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle size={14} />
                              Approved
                            </span>
                          ) : admin.status === "rejected" ? (
                            <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 w-fit">
                              <XCircle size={14} />
                              Rejected
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-300 text-xs font-semibold border border-gray-500/30">
                              Unknown
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(admin)}
                              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                              aria-label={`View ${u.full_name}`}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(admin)}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                              aria-label={`Delete ${u.full_name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-white/70 text-lg"
                      >
                        No B2B Admins found for this status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default B2bAdminsListPage;
