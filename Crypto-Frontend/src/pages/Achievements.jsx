import React, { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  TrendingUp,
  Target,
  Flame,
  Award,
  CheckCircle,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  BarChart3,
  Loader2,
  AlertCircle,
  TrendingDown,
  Shield,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Achievements() {
  const [currentView, setCurrentView] = useState("portfolio"); // 'portfolio' or 'badges'
  const [achievementsData, setAchievementsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // Icon mapping for weeks since backend returns null for icons sometimes
  const WEEK_ICONS = {
    1: "🛡️",
    2: "🌊",
    3: "⚡",
    4: "👑"
  };

  const BADGE_DESCRIPTIONS = {
    1: "Master the basics of cryptocurrency and spot trading fundamentals",
    2: "Successfully navigate market volatility and complete multiple challenges",
    3: "Demonstrate advanced risk management in futures trading",
    4: "Achieve consistent returns through balanced portfolio management"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authTokens = localStorage.getItem("authTokens");
        if (!authTokens) {
          throw new Error("User not authenticated");
        }
        const tokens = JSON.parse(authTokens);
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.access}`,
        };

        // Fetch all required data in parallel
        const [weeksRes, partsRes, rewardsRes] = await Promise.all([
          fetch(`${baseURL}challenges/weeks/`, { headers }),
          fetch(`${baseURL}challenges/participations/`, { headers }),
          fetch(`${baseURL}challenges/rewards/my-rewards/`, { headers })
        ]);

        if (!weeksRes.ok || !partsRes.ok || !rewardsRes.ok) {
          throw new Error("Failed to fetch achievements data");
        }

        const weeksData = await weeksRes.json();
        const partsData = await partsRes.json();
        const rewardsData = await rewardsRes.json();

        processAchievementsData(weeksData, partsData, rewardsData);
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processAchievementsData = (weeks, participations, rewards) => {
    // 1. Sort weeks safely
    const weeksArray = Array.isArray(weeks) ? weeks : (weeks.results || []);
    const sortedWeeks = [...weeksArray].sort((a, b) => a.week_number - b.week_number);

    if (sortedWeeks.length === 0) {
      setAchievementsData(null);
      return;
    }

    // 2. Map Participations & Rewards
    const partMap = new Map();
    const partsArray = Array.isArray(participations) ? participations : (participations.results || []);
    partsArray.forEach(p => partMap.set(p.week_id, p));

    const rewardsArray = Array.isArray(rewards) ? rewards : (rewards.results || []);

    // 3. Build Detailed Timeline for Cards
    const timeline = sortedWeeks.map(week => {
      const participation = partMap.get(week.id);

      const isCompleted = participation?.status === 'COMPLETED';
      const isInProgress = participation?.status === 'IN_PROGRESS';

      let status = "LOCKED";
      if (isCompleted) status = "COMPLETED";
      else if (isInProgress) status = "IN_PROGRESS";

      // Calculate Metrics
      const startingBalance = participation ? parseFloat(participation.starting_balance || 0) : 0;
      const currentBalance = participation ? parseFloat(participation.current_balance || 0) : 0;
      const totalProfit = currentBalance - startingBalance;
      const profitPct = startingBalance > 0 ? (totalProfit / startingBalance) * 100 : 0;
      const targetReturn = parseFloat(week.target_goal || 5); // Assuming 5% if missing

      // Progress calculation
      const returnPct = participation ? parseFloat(participation.portfolio_return_pct || 0) : 0;
      const progressToGoal = Math.min(100, Math.max(0, (returnPct / targetReturn) * 100));

      return {
        id: week.id,
        weekNumber: week.week_number,
        title: week.title,
        description: week.description,
        status: status,
        targetReturn: targetReturn,

        // Detailed Metrics
        currentReturn: returnPct,
        totalPnl: totalProfit,
        profitPct: profitPct,
        startingBalance: startingBalance,
        currentBalance: currentBalance,
        progressPct: progressToGoal,

        // Days to Goal Mock (can be refined if data exists)
        daysToGoal: isInProgress ? "2 days" : "-",
        avgDailyReturn: "+0.31%", // Mock until backend provides

        badgeName: week.reward?.badge_name || `Week ${week.week_number} Badge`,
      };
    });

    // 4. Determine Current Context (latest active or completed)
    const currentWeekItem = timeline.find(t => t.status === 'IN_PROGRESS') || timeline[timeline.length - 1];
    const currentPart = partMap.get(currentWeekItem.id) || {};
    const latestEval = currentPart.score_details || {};

    // 5. Weekly Badges Mapping
    const weeklyBadges = [1, 2, 3, 4].map(weekNum => {
      const weekData = sortedWeeks.find(d => d.week_number === weekNum);
      const isEarned = rewardsArray.some(r => r.week_number === weekNum || r.reward_template?.week?.week_number === weekNum);
      const reward = rewardsArray.find(r => r.week_number === weekNum || r.reward_template?.week?.week_number === weekNum);

      return {
        week: weekNum,
        title: reward?.badge_name || `Week ${weekNum} Badge`,
        description: BADGE_DESCRIPTIONS[weekNum] || "Complete the weekly challenge to unlock.",
        icon: WEEK_ICONS[weekNum] || "🏆",
        unlocked: isEarned,
        unlockDate: reward?.earned_at ? new Date(reward.earned_at).toISOString().split('T')[0] : null
      };
    });

    setAchievementsData({
      timeline: timeline,
      portfolioChallenge: {
        title: "Your Trading Journey",
        subtitle: `Track your progress across ${sortedWeeks.length} Challenge Weeks`,
        // Header Metrics can be aggregated or pulled from current week
        metrics: [], // Simplified for now as full cards show details
      },
      behavioralInsights: {
        level: latestEval.tier_name || "Initiate",
        title: latestEval.behavioral_tag || "Trader",
        score: parseFloat(latestEval.total_score || 0).toFixed(0),
        capitalUsage: parseFloat(latestEval.capital_usage_pct || 0).toFixed(1),
        totalTrades: currentPart.total_trades || 0,
        xpPoints: rewardsArray.reduce((acc, r) => acc + (r.coins_earned || 0), 0),
        keyInsights: [
          { type: "info", icon: "ℹ️", text: latestEval.key_issue || "Keep trading to generate insights." }
        ]
      },
      stats: {
        badgesEarned: rewardsArray.length,
        xpPoints: rewardsArray.reduce((acc, r) => acc + (r.coins_earned || 0), 0),
        currentStreak: 3,
        completionRate: Math.round((rewardsArray.length / 4) * 100),
      },
      journey: {
        currentWeek: currentWeekItem.weekNumber,
        totalWeeks: 4,
        progress: (currentWeekItem.weekNumber / 4) * 100,
      },
      weeklyBadges: weeklyBadges,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-500" size={48} />
          <p className="text-purple-300">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  if (error || !achievementsData) {
    return (
      <div className="min-h-screen  flex items-center justify-center text-white p-6">
        <div className="max-w-md text-center bg-[#10081C] border border-red-500/30 p-8 rounded-2xl">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Achievements</h2>
          <p className="text-gray-400 mb-6">{error || "No participation data found."}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Portfolio Performance Challenge View (First Page)
  if (currentView === "portfolio") {
    return (
      <div className="min-h-screen text-white p-4 md:p-8 max-w-7xl mx-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Trading Journey
            </h1>
            <p className="text-purple-200 mt-2">
              Master the market one week at a time.
            </p>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex gap-4 bg-[#160C26] p-2 rounded-xl border border-purple-500/20">
            <div className="px-4 py-2 text-center border-r border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Badges</div>
              <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                <Shield size={16} /> {achievementsData?.stats?.badgesEarned || 0}
              </div>
            </div>
            <div className="px-4 py-2 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Progress</div>
              <div className="text-xl font-bold text-green-400">
                {achievementsData?.stats?.completionRate || 0}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Column: Timeline */}
          <div className="lg:col-span-2 space-y-8">
            {achievementsData?.timeline?.map((week) => (
              <DetailedChallengeCard key={week.id} week={week} />
            ))}
          </div>

          {/* Right Column: Behavioral Insights Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 sticky top-8">
              <div className="mb-4">
                <h3 className="font-bold text-xl ">Behavioral Insights</h3>
              </div>
              <div className="text-center mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 mb-4 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center relative">
                    <span className="text-5xl">🛡️</span>
                    <div className="absolute -bottom-3 bg-gray-800 text-xs px-2 py-1 rounded-full border border-gray-600">
                      Level {achievementsData?.behavioralInsights.level || "Initiate"}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-1">
                    {achievementsData?.behavioralInsights.title || "Trader"}
                  </h3>
                  <div className="text-sm text-purple-300 uppercase tracking-widest mb-4">
                    {achievementsData?.behavioralInsights.keyInsights[0]?.text || "Inconsistent"}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-4 bg-white/5 px-6 py-2 rounded-lg">
                    <span className="text-purple-300 text-sm uppercase">Score</span>
                    <span className="text-3xl font-bold text-yellow-400">
                      {achievementsData?.behavioralInsights.score || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-black/30 rounded-lg p-3 text-center border border-gray-800">
                  <div className="text-xs text-purple-300 mb-1">Capital</div>
                  <div className="text-sm font-bold text-white">
                    {achievementsData?.behavioralInsights.capitalUsage}%
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center border border-gray-800">
                  <div className="text-xs text-purple-300 mb-1">Trades</div>
                  <div className="text-sm font-bold text-blue-400">
                    {achievementsData?.behavioralInsights.totalTrades}
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center border border-gray-800">
                  <div className="text-xs text-purple-300 mb-1">XP</div>
                  <div className="text-sm font-bold text-orange-400">
                    {achievementsData?.behavioralInsights.xpPoints}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentView("badges")}
                className="w-full border border-[#FF3BD4] text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                style={{
                  backgroundImage: 'linear-gradient(to top, rgba(255, 59, 212, 0.2), rgba(113, 48, 195, 0.2))'
                }}
              >
                View Full Behavioral Insight
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Badges & Achievements View (Second Page)
  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => setCurrentView("portfolio")}
          className="mb-6 text-purple-400 hover:text-white hover:bg-purple-700/20 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Portfolio Challenge
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-yellow-400" size={40} />
            <h1 className="text-4xl font-bold">Crypto Trading Rewards</h1>
          </div>
          <p className="text-purple-300 text-lg">
            Track your learning journey and earn badges
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Award className="text-purple-400" size={24} />
              <div className="text-sm text-purple-300">Badges Earned</div>
            </div>
            <div className="text-3xl font-bold">
              {achievementsData.stats.badgesEarned}
              <span className="text-purple-400 text-lg">/4</span>
            </div>
          </div>

          <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-yellow-400" size={24} />
              <div className="text-sm text-purple-300">XP Points</div>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {achievementsData.stats.xpPoints}
            </div>
          </div>

          <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="text-orange-400" size={24} />
              <div className="text-sm text-purple-300">Current Streak</div>
            </div>
            <div className="text-3xl font-bold text-orange-400">
              {achievementsData.stats.currentStreak} days
            </div>
          </div>

          <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-green-400" size={24} />
              <div className="text-sm text-purple-300">Completion Rate</div>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {achievementsData.stats.completionRate}%
            </div>
          </div>
        </div>

        {/* Journey Progress */}
        <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Journey</h2>
              <p className="text-purple-300">
                Week {achievementsData.journey.currentWeek} of{" "}
                {achievementsData.journey.totalWeeks}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-400">
                {achievementsData.journey.progress}%
              </div>
              <div className="text-sm text-purple-300">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-purple-900/50 rounded-full h-3 mb-6">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${achievementsData.journey.progress}%` }}
              ></div>
            </div>

            {/* Week Markers */}
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4].map((week) => (
                <div key={week} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${week <= achievementsData.journey.currentWeek
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gray-700 text-gray-400"
                      }`}
                  >
                    {week}
                  </div>
                  <div
                    className={`text-sm ${week <= achievementsData.journey.currentWeek
                      ? "text-white"
                      : "text-gray-500"
                      }`}
                  >
                    W{week}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Achievement Badges */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="text-yellow-400" size={32} />
            <h2 className="text-3xl font-bold">Weekly Achievement Badges</h2>
          </div>
          <p className="text-purple-300 mb-6">
            Complete each week's curriculum to unlock exclusive badges and
            rewards
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievementsData.weeklyBadges.map((badge, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br backdrop-blur-sm border rounded-2xl p-6 transition-all hover:scale-105 ${badge.unlocked
                  ? "from-purple-900/60 to-indigo-900/60 border-purple-500/50 shadow-lg shadow-purple-500/20"
                  : "from-gray-900/40 to-gray-800/40 border-gray-600/30 opacity-60"
                  }`}
              >
                {/* Badge Icon */}
                <div className="relative mb-4">
                  <div
                    className={`w-32 h-32 mx-auto rounded-2xl flex items-center justify-center ${badge.unlocked
                      ? "bg-gradient-to-br from-purple-600 to-pink-600"
                      : "bg-gray-700"
                      }`}
                  >
                    <span className="text-6xl">{badge.icon}</span>
                  </div>
                  {badge.unlocked ? (
                    <div className="absolute top-0 right-8">
                      <CheckCircle
                        className="text-green-400"
                        size={32}
                        fill="currentColor"
                      />
                    </div>
                  ) : (
                    <div className="absolute top-0 right-8">
                      <Lock className="text-gray-500" size={32} />
                    </div>
                  )}
                  <div className="absolute -top-2 -left-2 bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 border-white">
                    Week {badge.week}
                  </div>
                </div>

                {/* Badge Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{badge.title}</h3>
                  <p className="text-sm text-purple-300 mb-4">
                    {badge.description}
                  </p>

                  {badge.unlocked ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold">
                        Unlocked
                      </div>
                      <div className="text-xs text-purple-400">
                        {badge.unlockDate}
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-gray-700/30 text-gray-400 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                      <Lock size={14} />
                      Locked
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// COMPONENT: Detailed Challenge Card (The requested UI)
const DetailedChallengeCard = ({ week }) => {
  const isLocked = week.status === "LOCKED";
  const isCompleted = week.status === "COMPLETED";
  const isInProgress = week.status === "IN_PROGRESS";

  // Default to expanded only if in progress
  const [isExpanded, setIsExpanded] = useState(isInProgress);

  return (
    <div className={`
      relative rounded-2xl p-6 border transition-all duration-300
      ${isLocked ? 'bg-[#0f1016]/50 border-gray-800 opacity-70' :
        isCompleted ? 'bg-[#131422] border-green-500/30 ring-1 ring-green-500/20' :
          'bg-[#131422] border-purple-500/30 shadow-xl shadow-purple-900/10'
      }
    `}>
      {/* LOCKED OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl">
          <div className="bg-gray-800 p-3 rounded-full mb-3 shadow-lg">
            <Lock className="text-gray-400" size={32} />
          </div>
          {/* <h3 className="text-xl font-bold text-gray-300"> Locked</h3> */}
          <p className="text-gray-400 text-sm mt-1">Join Week {week.weekNumber} to unlock</p>
        </div>
      )}

      {/* HEADER */}
      <div
        className="mb-6 flex justify-between items-start cursor-pointer"
        onClick={() => !isLocked && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            Week {week.weekNumber} - {week.title}
            {isCompleted && <CheckCircle className="text-green-500" size={24} />}
          </h2>
          <div className="mt-3 max-w-xl">
            <div className="flex justify-between text-xs mb-1 font-semibold text-purple-300 uppercase tracking-wider">
              <span>Progress</span>
              <span>{week.progressPct?.toFixed(0) || 0}%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                style={{ width: `${week.progressPct || 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isInProgress && (
            <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              IN PROGRESS
            </span>
          )}
          {!isLocked && (
            <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE CONTENT */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {/* METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

            {/* Return */}
            <div className="bg-[#1a1b2e] border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <TrendingUp className="text-purple-400" size={20} />
                <span className={`font-bold ${week.currentReturn > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {week.currentReturn > 0 ? '+' : ''}{week.currentReturn.toFixed(2)}%
                </span>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Return</div>
              <div className="text-xl font-bold mt-1">{week.currentReturn.toFixed(2)}%</div>
            </div>

            {/* Total P&L */}
            <div className="bg-[#1a1b2e] border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <Target className="text-purple-400" size={20} />
                <span className={`font-bold ${week.totalPnl > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {week.profitPct > 0 ? '+' : ''}{week.profitPct.toFixed(1)}%
                </span>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Total P&L</div>
              <div className="text-xl font-bold mt-1">${week.totalPnl.toFixed(2)}</div>
            </div>

            {/* Avg Daily Return (Mock for now) */}
            <div className="bg-[#1a1b2e] border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <BarChart3 className="text-purple-400" size={20} />
                <span className="font-bold text-green-400">+0.31%</span>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Avg Daily Return</div>
              <div className="text-xl font-bold mt-1">+0.31%</div>
            </div>

            {/* Days to Goal */}
            <div className="bg-[#1a1b2e] border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <Clock className="text-purple-400" size={20} />
                <span className="font-bold text-gray-400">---</span>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Days to Goal</div>
              <div className="text-xl font-bold mt-1 max-w-full truncate">{week.daysToGoal}</div>
            </div>
          </div>

          {/* PORTFOLIO & PROGRESS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">

            {/* Portfolio Values */}
            <div className="flex justify-between items-end bg-[#1a1b2e]/50 p-4 rounded-xl">
              <div>
                <div className="text-gray-400 text-xs mb-1">Total Portfolio Value</div>
                <div className="text-3xl font-bold text-white">
                  ${week.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className={`text-sm flex items-center gap-1 ${week.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {week.totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  ${Math.abs(week.totalPnl).toFixed(2)} ({Math.abs(week.profitPct).toFixed(1)}%)
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs mb-1">Starting Value</div>
                <div className="text-xl font-bold text-gray-300">
                  ${week.startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-black/20 p-4 rounded-xl border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Target className="text-purple-400" size={18} />
                  <span className="text-sm font-bold text-gray-200">Progress to Goal</span>
                </div>
                <div className="text-lg font-bold text-purple-400">
                  {week.currentReturn.toFixed(1)}% / {week.targetReturn}%
                </div>
              </div>

              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                  style={{ width: `${week.progressPct}%` }}
                />
              </div>

              {/* {isInProgress && (
                <div className="mt-4 text-center">
                  <Link to="/trading" className="inline-block w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition">
                    Continue Trading
                  </Link>
                </div>
              )} */}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
