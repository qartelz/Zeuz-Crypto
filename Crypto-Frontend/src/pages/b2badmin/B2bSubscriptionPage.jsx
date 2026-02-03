import React, { useState, useEffect } from "react";
import { Users, Search, ChevronRight, ArrowLeft, Plus, X, Calendar, ChevronDown, CheckCircle, XCircle, LayoutGrid, List, Crown, History, Clock } from "lucide-react";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const B2bSubscriptionPage = () => {
    const [view, setView] = useState("batches"); // 'batches' or 'students'
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Subscription Modal States
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [showPlanDropdown, setShowPlanDropdown] = useState(false);

    const tokens = JSON.parse(localStorage.getItem("authTokens"));

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseURL}admin/subscriptions/batches/`, {
                headers: { Authorization: `Bearer ${tokens?.access}` },
            });
            if (response.ok) {
                const data = await response.json();
                setBatches(data.results || data);
            }
        } catch (error) {
            console.error("Error fetching batches:", error);
            toast.error("Failed to load batches");
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchStudents = async (batchId) => {
        setLoading(true);
        try {
            const response = await fetch(`${baseURL}admin/subscriptions/batches/${batchId}/students/`, {
                headers: { Authorization: `Bearer ${tokens?.access}` },
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data.results || data);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        setPlansLoading(true);
        try {
            const response = await fetch(`${baseURL}admin/subscriptions/plans/active/?user_type=B2B`, {
                headers: { Authorization: `Bearer ${tokens?.access}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(data);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setPlansLoading(false);
        }
    };

    const handleBatchClick = (batch) => {
        setSelectedBatch(batch);
        setView("students");
        fetchBatchStudents(batch.id);
    };

    const handleBackToBatches = () => {
        setSelectedBatch(null);
        setView("batches");
        setStudents([]);
        fetchBatches(); // Refresh stats
    };

    const handleManageSubscription = (user) => {
        // If user has a pending request, notify
        if (user.subscription?.status === 'PENDING_APPROVAL') {
            toast("This user already has a pending request.", { icon: "ℹ️" });
            return;
        }
        setSelectedUser(user);
        setShowModal(true);
        fetchPlans();
        // Pre-fill start date with today
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setStartDate(now.toISOString().slice(0, 16));
    };

    const handleRequestSubscription = async () => {
        if (!selectedPlan || !startDate) {
            toast.error("Please select a plan and start date");
            return;
        }

        setCreateLoading(true);
        try {
            // NOTE: Endpoint changed to request_subscription
            const response = await fetch(`${baseURL}admin/subscriptions/batches/request_subscription/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.access}`,
                },
                body: JSON.stringify({
                    user_id: selectedUser.id,
                    plan_id: selectedPlan.id, // Serializer expects plan_id, not plan object
                    start_date: startDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || JSON.stringify(data));
            }

            toast.success("Subscription request submitted for approval");
            setShowModal(false);
            fetchBatchStudents(selectedBatch.id); // Refresh list

            // Reset form
            setSelectedUser(null);
            setSelectedPlan(null);
        } catch (error) {
            console.error("Error requesting subscription:", error);
            toast.error(error.message || "Failed to submit request");
        } finally {
            setCreateLoading(false);
        }
    };

    const filteredBatches = batches.filter(batch =>
        batch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredStudents = students.filter(student =>
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (user) => {
        const sub = user.subscription;
        if (!sub) return <span className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-zinc-700">No Plan</span>;

        if (sub.status === 'ACTIVE') {
            return (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
            );
        }
        if (sub.status === 'PENDING_APPROVAL') {
            return (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 flex items-center gap-1 w-fit">
                    <Clock size={10} /> Pending Approval
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-500/20 flex items-center gap-1 w-fit">
                {sub.status}
            </span>
        );
    };

    return (
        <div className="space-y-6 text-zinc-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        {view === 'batches' ? 'Subscriptions' : (
                            <>
                                <button onClick={handleBackToBatches} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors -ml-2">
                                    <ArrowLeft size={24} />
                                </button>
                                {selectedBatch?.name}
                            </>
                        )}
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {view === 'batches'
                            ? 'Manage student subscriptions by batch'
                            : 'View status & request subscriptions for students'}
                    </p>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="overflow-hidden shadow-2xl">

                {/* Toolbar */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={view === 'batches' ? "Search batches..." : "Search students..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-zinc-700 transition-colors"
                        />
                    </div>
                    {view === 'batches' && (
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest px-4">
                            Total Batches: <span className="text-white">{filteredBatches.length}</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : view === 'batches' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBatches.map((batch) => (
                            <div
                                key={batch.id}
                                onClick={() => handleBatchClick(batch)}
                                className="group bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/30 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                                        <Crown size={20} />
                                    </div>
                                    {batch.pending_requests > 0 && (
                                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                                            {batch.pending_requests} Pending
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                    {batch.name}
                                </h3>
                                <p className="text-xs text-zinc-500 mb-6">Created {new Date(batch.created_at).toLocaleDateString()}</p>

                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-zinc-800/50">
                                    <div className="text-center">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Students</p>
                                        <p className="text-lg font-bold text-white">{batch.total_students || 0}</p>
                                    </div>
                                    <div className="text-center border-x border-zinc-800/50 px-2">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Active</p>
                                        <p className="text-lg font-bold text-emerald-400">{batch.active_subscriptions || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Expired</p>
                                        <p className="text-lg font-bold text-zinc-400">{batch.expired_subscriptions || 0}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                    Manage Details <ChevronRight size={14} className="ml-1" />
                                </div>
                            </div>
                        ))}
                        {filteredBatches.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                    <List size={24} className="text-zinc-600" />
                                </div>
                                <h4 className="text-white font-medium mb-1">No batches found</h4>
                                <p className="text-zinc-500 text-sm">Create a batch first to manage subscriptions.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#0a0a0a]">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Student</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subscription Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Plan</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pricing</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Expiry / Requested</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {student.full_name?.[0] || student.email?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-zinc-200 text-sm">{student.full_name}</p>
                                                        <p className="text-xs text-zinc-500">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(student)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-300">
                                                {student.subscription?.plan_name || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-300">
                                                —
                                                {/* Price could be added to serializer if needed, sticking to plan name for now */}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-zinc-500 font-mono">
                                                {student.subscription?.end_date
                                                    ? new Date(student.subscription.end_date).toLocaleDateString()
                                                    : student.subscription?.requested_at
                                                        ? new Date(student.subscription.requested_at).toLocaleDateString()
                                                        : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {student.subscription?.status === 'ACTIVE' ? (
                                                    <span className="text-xs text-zinc-500 italic">Active</span>
                                                ) : student.subscription?.status === 'PENDING_APPROVAL' ? (
                                                    <span className="text-xs text-amber-500 italic">Request Sent</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleManageSubscription(student)}
                                                        className="px-3 py-1.5 text-xs font-bold bg-white text-black hover:bg-zinc-200 rounded-lg transition-all shadow-lg shadow-white/5"
                                                    >
                                                        Request Access
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                                                No students found in this batch.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Dark Theme */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl border border-zinc-800 max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
                            <div>
                                <h2 className="text-xl font-bold text-white">Request Subscription</h2>
                                <p className="text-xs text-zinc-500">Submit a request for Main Admin approval.</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                    {selectedUser?.full_name?.[0]}
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Beneficiary</p>
                                    <p className="font-bold text-white">{selectedUser?.full_name}</p>
                                    <p className="text-xs text-zinc-400">{selectedUser?.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Plan</label>
                                <div className="relative">
                                    <div
                                        onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center cursor-pointer hover:border-zinc-700 transition-colors"
                                    >
                                        {selectedPlan ? (
                                            <div>
                                                <span className="font-bold text-white block text-sm">{selectedPlan.name}</span>
                                                <span className="text-xs text-zinc-500">${selectedPlan.price} / {selectedPlan.duration_days} days</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500 text-sm">Choose a subscription plan...</span>
                                        )}
                                        <ChevronDown size={18} className="text-zinc-500" />
                                    </div>

                                    {showPlanDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                                            {plans.map(plan => (
                                                <div
                                                    key={plan.id}
                                                    onClick={() => {
                                                        setSelectedPlan(plan);
                                                        setShowPlanDropdown(false);
                                                    }}
                                                    className="p-3 hover:bg-zinc-900 cursor-pointer border-b border-zinc-800 last:border-0 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-white text-sm">{plan.name}</span>
                                                        <span className="text-emerald-400 font-bold text-sm">${plan.price}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-1">{plan.duration_days} days • {plan.description}</p>
                                                </div>
                                            ))}
                                            {plans.length === 0 && (
                                                <div className="p-4 text-center text-zinc-500 text-sm">No B2B plans available</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Start Date Request</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-white transition-colors"
                                />
                            </div>

                            {selectedPlan && (
                                <div className="mt-4 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Plan Cost</span>
                                        <span className="text-white font-medium">${selectedPlan.price}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Duration</span>
                                        <span className="text-white font-medium">{selectedPlan.duration_days} Days</span>
                                    </div>
                                    <div className="pt-2 border-t border-zinc-800/50 flex justify-between text-sm font-bold">
                                        <span className="text-zinc-400">Total to Invoice</span>
                                        <span className="text-emerald-400">${selectedPlan.price}</span>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-semibold hover:bg-zinc-900 hover:text-white transition-colors text-sm"
                                disabled={createLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestSubscription}
                                className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 disabled:opacity-50 text-sm"
                                disabled={createLoading || !selectedPlan}
                            >
                                {createLoading ? 'Sending Request...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default B2bSubscriptionPage;
