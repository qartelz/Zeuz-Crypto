import React, { useState, useEffect } from "react";
import {
    Trophy,
    Filter,
    Plus,
    Search,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronRight,
    Edit2
} from "lucide-react";
import toast from "react-hot-toast";

const RewardTemplates = () => {
    const [weeks, setWeeks] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [selectedWeekForReward, setSelectedWeekForReward] = useState(null);

    const [formData, setFormData] = useState({
        badge_name: "",
        badge_description: "",
        badge_icon: "",
        profit_bonus_coins: 25000,
        loss_recovery_coins: 10000,
        is_active: true
    });

    // Fetch Data
    const fetchData = async () => {
        try {
            setLoading(true);
            const tokens = JSON.parse(localStorage.getItem("authTokens"));
            if (!tokens) return;

            const headers = { Authorization: `Bearer ${tokens.access}` };

            // Fetch Programs
            const progRes = await fetch("http://127.0.0.1:8000/api/v1/challenges/programs/", { headers });
            const progData = await progRes.json();
            if (Array.isArray(progData)) {
                setPrograms(progData);
            } else if (progData.results && Array.isArray(progData.results)) {
                setPrograms(progData.results);
            } else {
                setPrograms([]);
                console.error("Programs data format error:", progData);
            }

            // Fetch Weeks
            const weeksRes = await fetch("http://127.0.0.1:8000/api/v1/challenges/weeks/", { headers });
            const weeksData = await weeksRes.json();
            if (Array.isArray(weeksData)) {
                setWeeks(weeksData);
            } else if (weeksData.results && Array.isArray(weeksData.results)) {
                setWeeks(weeksData.results);
            } else {
                setWeeks([]);
                console.error("Weeks data format error:", weeksData);
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Logic
    const filteredWeeks = weeks.filter(week => {
        const matchesProgram = selectedProgram === "all" || week.program === selectedProgram;
        const matchesSearch = week.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            week.program_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProgram && matchesSearch;
    });

    // Group by Program
    const groupedWeeks = filteredWeeks.reduce((acc, week) => {
        const progName = week.program_name || "Unknown Program";
        if (!acc[progName]) acc[progName] = [];
        acc[progName].push(week);
        return acc;
    }, {});

    // Handle Modal Open
    const handleOpenModal = (week) => {
        setSelectedWeekForReward(week);
        if (week.reward) {
            setEditingReward(week.reward);
            setFormData({
                badge_name: week.reward.badge_name,
                badge_description: week.reward.badge_description,
                badge_icon: week.reward.badge_icon || "",
                profit_bonus_coins: week.reward.profit_bonus_coins,
                loss_recovery_coins: week.reward.loss_recovery_coins,
                is_active: week.reward.is_active
            });
        } else {
            setEditingReward(null);
            setFormData({
                badge_name: `${week.title} Finisher`,
                badge_description: `Awarded for completing ${week.title}`,
                badge_icon: "",
                profit_bonus_coins: 25000,
                loss_recovery_coins: 10000,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedWeekForReward) return;

        try {
            const tokens = JSON.parse(localStorage.getItem("authTokens"));
            const url = editingReward
                ? `http://127.0.0.1:8000/api/v1/challenges/rewards/${editingReward.id}/`
                : "http://127.0.0.1:8000/api/v1/challenges/rewards/";

            const method = editingReward ? "PATCH" : "POST";

            const body = {
                ...formData,
                week: selectedWeekForReward.id
            };

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens.access}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast.success(editingReward ? "Reward updated!" : "Reward created!");
                setIsModalOpen(false);
                fetchData(); // Refresh list to see updated status
            } else {
                const data = await response.json();
                toast.error(data.error || "Operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        }
    };

    return (
        <div className="p-6 space-y-6 text-gray-100 min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Reward Templates
                    </h1>
                    <p className="text-gray-400 mt-1">Configure completion rewards for each challenge week</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search weeks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-[#1a1b2e] border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-64"
                        />
                    </div>

                    <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="px-4 py-2 bg-[#1a1b2e] border border-gray-700 rounded-lg text-sm outline-none"
                    >
                        <option value="all">All Programs</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedWeeks).map(([progName, weeks]) => (
                        <div key={progName} className="bg-[#131422] border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 bg-[#1a1b2e] border-b border-gray-800 flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{progName}</h3>
                                <span className="text-xs font-mono text-gray-400 bg-black/20 px-2 py-1 rounded">
                                    {weeks.length} Weeks
                                </span>
                            </div>

                            <div className="divide-y divide-gray-800">
                                {weeks.map(week => (
                                    <div key={week.id} className="p-4 hover:bg-white/5 transition flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg 
                        ${week.reward ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {week.week_number}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white">{week.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {week.reward ? (
                                                        <span className="text-xs flex items-center gap-1 text-green-400">
                                                            <CheckCircle className="w-3 h-3" /> Configured: {week.reward.badge_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs flex items-center gap-1 text-red-400 font-semibold animate-pulse">
                                                            <XCircle className="w-3 h-3" /> Missing Configuration
                                                        </span>
                                                    )}
                                                    <span className="text-gray-600 text-xs">•</span>
                                                    <span className="text-xs text-gray-500">{week.trading_type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenModal(week)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2
                        ${week.reward
                                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/20'}`}
                                        >
                                            {week.reward ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {week.reward ? "Edit Reward" : "Add Reward"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredWeeks.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            No weeks found matching your filters.
                        </div>
                    )}
                </div>
            )}

            {/* REWARD CONFIGURATION MODAL */}
            {isModalOpen && selectedWeekForReward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1e1f30] rounded-2xl w-full max-w-lg overflow-hidden border border-gray-700 shadow-2xl animate-enter">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#25263a]">
                            <h3 className="text-lg font-semibold text-white">
                                {editingReward ? 'Edit Reward Template' : 'Configure New Reward'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Context Info */}
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-sm text-purple-200 mb-4">
                                Configuring for <strong>{selectedWeekForReward.program_name} - Week {selectedWeekForReward.week_number}</strong>
                            </div>

                            {/* Badge Details */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Badge Details</label>
                                <div>
                                    <label className="text-sm text-gray-300 mb-1 block">Badge Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.badge_name}
                                        onChange={e => setFormData({ ...formData, badge_name: e.target.value })}
                                        className="w-full bg-[#131422] border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                                        placeholder="e.g. Spot Master"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-300 mb-1 block">Description</label>
                                    <textarea
                                        rows={2}
                                        value={formData.badge_description}
                                        onChange={e => setFormData({ ...formData, badge_description: e.target.value })}
                                        className="w-full bg-[#131422] border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                                        placeholder="Short description of achievement"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-300 mb-1 block">Icon URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={formData.badge_icon}
                                        onChange={e => setFormData({ ...formData, badge_icon: e.target.value })}
                                        className="w-full bg-[#131422] border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {/* Coin Rewards */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-semibold text-green-400 uppercase mb-2 block">Profit Bonus</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.profit_bonus_coins}
                                        onChange={e => setFormData({ ...formData, profit_bonus_coins: parseInt(e.target.value) })}
                                        className="w-full bg-[#131422] border border-green-900/50 text-green-400 rounded-lg px-3 py-2 outline-none focus:border-green-500"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Coins for profitable completion</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-orange-400 uppercase mb-2 block">Loss Recovery</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.loss_recovery_coins}
                                        onChange={e => setFormData({ ...formData, loss_recovery_coins: parseInt(e.target.value) })}
                                        className="w-full bg-[#131422] border border-orange-900/50 text-orange-400 rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Consolation coins</p>
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-purple-500"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-300 cursor-pointer">
                                    Activate this reward template immediately
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-700 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white font-bold shadow-lg transition"
                                >
                                    {editingReward ? 'Save Changes' : 'Create Template'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardTemplates;
