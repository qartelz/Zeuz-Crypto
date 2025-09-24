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

  if (loading)
    return (
      <p className="text-white p-6 text-center text-lg font-medium">
        Loading plan details...
      </p>
    );

  if (error)
    return (
      <div className="text-red-400 p-6 max-w-lg mx-auto text-center">
        <p className="mb-4 text-lg font-semibold">Error: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 inline-block bg-white text-black px-6 py-2 rounded-md font-semibold hover:bg-gray-200 transition"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-[#0F0F1E] to-[#2f287f] p-8 rounded-2xl shadow-2xl border border-white/10 max-w-4xl mx-auto mt-16 text-white">
      <h2 className="text-3xl font-bold mb-6 text-center drop-shadow-sm">
         Subscription Plan Details
      </h2>

      {/* Plan Basic Info */}
      <section className="grid sm:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">Plan ID</h4>
          <p className="text-lg font-medium break-all">{plan.id}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">Plan Name</h4>
          <p className="text-xl font-bold">{plan.name}</p>
        </div>
      </section>

      {/* Description */}
      <section className="mb-6">
        <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">Description</h4>
        <p className="text-gray-100 leading-relaxed">{plan.description || "—"}</p>
      </section>

      <hr className="border-white/10 my-6" />

      {/* Plan Details */}
      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">
            Duration (days)
          </h4>
          <p className="text-lg font-medium">{plan.duration_days}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">Price</h4>
          <p className="text-lg font-bold text-green-400">${plan.price}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">User Type</h4>
          <p className="text-lg font-medium">{plan.user_type}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">Status</h4>
          <span
            className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
              plan.is_active
                ? "bg-green-500 text-green-900"
                : "bg-red-600 text-red-100"
            }`}
          >
            {plan.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </section>

      <hr className="border-white/10 my-6" />

      {/* Timestamps */}
      <section className="grid sm:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">
            Created At
          </h4>
          <p className="text-sm text-gray-200">
            {new Date(plan.created_at).toLocaleString()}
          </p>
        </div>
        <div>
          <h4 className="text-sm text-gray-400 uppercase font-semibold mb-1">
            Updated At
          </h4>
          <p className="text-sm text-gray-200">
            {new Date(plan.updated_at).toLocaleString()}
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate("/admin/plans")}
          className="bg-white text-black font-semibold px-8 py-3 rounded-full shadow-md hover:bg-gray-200 transition inline-flex items-center gap-2"
        >
          ← Back to Plans
        </button>
      </div>
    </div>
  );
};

export default PlanDetails;
