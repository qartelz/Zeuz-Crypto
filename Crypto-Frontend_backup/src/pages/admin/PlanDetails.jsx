import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PlanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/admin/subscriptions/plans/${id}/`
        );

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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#2f287f] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-medium">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#2f287f] flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-3xl">!</span>
          </div>
          <h3 className="text-red-400 text-xl font-semibold mb-2">Error</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-white text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] to-[#2f287f] p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
        <button
  onClick={() => navigate("/admin/plans")}
  className="text-white/60 hover:text-white transition-colors mb-4 inline-flex items-center gap-2 text-sm font-medium"
>
  <ArrowLeft className="w-4 h-4" />
  Back to Plans
</button>

          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            Subscription Plan Details
          </h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {plan.name}
                </h2>
                <p className="text-gray-300 text-sm lg:text-base">
                  {plan.description || "No description available"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
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
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Primary Information
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Plan ID
                  </p>
                  <p className="text-white font-mono text-sm break-all">
                    {plan.id}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Duration
                  </p>
                  <p className="text-white text-xl font-bold">
                    {plan.duration_days}
                    <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Price
                  </p>
                  <p className="text-green-400 text-2xl font-bold">
                    ${plan.price}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
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
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Metadata
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Created At
                  </p>
                  <p className="text-white text-sm">
                    {new Date(plan.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(plan.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Updated At
                  </p>
                  <p className="text-white text-sm">
                    {new Date(plan.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(plan.updated_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          {/* <div className="bg-white/5 border-t border-white/10 p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => navigate("/admin/plans")}
                className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Plans
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default PlanDetails;