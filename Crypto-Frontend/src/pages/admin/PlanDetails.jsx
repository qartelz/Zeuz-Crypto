import { ArrowLeft, Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Fixed the import.meta issue
const baseURL = import.meta.env.VITE_API_BASE_URL;

const PlanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        // Retrieve tokens from localStorage
        const tokens = JSON.parse(localStorage.getItem("authTokens"));
        if (!tokens?.access) {
            throw new Error("No authorization token found.");
        }

        const response = await fetch(
          `${baseURL}admin/subscriptions/plans/${id}/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access}`, // Add Authorization header
            },
          }
        );

        if (response.status === 401) {
            // Handle token expiration or invalid token
            localStorage.removeItem("authTokens");
            localStorage.removeItem("user");
            navigate("/admin-login");
            return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch plan details");
        }

        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [id, navigate]); // Added navigate to dependency array

  if (loading) {
    return (
      // Themed loading state
      <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 120px)' }}> {/* Adjust height based on layout */}
        <div className="text-center">
          <Loader size={40} className="inline-block animate-spin text-purple-400" />
          <p className="text-purple-300/70 mt-4 text-lg font-medium">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      // Themed error state
      <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-[#160C26] border border-red-500/30 rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-3xl font-bold">!</span>
          </div>
          <h3 className="text-red-400 text-xl font-semibold mb-2">Error Loading Plan</h3>
          <p className="text-purple-300/70 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null; // Should be covered by loading/error states
  }

  return (
    // Removed gradient, inheriting from layout
    <div className="text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
        <button
          onClick={() => navigate("/admin/plans")}
          className="text-purple-300/70 hover:text-purple-300 transition-colors mb-4 inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </button>

          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            Subscription Plan Details
          </h1>
        </div>

        {/* Main Content Card - Themed */}
        <div className="bg-[#160C26] border border-purple-500/20 rounded-lg shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="bg-purple-500/10 border-b border-purple-500/20 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {plan.name}
                </h2>
                <p className="text-purple-300/70 text-sm lg:text-base">
                  {plan.description || "No description available"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                    plan.is_active
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 lg:p-8">
            {/* Primary Information */}
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4">
                Primary Information
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/70 uppercase font-semibold mb-2">
                    Plan ID
                  </p>
                  <p className="text-white font-mono text-sm break-all">
                    {plan.id}
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/70 uppercase font-semibold mb-2">
                    Duration
                  </p>
                  <p className="text-white text-xl font-bold">
                    {plan.duration_days}
                    <span className="text-sm font-normal text-purple-300/70 ml-1">days</span>
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/70 uppercase font-semibold mb-2">
                    Price
                  </p>
                  <p className="text-green-400 text-2xl font-bold">
                    ${plan.price}
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/70 uppercase font-semibold mb-2">
                    User Type
                  </p>
                  <p className="text-white text-lg font-semibold capitalize">
                    {plan.user_type}
                  </p>
                </div>
              </div>
            </section>

            {/* Metadata */}
            <section>
              <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4">
                Metadata
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/70 uppercase font-semibold mb-2">
                    Created At
                  </p>
                  <p className="text-white text-sm">
                    {new Date(plan.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-purple-300/70 text-xs mt-1">
                    {new Date(plan.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/70 uppercase font-semibold mb-2">
                    Updated At
                  </p>
                  <p className="text-white text-sm">
                    {new Date(plan.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-purple-300/70 text-xs mt-1">
                    {new Date(plan.updated_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetails;
