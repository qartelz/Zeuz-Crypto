import React, { useState } from "react";
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
} from "lucide-react";

// Mock data for achievements
const achievementsData = {
  portfolioChallenge: {
    title: "Week 4 - Portfolio Performance Challenge",
    subtitle: "Track your progress toward a 20% total return across 4 weeks",
    metrics: [
      {
        label: "Week 4 Return",
        value: "+2.17%",
        change: "+2.17%",
        icon: TrendingUp,
      },
      {
        label: "Total P&L",
        value: "$1,750",
        change: "+17.5%",
        icon: Target,
      },
      {
        label: "Avg Daily Return",
        value: "+0.31%",
        change: "+0.31%",
        icon: BarChart3,
      },
      {
        label: "Days to Goal",
        value: "2 days",
        change: "--40%",
        icon: Target,
      },
    ],
    portfolioValue: {
      total: "$11,750",
      profit: "$1,750 (17.5%)",
      starting: "$10,000",
    },
    progressToGoal: {
      current: 17.5,
      target: 20,
      percentage: 87.5,
    },
    weeklyProgress: [
      {
        week: 1,
        return: 5.2,
        target: 5,
        status: "Goal Met ✓",
        completed: true,
      },
      {
        week: 2,
        return: 5.2,
        target: 5,
        status: "Below Target",
        completed: true,
      },
      {
        week: 3,
        return: 5.2,
        target: 5,
        status: "Goal Met ✓",
        completed: true,
      },
      { week: 4, return: 5.2, target: 5, status: "Below Target", active: true },
    ],
    analysis: [
      {
        icon: "✓",
        text: "On track for good Currently at 17.5% total return, need 2.5% more to reach 20% target",
      },
      {
        icon: "📋",
        text: "Strategy recommendation: With only 2 days left, consider maintaining balanced approach to secure remaining 2.5% safely",
      },
      {
        icon: "⚠",
        text: "Risk assessment: Week 4 performance is slightly behind target (2% vs 5%). Adjust position sizes if needed",
      },
      {
        icon: "✓",
        text: "Consistency check: Positive daily returns showing good discipline and execution",
      },
    ],
  },
  behavioralInsights: {
    level: 3,
    title: "ZeuZ Wave Hopper",
    score: 3110,
    capitalUsage: 68,
    totalTrades: 42,
    xpPoints: 2250,
    progressToNext: {
      current: 2250,
      required: 3000,
      percentage: 75,
    },
    keyInsights: [
      {
        type: "positive",
        icon: "✓",
        text: "Wait for full candle closes meet key levels",
      },
      {
        type: "warning",
        icon: "⚠",
        text: "Overtrading detected: 42 trades in 2 days exceeds optimal range",
      },
      {
        type: "positive",
        icon: "✓",
        text: "Good risk management: Average loss kept below 2%",
      },
      {
        type: "negative",
        icon: "✗",
        text: "Inconsistent position sizing across trades",
      },
    ],
    tradingStyle: [
      { label: "Aggressive", value: 72, color: "from-red-500 to-orange-500" },
      {
        label: "Risk Management",
        value: 85,
        color: "from-green-500 to-emerald-500",
      },
      { label: "Patience", value: 45, color: "from-yellow-500 to-orange-500" },
    ],
    recommendations: [
      {
        icon: "💡",
        text: "Focus on fewer, high-quality trades",
        color: "blue",
      },
      {
        icon: "📈",
        text: "Maintain consistent position sizing",
        color: "green",
      },
      {
        icon: "⏰",
        text: "Wait for complete candle confirmations",
        color: "purple",
      },
    ],
  },
  stats: {
    badgesEarned: 4,
    xpPoints: 750,
    currentStreak: 3,
    completionRate: 28,
  },
  journey: {
    currentWeek: 2,
    totalWeeks: 4,
    progress: 50,
  },
  weeklyBadges: [
    {
      week: 1,
      title: "Crypto Explorer",
      description:
        "Master the basics of cryptocurrency and spot trading fundamentals",
      icon: "🛡️",
      unlocked: true,
      unlockDate: "2025-10-15",
    },
    {
      week: 2,
      title: "Wave Hopper",
      description:
        "Successfully navigate market volatility and complete multiple challenges",
      icon: "🌊",
      unlocked: false,
      unlockDate: null,
    },
    {
      week: 3,
      title: "Risk Tamer",
      description: "Demonstrate advanced risk management in futures trading",
      icon: "⚡",
      unlocked: false,
      unlockDate: null,
    },
    {
      week: 4,
      title: "Portfolio Master",
      description:
        "Achieve consistent returns through balanced portfolio management",
      icon: "👑",
      unlocked: false,
      unlockDate: null,
    },
  ],
};

export default function Achievements() {
  const [currentView, setCurrentView] = useState("portfolio"); // 'portfolio' or 'badges'

  // Portfolio Performance Challenge View (First Page)
  if (currentView === "portfolio") {
    return (
      <div className="min-h-screen  text-white p-6">
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
                            className={`text-sm font-semibold ${
                              metric.change.startsWith("+")
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
                    <div className="text-green-400 font-semibold flex items-center gap-2">
                      <TrendingUp size={20} />
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

                {/* Progress to 20% Goal */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="text-purple-400" size={20} />
                      <span className="font-semibold">
                        Progress to 20% Goal
                      </span>
                    </div>
                    <span className="text-lg font-bold text-purple-400">
                      {
                        achievementsData.portfolioChallenge.progressToGoal
                          .current
                      }
                      % /{" "}
                      {
                        achievementsData.portfolioChallenge.progressToGoal
                          .target
                      }
                      %
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
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          week.active
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
                                Active
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-purple-300">
                            Target: +{week.target}%
                          </div>
                          <div className="font-bold text-lg text-green-400">
                            Actual Return: +{week.return}%
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

              {/* Week 4 Analysis & Insights */}
              <div className="bg-[#10081C] backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-2xl font-bold mb-4">
                  Week 4 Analysis & Insights
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
  View Full Behavioral Insights
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
    <div className="min-h-screen  text-white p-6">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${
                      week <= achievementsData.journey.currentWeek
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {week}
                  </div>
                  <div
                    className={`text-sm ${
                      week <= achievementsData.journey.currentWeek
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
                className={`bg-gradient-to-br backdrop-blur-sm border rounded-2xl p-6 transition-all hover:scale-105 ${
                  badge.unlocked
                    ? "from-purple-900/60 to-indigo-900/60 border-purple-500/50 shadow-lg shadow-purple-500/20"
                    : "from-gray-900/40 to-gray-800/40 border-gray-600/30 opacity-60"
                }`}
              >
                {/* Badge Icon */}
                <div className="relative mb-4">
                  <div
                    className={`w-32 h-32 mx-auto rounded-2xl flex items-center justify-center ${
                      badge.unlocked
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

        {/* Detailed Behavioral Insights Section */}
        
      </div>
    </div>
  );
}
