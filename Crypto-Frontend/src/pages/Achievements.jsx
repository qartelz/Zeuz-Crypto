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
  ArrowLeft,
  BarChart3,
  Loader2,
  AlertCircle,
  TrendingDown
} from "lucide-react";

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
    const fetchRewards = async () => {
      try {
        const authTokens = localStorage.getItem("authTokens");
        if (!authTokens) {
          throw new Error("User not authenticated");
        }
        const tokens = JSON.parse(authTokens);

        const response = await fetch(`${baseURL}challenges/rewards/my-rewards/`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokens.access}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch achievements data");
        }

        const data = await response.json();
        const processedData = processAchievementsData(data);
        setAchievementsData(processedData);
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const processAchievementsData = (apiData) => {
    // If no data, return a basic empty structure or handle appropriately
    if (!apiData || apiData.length === 0) {
      // Fallback or empty state could be handled here
      // For now, let's assume we might have at least one week joined if they are here
      // But if truly empty, we'll return a safe default
      return null;
    }

    // Sort by week number to ensure order
    const sortedData = [...apiData].sort((a, b) => a.week_number - b.week_number);

    // Get the latest active or completed week (current context)
    const currentWeekData = sortedData[sortedData.length - 1];

    // Calculate total portfolio stats
    // Note: If the backend logic changes to aggregation, update here. 
    // Currently taking the latest week's balance as "current portfolio value" proxy
    const currentBalance = parseFloat(currentWeekData.current_balance || 0);
    const startingBalance = parseFloat(currentWeekData.starting_balance || 0);
    const totalProfit = currentBalance - startingBalance;
    const profitPct = startingBalance > 0 ? (totalProfit / startingBalance) * 100 : 0;

    // Weekly Progress Mapping
    const weeklyProgress = sortedData.map(item => ({
      week: item.week_number,
      return: parseFloat(item.portfolio_return_pct || 0).toFixed(1),
      target: parseFloat(item.week_target_goal || 5), // Default to 5% if missing
      status: item.badge_earned ? "Goal Met ✓" : (item.portfolio_return_pct >= item.week_target_goal ? "Goal Met ✓" : "Below Target"),
      completed: !!item.badge_earned,
      active: !item.badge_earned // simplified logic
    }));

    // Weekly Badges Mapping
    const weeklyBadges = [1, 2, 3, 4].map(weekNum => {
      const weekData = sortedData.find(d => d.week_number === weekNum);
      return {
        week: weekNum,
        title: weekData?.badge_name || `Week ${weekNum} Badge`,
        description: BADGE_DESCRIPTIONS[weekNum] || "Complete the weekly challenge to unlock.",
        icon: WEEK_ICONS[weekNum] || "🏆",
        unlocked: !!weekData?.badge_earned,
        unlockDate: weekData?.earned_at ? new Date(weekData.earned_at).toISOString().split('T')[0] : null
      };
    });

    // Behavioral Insights (Taking from latest week w/ evaluation)
    const latestEval = currentWeekData.evaluation || {};

    return {
      portfolioChallenge: {
        title: `${currentWeekData.week_title} - Portfolio Challenge`,
        subtitle: `Track your progress toward a ${parseFloat(currentWeekData.week_target_goal || 20)}% return target`,
        metrics: [
          {
            label: `Week ${currentWeekData.week_number} Return`,
            value: `${parseFloat(currentWeekData.portfolio_return_pct || 0).toFixed(2)}%`,
            change: `${parseFloat(currentWeekData.portfolio_return_pct || 0).toFixed(2)}%`,
            icon: TrendingUp,
          },
          {
            label: "Total P&L",
            value: `$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${profitPct > 0 ? '+' : ''}${profitPct.toFixed(1)}%`,
            icon: Target,
          },
          {
            label: "Avg Daily Return",
            value: "+0.31%", // Placeholder / Mock for now as daily data isn't in summary
            change: "+0.31%",
            icon: BarChart3,
          },
          {
            label: "Days to Goal",
            value: "2 days", // Mock for now
            change: "--40%",
            icon: Target,
          },
        ],
        portfolioValue: {
          total: `$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit: `$${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${Math.abs(profitPct).toFixed(1)}%)`,
          starting: `$${startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        progressToGoal: {
          current: parseFloat(currentWeekData.portfolio_return_pct || 0).toFixed(1),
          target: parseFloat(currentWeekData.week_target_goal || 20),
          percentage: Math.min(100, (parseFloat(currentWeekData.portfolio_return_pct || 0) / parseFloat(currentWeekData.week_target_goal || 20)) * 100),
        },
        weeklyProgress: weeklyProgress,
        analysis: [
          // Dynamic analysis based on evaluation if available, else placeholders
          {
            icon: "✓",
            text: latestEval.key_issue
              ? `Focus: ${latestEval.key_issue}`
              : `Currently at ${parseFloat(currentWeekData.portfolio_return_pct || 0).toFixed(1)}% return. Keep pushing!`,
          },
          ...(latestEval.next_challenge_focus || []).map(focus => ({
            icon: "📋",
            text: `Rec: ${focus}`
          }))
        ],
      },
      behavioralInsights: {
        level: latestEval.tier_name || "Initiate", // or map level number
        title: currentWeekData.behavioral_tag || "Trader",
        score: parseFloat(currentWeekData.total_score || 0).toFixed(0),
        capitalUsage: parseFloat(currentWeekData.capital_usage_pct || 0).toFixed(1),
        totalTrades: currentWeekData.total_trades || 0,
        xpPoints: currentWeekData.coins_earned || 0, // Using coins as XP proxy
        progressToNext: {
          current: currentWeekData.coins_earned || 0,
          required: 50000, // Mock target
          percentage: Math.min(100, ((currentWeekData.coins_earned || 0) / 50000) * 100),
        },
        keyInsights: [
          { type: "info", icon: "ℹ️", text: latestEval.key_issue || "Keep trading to generate insights." }
        ],
        tradingStyle: [
          // Mock breakdown until exposed
          { label: "Aggressive", value: 72, color: "from-red-500 to-orange-500" },
          { label: "Risk Management", value: 85, color: "from-green-500 to-emerald-500" },
          { label: "Patience", value: 45, color: "from-yellow-500 to-orange-500" },
        ],
        recommendations: (latestEval.next_challenge_focus || ["Focus on risk management"]).map((rec, i) => ({
          icon: "💡", text: rec, color: ["blue", "green", "purple"][i % 3]
        })),
      },
      stats: {
        badgesEarned: sortedData.filter(d => d.badge_earned).length,
        xpPoints: sortedData.reduce((acc, curr) => acc + (curr.coins_earned || 0), 0),
        currentStreak: 3, // Mock
        completionRate: Math.round((sortedData.filter(d => d.badge_earned).length / 4) * 100),
      },
      journey: {
        currentWeek: currentWeekData.week_number,
        totalWeeks: 4,
        progress: (currentWeekData.week_number / 4) * 100,
      },
      weeklyBadges: weeklyBadges,
    };
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
      <div className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {achievementsData.portfolioChallenge.title}
            </h1>
            <p className="text-purple-300 text-lg">
              {achievementsData.portfolioChallenge.subtitle}
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Portfolio Value & Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Total Portfolio Value */}
              <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {achievementsData.portfolioChallenge.metrics.map(
                    (metric, idx) => (
                      <div
                        key={idx}
                        className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <metric.icon className="text-purple-400" size={24} />
                          <span
                            className={`text-sm font-semibold ${metric.change.startsWith("+")
                              ? "text-green-400"
                              : metric.change.startsWith("-")
                                ? "text-red-400"
                                : "text-purple-300"
                              }`}
                          >
                            {metric.change}
                          </span>
                        </div>
                        <div className="text-sm text-purple-300 mb-1">
                          {metric.label}
                        </div>
                        <div className="text-2xl font-bold">{metric.value}</div>
                      </div>
                    )
                  )}
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-purple-300 mb-2">
                      Total Portfolio Value
                    </h2>
                    <div className="text-4xl font-bold mb-2">
                      {achievementsData.portfolioChallenge.portfolioValue.total}
                    </div>
                    <div className={`${achievementsData.portfolioChallenge.portfolioValue.isProfit ? "text-green-400" : "text-red-400"} font-semibold flex items-center gap-2`}>
                      {achievementsData.portfolioChallenge.portfolioValue.isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {
                        achievementsData.portfolioChallenge.portfolioValue
                          .profit
                      }
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-purple-300 mb-1">
                      Starting Value
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {
                        achievementsData.portfolioChallenge.portfolioValue
                          .starting
                      }
                    </div>
                  </div>
                </div>

                {/* Progress to Goal */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="text-purple-400" size={20} />
                      <span className="font-semibold">
                        Progress to Goal
                      </span>
                    </div>
                    <span className="text-lg font-bold text-purple-400">
                      {achievementsData.portfolioChallenge.progressToGoal.current}% /{" "}
                      {achievementsData.portfolioChallenge.progressToGoal.target}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-900/50 rounded-full h-3">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${achievementsData.portfolioChallenge.progressToGoal.percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 4-Week Challenge Progress */}
              <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-2xl font-bold mb-6">
                  4-Week Challenge Progress
                </h3>
                <div className="space-y-4">
                  {achievementsData.portfolioChallenge.weeklyProgress.map(
                    (week, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-lg border ${week.active
                          ? "bg-purple-900/30 border-purple-500/50"
                          : "bg-black/20 border-purple-500/20"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          {week.active ? (
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-white"></div>
                            </div>
                          ) : (
                            <CheckCircle className="text-green-400" size={24} />
                          )}
                          <div>
                            <div className="font-bold">Week {week.week}</div>
                            {week.active && (
                              <div className="text-sm text-purple-300">
                                Active {week.status === "Goal Met ✓" && "- Goal Met"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-purple-300">
                            Target: +{week.target}%
                          </div>
                          <div className={`font-bold text-lg ${parseFloat(week.return) >= 0 ? "text-green-400" : "text-red-400"}`}>
                            Actual Return: {parseFloat(week.return) > 0 ? "+" : ""}{week.return}%
                          </div>
                        </div>

                        <div>
                          {week.status === "Goal Met ✓" ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                              {week.status}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-semibold">
                              {week.status}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Analysis & Insights */}
              <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-2xl font-bold mb-4">
                  Analysis & Insights
                </h3>
                <div className="space-y-3">
                  {achievementsData.portfolioChallenge.analysis.map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-black/20 rounded-lg"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <p className="text-purple-100">{item.text}</p>
                      </div>
                    )
                  )}
                  {achievementsData.portfolioChallenge.analysis.length === 0 && (
                    <p className="text-gray-400 italic">No analysis available yet. Complete more trades to generate insights.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Behavioral Insights Card */}
            <div className="space-y-6">
              <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">

                <div className="mb-4">
                  <h3 className="font-bold text-xl ">Behavioral Insights</h3>
                </div>
                <div className="text-center mb-4">

                  <div className="flex">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-5xl">🛡️</span>
                    </div>

                    <div>

                      <div className="text-sm text-purple-300 mb-1">
                        Level {achievementsData.behavioralInsights.level}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        {achievementsData.behavioralInsights.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-purple-300">Score:</span>
                        <span className="text-3xl font-bold text-yellow-400">
                          {achievementsData.behavioralInsights.score}
                        </span>


                      </div>
                    </div>



                  </div>

                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-300 mb-1">Capital</div>
                    <div className="text-lg font-bold text-purple-400">
                      {achievementsData.behavioralInsights.capitalUsage}%
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-300 mb-1">Trades</div>
                    <div className="text-lg font-bold text-blue-400">
                      {achievementsData.behavioralInsights.totalTrades}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-300 mb-1">XP</div>
                    <div className="text-lg font-bold text-orange-400">
                      {achievementsData.behavioralInsights.xpPoints}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentView("badges")}
                  className="w-full border border-[#FF3BD4] text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
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
