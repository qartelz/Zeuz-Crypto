import React, { useEffect, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
const baseURL = import.meta.env.VITE_API_BASE_URL;

const UsersListPage = () => {
  const [usersList, setUsersList] = useState([]);
  console.log(usersList,"the userlist")

  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tokens = JSON.parse(localStorage.getItem('authTokens'));

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${baseURL}account/users/?role=b2c_user`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );

        
        if (response.status === 401) {
          const errorData = await response.json();

          if (
            errorData?.code === "token_not_valid" ||
            errorData?.detail === "Given token not valid for any token type"
          ) {
            localStorage.removeItem("admin_access_token");
            localStorage.removeItem("admin_refresh_token");
            localStorage.removeItem("admin_user");
            window.location.href = "/admin-login";
            return;
          }

          throw new Error("Unauthorized access");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUsersList(data.results || []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = usersList;

    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter((u) => u.is_active === true);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((u) => u.is_active === false);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((u) => {
        const name = u.full_name || `${u.first_name} ${u.last_name}`;
        const email = u.email || "";
        const mobile = u.mobile || "";
        const query = searchQuery.toLowerCase();
        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query) ||
          mobile.includes(query)
        );
      });
    }

    setFilteredUsers(filtered);
  }, [usersList, filterStatus, searchQuery]);

  const handleView = (user) => {
    alert(`View user: ${user.full_name || user.email}`);
  };

  const handleDelete = (user) => {
    alert(`Delete user: ${user.full_name || user.email}`);
  };

  return (
    <div className="min-h-screen rounded-4xl bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Users Management
              </h1>
              <p className="text-white/70 text-sm md:text-base">
                Manage and monitor B2C user accounts
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 backdrop-blur-md py-6 rounded-2xl shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Status Filter Tabs */}
            <div className="lg:col-span-2 flex flex-wrap gap-3">
              {["all", "active", "inactive"].map((status) => (
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

            {/* Search Input */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-1 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            <p className="text-white mt-4">Loading users...</p>
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
                      Wallet Balance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      
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
                        {u.is_active ? (
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
                        <span className="text-white/80 text-sm font-medium">
                          ${u.wallet?.balance || "0.00"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(u)}
                            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            aria-label={`View ${u.full_name || u.email}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            aria-label={`Delete ${u.full_name || u.email}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-white/70 text-lg"
                      >
                        No users found.
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

export default UsersListPage;