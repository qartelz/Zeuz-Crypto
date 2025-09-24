import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2 } from "lucide-react";

const UsersListPage = () => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const tokens = JSON.parse(localStorage.getItem('authTokens'));
  
//   if (tokens && tokens.access) {
//     const adminAccessToken = tokens.access;
   
//     console.log(adminAccessToken);
//   }


  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      

    //   if (!adminAccessToken) {
    //     setError("Admin access token not found. Please login.");
    //     setLoading(false);
    //     navigate("/admin-login"); 
    //     return;
    //   }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/account/users/?role=b2c_user",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );
        

        // ✅ Check for 401 errors and invalid token response
        if (response.status === 401) {
          const errorData = await response.json();

          if (
            errorData?.code === "token_not_valid" ||
            errorData?.detail === "Given token not valid for any token type"
          ) {
            // 🔐 Clear tokens and redirect
            localStorage.removeItem("admin_access_token");
            localStorage.removeItem("admin_refresh_token");
            localStorage.removeItem("admin_user");

            navigate("/admin-login");
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
  }, [navigate]);

  const handleView = (user) => {
    alert(`View user: ${user.full_name || user.email}`);
  };

  const handleDelete = (user) => {
    alert(`Delete user: ${user.full_name || user.email}`);
  };

  return (
    <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 rounded-xl shadow-lg border border-white/20 max-w-6xl mx-auto mt-10">
      <h2 className="text-lg font-semibold text-white mb-4">Users</h2>

      {loading && <p className="text-white">Loading users...</p>}
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
                <th className="p-3">Status</th>
                <th className="p-3">Wallet Balance</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-3 break-all">{u.id}</td>
                  <td className="p-3">{u.full_name || `${u.first_name} ${u.last_name}`}</td>
                  <td className="p-3 break-all">{u.email}</td>
                  <td className="p-3">{u.mobile || "-"}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        u.is_active
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">{u.wallet?.balance || "-"}</td>
                  <td className="p-3 flex space-x-2">
  <button
    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
    onClick={() => handleView(u)}
    aria-label={`View ${u.full_name || u.email}`}
  >
    <Eye size={16} />
  </button>
  <button
    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
    onClick={() => handleDelete(u)}
    aria-label={`Delete ${u.full_name || u.email}`}
  >
    <Trash2 size={16} />
  </button>
</td>

                </tr>
              ))}

              {usersList.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-white/50">
                    No users found.
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

export default UsersListPage;
