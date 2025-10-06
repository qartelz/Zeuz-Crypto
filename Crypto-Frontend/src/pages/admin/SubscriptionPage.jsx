
import React, { useState, useEffect } from "react";

// ✅ Use your backend base URL
const baseURL = "http://127.0.0.1:8000/api/v1/admin/subscriptions/subscriptions/";

const PlanManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("");

  // Create Subscription
  const [showCreate, setShowCreate] = useState(false);
  const [planId, setPlanId] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  // Cancel Subscription
  const [cancelId, setCancelId] = useState(null);

  // Fetch Subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);

    const tokens = JSON.parse(localStorage.getItem("authTokens"));
    if (!tokens?.access) {
      setError("No auth token found");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (ordering) params.append("ordering", ordering);

      const res = await fetch(`${baseURL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      if (!res.ok) throw new Error("Failed to fetch subscriptions");

      const data = await res.json();
      console.log("Subscriptions API:", data);
      setSubscriptions(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [status, ordering]);

  // Create Subscription
  const createSubscription = async () => {
    const tokens = JSON.parse(localStorage.getItem("authTokens"));
    if (!tokens?.access) {
      alert("No auth token found");
      return;
    }

    try {
      const res = await fetch(baseURL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,
          discount_amount: discountAmount || 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to create subscription");

      alert("Subscription created successfully!");
      setShowCreate(false);
      setPlanId("");
      setDiscountAmount("");
      fetchSubscriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Cancel Subscription
  const cancelSubscription = async () => {
    if (!cancelId) return;

    const tokens = JSON.parse(localStorage.getItem("authTokens"));
    if (!tokens?.access) {
      alert("No auth token found");
      return;
    }

    try {
      const res = await fetch(`${baseURL}${cancelId}/cancel/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      if (!res.ok) throw new Error("Failed to cancel subscription");

      alert("Subscription canceled successfully!");
      setCancelId(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscription Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          + Create Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded"
        >
          <option value="">Sort By</option>
          <option value="start_date">Start Date</option>
          <option value="-start_date">Start Date (Desc)</option>
          <option value="end_date">End Date</option>
          <option value="-end_date">End Date (Desc)</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="min-w-full border border-gray-700">
            <thead>
              <tr className="bg-gray-800 text-left">
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Start</th>
                <th className="px-4 py-2">End</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Final Price</th>
                <th className="px-4 py-2">Remaining</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-3 text-center text-gray-400"
                  >
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="border-t border-gray-700">
                    <td className="px-4 py-2">{s.plan_name}</td>
                    <td className="px-4 py-2">{s.plan_duration_days} days</td>
                    <td className="px-4 py-2">
                      {new Date(s.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(s.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{s.status}</td>
                    <td className="px-4 py-2">${s.final_price}</td>
                    <td className="px-4 py-2">{s.days_remaining} days</td>
                    <td className="px-4 py-2">
                      {s.status === "ACTIVE" && (
                        <button
                          onClick={() => setCancelId(s.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Subscription Modal */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create Subscription</h2>

            <input
              type="text"
              placeholder="Plan ID"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2 mb-3 bg-gray-700 rounded"
            />

            <input
              type="number"
              placeholder="Discount Amount"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-3 py-2 mb-3 bg-gray-700 rounded"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createSubscription}
                className="px-4 py-2 bg-green-600 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {cancelId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Cancel Subscription</h2>
            <p className="mb-4">Are you sure you want to cancel this?</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                No
              </button>
              <button
                onClick={cancelSubscription}
                className="px-4 py-2 bg-red-600 rounded"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
