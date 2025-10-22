import React, { useState } from "react";
import {
  Trophy,
  Star,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Play,
  Check,
} from "lucide-react";

// Sample challenge data organized by weeks
const weeklyData = {
  week1: {
    title: "Week 1 Challenges",
    challenges: [
      {
        id: "spot-sprint-eth-btc",
        title: "Spot Sprint – ETH/BTC",
        difficulty: "★★★★★",
        level: "Beginner",
        category: "Spot Trading",
        mission: {
          startingCapital: "ZC 10,00,000",
          targetPnL: "+7% Minimum",
          timeLimit: "24 Hours",
          allowedPairs: "ETH/BTC Only",
        },
        timerBehavior:
          'Starts the moment a trade is executed (not when you click "Start Challenge").',
        rewards: {
          xpGained: "+75 XP",
          unlocks: "Bronze badge",
          zeuzCoins: "+10000 ZC",
          levelProgress: "Level 3: Risk Tamer",
          nextUnlock: "Futures Sprint - BTC/USDT at Level 4",
          xpProgress: "2250/3000XP",
        },
        prerequisites: [
          { text: 'Completed "Spot BasicsBTC/USDT"', completed: true },
          { text: "XP Level 2 or higher (Current: Level 2)", completed: true },
          { text: "No active challenges in progress", completed: true },
        ],
        coinIncentive: {
          loss: "10,000 ZC",
          profit: "75,000 ZC",
        },
        scoringSystem: {
          type: "Profit Based Score",
          tiers: [
            {
              name: "Firecracker",
              range: "76 - 100%",
              color: "text-orange-400",
            },
            {
              name: "Wave Hopper",
              range: "51 - 75%",
              color: "text-yellow-400",
            },
            { name: "Coin Scout", range: "26 - 50%", color: "text-blue-400" },
            {
              name: "Byte Bouncer",
              range: "16 - 28%",
              color: "text-purple-400",
            },
          ],
          currentScore: 10,
        },
        challengeTiers: [
          { name: "Bronze", level: "Beginner - Level 1", unlocked: true },
          { name: "Silver", level: "Intermediate - Level 2", unlocked: false },
          { name: "Gold", level: "Advanced - Level 3", unlocked: false },
        ],
        status: "available",
      },
      {
        id: "spot-basics-btc-usdt",
        title: "Spot Basics – BTC/USDT",
        difficulty: "★★★",
        level: "Beginner",
        category: "Spot Trading",
        mission: {
          startingCapital: "ZC 5,00,000",
          targetPnL: "+5% Minimum",
          timeLimit: "12 Hours",
          allowedPairs: "BTC/USDT Only",
        },
        status: "locked",
      },
      {
        id: "spot-multi-pair",
        title: "Multi-Pair Mastery – ETH/BTC/USDT",
        difficulty: "★★★★",
        level: "Intermediate",
        category: "Spot Trading",
        mission: {
          startingCapital: "ZC 15,00,000",
          targetPnL: "+10% Minimum",
          timeLimit: "48 Hours",
          allowedPairs: "ETH/BTC/USDT",
        },
        status: "locked",
      },
    ],
  },
  week2: {
    title: "Week 2 Challenges",
    challenges: [
      {
        id: "futures-intro",
        title: "Futures Introduction – BTC/USDT",
        difficulty: "★★★★",
        level: "Intermediate",
        category: "Futures Trading",
        mission: {
          startingCapital: "ZC 20,00,000",
          targetPnL: "+8% Minimum",
          timeLimit: "24 Hours",
          allowedPairs: "BTC/USDT Only",
        },
        status: "locked",
      },
      {
        id: "leverage-basics",
        title: "Leverage Basics – 2x Trading",
        difficulty: "★★★★★",
        level: "Intermediate",
        category: "Futures Trading",
        status: "locked",
      },
    ],
  },
  week3: {
    title: "Week 3 Challenges",
    challenges: [
      {
        id: "advanced-futures",
        title: "Advanced Futures – Multi-Asset",
        difficulty: "★★★★★",
        level: "Advanced",
        category: "Futures Trading",
        status: "locked",
      },
    ],
  },
  week4: {
    title: "Week 4 Challenges",
    challenges: [
      {
        id: "portfolio-master",
        title: "Portfolio Performance Focus",
        difficulty: "★★★★★",
        level: "Expert",
        category: "Portfolio Management",
        status: "locked",
      },
    ],
  },
};

export default function Challenges() {
  const [selectedWeek, setSelectedWeek] = useState("week1");
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const currentWeekData = weeklyData[selectedWeek];

  // View detailed challenge
  const viewChallengeDetails = (challenge) => {
    setSelectedChallenge(challenge);
  };

  // Challenge Detail View
  if (selectedChallenge) {
    return (
      <div className="min-h-screen text-white">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setSelectedChallenge(null)}
            className="mb-3 text-purple-400 hover:text-white hover:bg-purple-700/20 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            ← Back to Challenges
          </button>

          {/* --- First Row: Header + Start Button --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-6">
            {/* Header Section */}
            <div className="lg:col-span-2 p-6">
              <h1 className="text-3xl font-bold mb-3">
                {selectedChallenge.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-yellow-400">
                  {selectedChallenge.difficulty}
                </div>
                <span className="px-3 py-1 font-bold text-[#B13DFF] rounded-full text-sm">
                  {selectedChallenge.level}
                </span>
                <span className="px-3 py-1 border border-[#6034A6] rounded-full text-sm">
                  {selectedChallenge.category}
                </span>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center lg:justify-end items-center px-6">
              <button className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg">
                <Play size={24} />
                Start Challenge
              </button>
            </div>
          </div>

          {/* --- Second Row Onward: Remaining Sections --- */}
          <div className="flex w-full flex-1 justify-between gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 w-10/12 space-y-6">
              {/* Your Mission */}
              <div className="bg-[#10081C] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Target className="" size={28} />
                  Your Mission
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">
                      Starting Capital
                    </div>
                    <div className="text-2xl font-bold text-[#E43800]">
                      {selectedChallenge.mission.startingCapital}
                    </div>
                    <div className="text-xs mt-1">(Locked for challenge)</div>
                  </div>
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">
                      Target PnL
                    </div>
                    <div className="text-2xl font-bold text-[#7A00E4]">
                      {selectedChallenge.mission.targetPnL}
                    </div>
                    <div className="text-xs mt-1">from entry</div>
                  </div>
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">
                      Time Limit
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {selectedChallenge.mission.timeLimit}
                    </div>
                    <div className="text-xs mt-1">Starts on first trade</div>
                  </div>
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">
                      Allowed Pairs
                    </div>
                    <div className="text-2xl font-bold text-[#F3AD0A]">
                      {selectedChallenge.mission.allowedPairs}
                    </div>
                    <div className="text-xs text-purple-400 mt-1">Only</div>
                  </div>
                </div>

                {/* Timer Behavior */}
                <div className="mt-6 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <h3 className="font-semibold text-green-400 mb-1">
                        Timer Behavior
                      </h3>
                      <p className="text-sm text-purple-200">
                        {selectedChallenge.timerBehavior}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards & Unlocks */}
              <div className="flex gap-2 w-full">
                <div className=" border w-2/4  bg-[#10081C] border-purple-500/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-6">Rewards & Unlocks</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center ">
                      <div className="w-16 h-16 mx-auto mb-3 border rounded-full flex items-center justify-center">
                        <Trophy className="text-yellow-400" size={32} />
                      </div>
                      <div className="text-sm text-purple-300 mb-1">
                        XP Gained
                      </div>
                      <div className="text-xl font-bold text-orange-400">
                        {selectedChallenge.rewards.xpGained}
                      </div>
                    </div>
                    <div className="text-center b">
                      <div className="w-16 h-16 mx-auto mb-3 border rounded-full flex items-center justify-center">
                        <span className="text-3xl">🛡️</span>
                      </div>
                      <div className="text-sm text-purple-300 mb-1">
                        Unlocks
                      </div>
                      <div className="text-xl font-bold text-orange-400">
                        {selectedChallenge.rewards.unlocks}
                      </div>
                    </div>
                    <div className="text-center ">
                      <div className="w-16 h-16 mx-auto mb-3 border rounded-full flex items-center justify-center">
                        <span className="text-3xl">₿</span>
                      </div>
                      <div className="text-sm text-purple-300 mb-1">
                        ZeuZ Coins
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {selectedChallenge.rewards.zeuzCoins}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="font-semibold text-green-400 mb-2">
                      {selectedChallenge.rewards.levelProgress}
                    </div>
                    <div className="w-full bg-purple-900/50 rounded-full h-2 mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: "75%" }}
                      />
                    </div>
                    <div className="text-sm text-purple-300">
                      {selectedChallenge.rewards.xpProgress}
                    </div>
                  </div>

                  <div className="text-sm text-purple-300 ">
                    Next Unlock: {selectedChallenge.rewards.nextUnlock}
                  </div>
                </div>

                <div className=" space-y-2 w-2/4 ">
                  {/* Prerequisites */}
                  <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
                    <div className="space-y-3">
                      {selectedChallenge.prerequisites.map((prereq, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3  rounded-lg p-3 "
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              prereq.completed ? "bg-green-500" : "bg-gray-600"
                            }`}
                          >
                            {prereq.completed && <Check size={16} />}
                          </div>
                          <span
                            className={
                              prereq.completed ? "text-white" : "text-gray-400"
                            }
                          >
                            {prereq.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coin Incentive System */}
                  <div className="border bg-[#10081C] border-purple-500/30 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold mb-4">
                      Coin Incentive System
                    </h2>

                    <div className="flex flex-col divide-y divide-purple-500/80 rounded-xl overflow-hidden">
                      {/* Loss Box */}
                      <div className=" flex justify-between">
                        <div className="text-sm  mb-1">Loss</div>
                        <div className="text-sm font-bold ">
                          {selectedChallenge.coinIncentive.loss}
                        </div>
                      </div>

                      {/* Profit Box */}
                      <div className=" flex justify-between">
                        <div className="text-sm mb-1">Profit</div>
                        <div className="text-sm font-bold 0">
                          {selectedChallenge.coinIncentive.profit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-2 ">
              <div className="space-y-2 w-full">
                {/* Scoring System */}
                <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-2">Scoring System</h3>
                  <p className="text-sm text-red-400 mb-4">
                    {selectedChallenge.scoringSystem.type}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-300">Profit ➡️</span>
                      <span className="font-semibold">Score</span>
                    </div>
                    {selectedChallenge.scoringSystem.tiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-purple-500/20"
                      >
                        <span className={tier.color}>{tier.name}</span>
                        <span className="text-purple-300 text-sm">
                          {tier.range}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Score</span>
                      <span className="text-2xl font-bold text-orange-400">
                        {selectedChallenge.scoringSystem.currentScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Challenge Tiers */}
                <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">Challenge Tiers</h3>
                  <div className="space-y-3">
                    {selectedChallenge.challengeTiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          tier.unlocked
                            ? "bg-orange-900/20 border-orange-500/30"
                            : "bg-gray-900/20 border-gray-500/30"
                        }`}
                      >
                        <span className="text-2xl">
                          {tier.name === "Bronze"
                            ? "🥉"
                            : tier.name === "Silver"
                            ? "🥈"
                            : "🥇"}
                        </span>
                        <div className="flex-1">
                          <div
                            className={`font-semibold ${
                              tier.unlocked
                                ? "text-orange-400"
                                : "text-gray-400"
                            }`}
                          >
                            {tier.name}
                          </div>
                          <div className="text-xs text-purple-300">
                            {tier.level}
                          </div>
                        </div>
                        {!tier.unlocked && (
                          <Lock size={16} className="text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Challenges List View
  return (
    <div className="min-h-screen text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Challenges</h1>
          <p className="text-purple-300 text-lg">
            ZeuzCrypto Challenges – Learn, Trade & Earn
          </p>
        </div>

        {/* Week Selector */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(weeklyData).map((week, idx) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`p-2 rounded-xl border transition-all ${
                  selectedWeek === week
                    ? "bg-purple-900/30 border-purple-500 shadow-md shadow-purple-800/30"
                    : " border-purple-500/30 hover:border-purple-400/50"
                }`}
              >
                <div className="text-xl font-bold mb-1">Week {idx + 1}</div>
                <div className="text-xs text-purple-300">
                  {weeklyData[week].challenges.length} Challenge
                  {weeklyData[week].challenges.length > 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{currentWeekData.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentWeekData.challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border rounded-2xl p-6 transition-all ${
                  challenge.status === "locked"
                    ? "border-gray-600/30 opacity-60"
                    : challenge.status === "completed"
                    ? "border-green-500/30"
                    : "border-purple-500/30 hover:border-purple-400/50 cursor-pointer"
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  {challenge.status === "completed" && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Check size={14} /> Completed
                    </span>
                  )}
                  {challenge.status === "locked" && (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Lock size={14} /> Locked
                    </span>
                  )}
                  {challenge.status === "available" && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                      Available
                    </span>
                  )}
                </div>

                {/* Challenge Info */}
                <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    {challenge.difficulty}
                  </div>
                  <span className="px-2 py-1 bg-purple-600 rounded text-xs">
                    {challenge.level}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="px-3 py-1 bg-indigo-600 rounded-full text-xs">
                    {challenge.category}
                  </span>
                </div>

                {/* Quick Mission Info */}
                {challenge.mission && (
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between text-purple-300">
                      <span>Capital:</span>
                      <span className="font-semibold text-white">
                        {challenge.mission.startingCapital}
                      </span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Target:</span>
                      <span className="font-semibold text-pink-400">
                        {challenge.mission.targetPnL}
                      </span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Time:</span>
                      <span className="font-semibold text-green-400">
                        {challenge.mission.timeLimit}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {challenge.status === "available" && (
                  <button
                    onClick={() => viewChallengeDetails(challenge)}
                    className="w-full bg-purple-600 hover:bg-purple-700 border-1 border-white/20 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    View Challenge
                  </button>
                )}
                {challenge.status === "completed" && (
                  <button
                    onClick={() => viewChallengeDetails(challenge)}
                    className="w-full bg-green-500/20 border border-green-500/50 text-green-400 font-semibold py-3 rounded-lg"
                  >
                    View Details
                  </button>
                )}
                {challenge.status === "locked" && (
                  <button
                    disabled
                    className="w-full bg-gray-700/30 text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock size={16} />
                    Locked
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
