
import React, { useState, useEffect } from "react";
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
  Loader2,
  Wallet,
  ArrowLeft,
  LineChart,
} from "lucide-react";
import Trading from "../components/common/Trading";
import OrderHistory from "./OrderHistory";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;


export default function Challenges() {
  const [selectedWeek, setSelectedWeek] = useState(undefined);
  console.log(selectedWeek, "the selected week");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isChallengeStarted, setIsChallengeStarted] = useState(false);
  const [showHoldings, setShowHoldings] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  // Update the fetchWalletData function to accept a weekId parameter
  const fetchWalletData = async (participationId) => {
    if (!participationId) return;

    setWalletLoading(true);

    console.log(participationId,"participation Idddddddddddd")
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(`${baseURL}challenges/wallets/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("All wallets:", data);

        // Find the wallet matching the provided participation ID
        const currentWallet = data.results.find(
          (wallet) => wallet.participation_id === participationId
        );

        console.log("Matched wallet:", currentWallet);
        setWalletData(currentWallet || null); // Set to null if not found
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      setWalletData(null); // Set to null on error
    } finally {
      setWalletLoading(false);
    }
  };

  // Update the useEffect for selectedChallenge
  useEffect(() => {
    if (selectedChallenge?.participationId) {
      fetchWalletData(selectedChallenge.participationId);
    } else {
      setWalletData(null); // Clear wallet data if no participation ID
    }
  }, [selectedChallenge]);

  // Update the useEffect for the main page when selectedWeek changes
  useEffect(() => {
    if (selectedWeek && !selectedChallenge) {
      // First fetch user progress to get the participation ID
      fetchUserProgress(selectedWeek).then((progressData) => {

        if (progressData && !progressData.error && progressData.id) {
          fetchWalletData(progressData.id);
        } else {
          setWalletData(null); // No participation, clear wallet
        }
      });
    }
  }, [selectedWeek, selectedChallenge]);

  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [weeksData, setWeeksData] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  console.log(userProgress,"the user progress")
  const [joiningChallenge, setJoiningChallenge] = useState(false);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Fetch weeks when program is loaded
  useEffect(() => {
    if (programData?.id) {
      fetchWeeks(programData.id);
    }
  }, [programData?.id]); // Only depend on the ID, not the entire object

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      console.log("Fetching programs from:", `${baseURL}challenges/programs/`);
      console.log("Auth tokens:", tokens);

      const response = await fetch(`${baseURL}challenges/programs/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      const data = await response.json();
      console.log("Programs API Response:", data);

      // Find BEGINNER difficulty program
      const beginnerProgram = data.results?.find(
        (program) => program.difficulty === "BEGINNER"
      );

      console.log("Selected BEGINNER program:", beginnerProgram);

      if (beginnerProgram) {
        setProgramData(beginnerProgram);
      } else {
        setError("No beginner program found");
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError("Failed to load programs: " + err.message);
    }
  };

  const fetchWeeks = async (programId) => {
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const url = `${baseURL}challenges/weeks/?program_id=${programId}`;

      console.log("Fetching weeks from:", url);
      console.log("Auth tokens:", tokens);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      const data = await response.json();
      console.log("Weeks API Response:", data);

      // Sort by week number
      const sortedWeeks = data.sort((a, b) => a.week_number - b.week_number);
      console.log("Sorted weeks:", sortedWeeks);

      setWeeksData(sortedWeeks);

      // Set first week as selected by default
      if (sortedWeeks.length > 0 && selectedWeek === undefined) {
        setSelectedWeek(sortedWeeks[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching weeks:", err);
      setError("Failed to load weeks: " + err.message);
      setLoading(false);
    }
  };

  const fetchUserProgress = async (weekId) => {
    try {
       const tokens = JSON.parse(localStorage.getItem("authTokens")); 
      const url = `${baseURL}challenges/weeks/${weekId}/user_progress/`;

      console.log("Fetching user progress from:", url);
      console.log("Auth tokens:", tokens);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      const data = await response.json();
      console.log("User Progress API Response:", data);

      if (data.error) {
        console.log("User not participating in challenge");
        setUserProgress(null);
      } else {
        setUserProgress(data);
      }

      return data;
    } catch (err) {
      console.error("Error fetching user progress:", err);
      setUserProgress(null);
      return null;
    }
  };

  const joinChallenge = async (weekId) => {
    try {
      setJoiningChallenge(true);
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const url = `${baseURL}challenges/weeks/${weekId}/join/`;

      console.log("Joining challenge:", url);
      console.log("Auth tokens:", tokens);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({
          initial_balance: 10000,
        }),
      });

      const data = await response.json();
      console.log("Join Challenge API Response:", data);
      if (data.error) {
        toast.error(data.error, {
          duration: 4000,
          position: "top-center",
          style: {
            background: "#1f1730",
            color: "#fff",
            border: "1px solid #ef4444",
          },
        });
      } else {
        setUserProgress(data);

        if (selectedChallenge && data.id) {
          setSelectedChallenge(prev => ({
            ...prev,
            participationId: data.id
          }));
        }
        
        // Refetch wallet data with the new participation ID
        if (data.id) {
          fetchWalletData(data.id);
        }

         // Refetch wallet data with the new participation ID
  if (data.id) {
    fetchWalletData(data.id);
  }
        toast.success("Successfully joined the challenge!", {
          duration: 4000,
          position: "top-center",
          style: {
            background: "#1f1730",
            color: "#fff",
            border: "1px solid #22c55e",
          },
        });
      }
      
      setJoiningChallenge(false);

    } catch (err) {
  console.error("Error joining challenge:", err);
  toast.error("Failed to join challenge: " + err.message, {
    duration: 4000,
    position: "top-center",
    style: {
      background: "#1f1730",
      color: "#fff",
      border: "1px solid #ef4444",
    },
  });
  setJoiningChallenge(false);
}
  };

  const getWeekTradingRules = (weekNumber) => {
    const rules = {
      1: {
        pairs: "Spot Trading Only",
        trades: "Make at least 5 trades (buy/sell) using Spot Market only",
      },
      2: {
        pairs: "Spot + Futures Trading",
        trades: "Execute at least 3 spot trades + 2 futures trades",
      },
      3: {
        pairs: "Spot + Futures + Options",
        trades: "Make at least 3 Spot + 2 Futures + 2 Options trade",
      },
      4: {
        pairs: "Spot + Futures + Options",
        trades: "Advanced portfolio management across all trading types",
      },
    };

    return rules[weekNumber] || rules[1];
  };

  const [loadingChallengeId, setLoadingChallengeId] = useState(null);

  const viewChallengeDetails = async (task, weekData) => {
    if (loadingChallengeId) return; // prevent multiple concurrent clicks
    setLoadingChallengeId(task.id); // mark only this task as loading

    try {
      console.log("Selected Task:", task);
      console.log("Week Data:", weekData);

      const subscription = JSON.parse(localStorage.getItem("subscription"));

      if (!subscription || subscription.status !== "ACTIVE") {
        toast.error(
          "You don't have an active subscription to view this challenge",
          {
            duration: 4000,
            position: "top-center",
            style: {
              background: "#1f1730",
              color: "#fff",
              border: "1px solid #9333ea",
              minWidth: "500px",
              whiteSpace: "nowrap",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          }
        );
        return;
      }

      const userProgressData = await fetchUserProgress(weekData.id);
      const weekRules = getWeekTradingRules(weekData.week_number);

      const transformedChallenge = {
        id: task.id,
        participationId: userProgressData?.id || null,
        title: task.title,
        difficulty: "★★★★★",
        level: programData?.difficulty || "Beginner",
        category: weekData.trading_type,
        mission: {
          targetPnL: `+${weekData.target_goal}% Minimum`,
          startDate: new Date(weekData.start_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          endDate: new Date(weekData.end_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          allowedPairs: weekRules.pairs,
          minTrades: weekRules.trades,
        },
        timerBehavior: task.description,
        rewards: {
          badgeName: weekData.reward?.badge_name || "No badge",
          badgeDescription: weekData.reward?.badge_description || "",
          profitCoins: weekData.reward?.profit_bonus_coins || 0,
          lossCoins: weekData.reward?.loss_recovery_coins || 0,
          levelProgress: "Level 3: Risk Tamer",
          nextUnlock: "Next Challenge at Level 4",
          xpProgress: "2250/3000XP",
        },
        prerequisites: [
          { text: "Completed previous challenges", completed: true },
          { text: "Minimum trades requirement met", completed: true },
          { text: "No active challenges in progress", completed: true },
        ],
        coinIncentive: {
          loss: `${weekData.reward?.loss_recovery_coins || 0} ZC`,
          profit: `${weekData.reward?.profit_bonus_coins || 0} ZC`,
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
        weekData: weekData,
        taskData: task,
      };

      setSelectedChallenge(transformedChallenge);
    } catch (error) {
      console.error("Error loading challenge details:", error);
    } finally {
      setLoadingChallengeId(null); // reset when done
    }
  };

  const calculateTimeLimit = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "24 Hours";
    if (diffDays < 7) return `${diffDays} Days`;
    return `${Math.floor(diffDays / 7)} Week${
      Math.floor(diffDays / 7) > 1 ? "s" : ""
    }`;
  };

  const getCurrentWeekData = () => {
    const currentWeek = weeksData.find((week) => week.id === selectedWeek);
    console.log("Current Week Data:", currentWeek);
    return currentWeek;
  };

  const handleChallengeAction = () => {
    console.log("User Progress:", userProgress);

    if (!userProgress || userProgress.error) {
      // Join challenge
      console.log("Joining challenge for week:", selectedChallenge.weekData.id);
      joinChallenge(selectedChallenge.weekData.id);
    } else if (userProgress.status === "IN_PROGRESS") {
      // Continue challenge
      console.log("Continuing challenge");
      setIsChallengeStarted(true);
    } else {
      // Start challenge
      console.log("Starting challenge");
      setIsChallengeStarted(true);
    }
  };

  const getChallengeButtonText = () => {
    if (!userProgress || userProgress.error) {
      return "Join Challenge";
    } else if (userProgress.status === "IN_PROGRESS") {
      return "Continue Challenge";
    }
    return "Start Challenge";
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-purple-300">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isChallengeStarted && selectedChallenge) {
    return (
      <div className="min-h-screen text-white">
        <Trading
          selectedChallenge={selectedChallenge}
          isChallengeStarted={isChallengeStarted}
          setIsChallengeStarted={setIsChallengeStarted}
          walletData={walletData}
          walletLoading={walletLoading}
          refreshChallengeWallet={fetchWalletData}
        />
      </div>
    );
  }

  if (showHoldings) {
    return (
      <div className="min-h-screen text-white p-4">
        <div className="flex items-start justify-between gap-6">
          {/* Back Button */}
          <button
            onClick={() => setShowHoldings(false)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all self-start"
          >
            ← Back to Challenges
          </button>

          {/* Wallet Info */}
          {walletData && userProgress && !userProgress.error && (
            <div className="rounded-xl p-3 border shadow-lg border-purple-500/40 transition-all min-w-[420px]">
              {walletLoading ? (
                <div className="flex flex-col items-center justify-center h-[120px]">
                  <Loader2
                    className="animate-spin text-purple-400 mb-3"
                    size={32}
                  />
                  <p className="text-sm text-gray-300 font-medium">
                    Loading wallet...
                  </p>
                </div>
              ) : (
                <div className="h-[120px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-purple-400" />
                      {walletData.week_title} Wallet
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Available */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-green-500/30 transition-all">
                      <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                        Available
                      </p>
                      <p className="text-lg font-bold text-green-400 tabular-nums">
                        {parseFloat(
                          walletData.available_balance
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Locked */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-yellow-500/30 transition-all">
                      <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                        Locked
                      </p>
                      <p className="text-lg font-bold text-yellow-400 tabular-nums">
                        {parseFloat(walletData.locked_balance).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>

                    {/* Earned */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-blue-500/30 transition-all">
                      <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                        Earned
                      </p>
                      <p className="text-lg font-bold text-blue-400 tabular-nums">
                        {parseFloat(walletData.earned_balance).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={walletData ? "-mt-16" : "mt-0"}>
          <OrderHistory
            selectedChallenge={selectedChallenge}
            walletData={walletData}
            walletLoading={walletLoading}
          />
        </div>
      </div>
    );
  }

  const currentWeekData = getCurrentWeekData();

  // Challenge Detail View
  if (selectedChallenge) {
    return (
      <div className="min-h-screen text-white">
        <div className="max-w-7xl mx-auto">
          {/* <button
            onClick={() => setSelectedChallenge(null)}
            className="mb-3 text-purple-400 hover:text-white hover:bg-purple-700/20 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            ← Back to Challenges
          </button>
          <button
              onClick={() => setShowHoldings(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Holdings
            </button> */}

          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              onClick={() => setSelectedChallenge(null)}
              className="flex items-center gap-2 text-purple-400 hover:text-white hover:bg-purple-700/20 border border-purple-700/30 px-4 py-2 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Challenges</span>
            </button>

            {/* Holdings Button */}
            <button
              onClick={() => setShowHoldings(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <LineChart className="w-5 h-5" />
              <span>Weekly Trades</span>
            </button>
          </div>

          {/* First Row: Header + Action Button */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center ">
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

              <div className="flex  justify-start lg:justify-start items-start py-6">
                <button
                  onClick={handleChallengeAction}
                  disabled={joiningChallenge}
                  className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joiningChallenge ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      {getChallengeButtonText()}
                    </>
                  )}
                </button>
              </div>
            </div>

            {walletData && (
              <div className="  rounded-xl p-3 border shadow-lg border-purple-500/40 transition-all  min-w-[420px]">
                {walletLoading ? (
                  <div className="flex flex-col items-center justify-center h-[120px]">
                    <Loader2
                      className="animate-spin text-purple-400 mb-3"
                      size={32}
                    />
                    <p className="text-sm text-gray-300 font-medium">
                      Loading wallet...
                    </p>
                  </div>
                ) : (
                  <div className="h-[120px] flex flex-col justify-">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-purple-400" />
                        {walletData.week_title} Wallet
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-green-500/30 transition-all">
                        <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                          Available
                        </p>
                        <p className="text-lg font-bold text-green-400 tabular-nums">
                          {parseFloat(
                            walletData.available_balance
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-yellow-500/30 transition-all">
                        <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                          Locked
                        </p>
                        <p className="text-lg font-bold text-yellow-400 tabular-nums">
                          {parseFloat(walletData.locked_balance).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-blue-500/30 transition-all">
                        <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                          Earned
                        </p>
                        <p className="text-lg font-bold text-blue-400 tabular-nums">
                          {parseFloat(walletData.earned_balance).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex w-full flex-1 justify-between gap-6">
            <div className="lg:col-span-2 w-10/12 space-y-6">
              {/* Your Mission */}
              <div className="bg-[#10081C] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Target className="" size={28} />
                  Your Mission
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Start Date
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      {selectedChallenge.mission.startDate}
                    </div>
                  </div>
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">End Date</div>
                    <div className="text-xl font-bold text-red-400">
                      {selectedChallenge.mission.endDate}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-purple-500/20 rounded-xl">
                    <div className="text-sm text-purple-300 mb-2">
                      Allowed Pairs
                    </div>
                    <div className="text-lg font-bold text-[#F3AD0A]">
                      {selectedChallenge.mission.allowedPairs}
                    </div>
                  </div>
                  <div className="p-4 border border-purple-500/20 rounded-xl">
                    <div className="text-sm text-purple-300 mb-2">
                      Minimum Trades
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {selectedChallenge.mission.minTrades}
                    </div>
                  </div>
                </div>

                {/* Task Description */}
                {selectedChallenge.timerBehavior && (
                  <div className="mt-6 p-4 border border-purple-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <h3 className="font-semibold text-green-400 mb-1">
                          Task Description
                        </h3>
                        <p className="text-sm text-purple-200">
                          {selectedChallenge.timerBehavior}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards & Unlocks */}
              <div className="flex gap-2 w-full">
                {selectedChallenge.rewards && (
                  <div className="border w-2/4 bg-[#10081C] border-purple-500/30 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold mb-6">
                      Rewards & Unlocks
                    </h2>

                    {selectedChallenge.rewards.badgeName !== "No badge" && (
                      <div className="mb-6 text-center">
                        <div className="w-20 h-20 mx-auto mb-3 border-2 border-yellow-400 rounded-full flex items-center justify-center bg-yellow-400/10">
                          <span className="text-4xl">🏆</span>
                        </div>
                        <div className="text-xl font-bold text-yellow-400 mb-1">
                          {selectedChallenge.rewards.badgeName}
                        </div>
                        {selectedChallenge.rewards.badgeDescription && (
                          <div className="text-sm text-purple-300">
                            {selectedChallenge.rewards.badgeDescription}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border border-purple-500/20 rounded-xl">
                        <div className="w-12 h-12 mx-auto mb-2 border rounded-full flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div className="text-xs text-purple-300 mb-1">
                          Profit Bonus
                        </div>
                        <div className="text-lg font-bold text-green-400">
                          {selectedChallenge.rewards.profitCoins} ZC
                        </div>
                      </div>
                      <div className="text-center p-4 border border-purple-500/20 rounded-xl">
                        <div className="w-12 h-12 mx-auto mb-2 border rounded-full flex items-center justify-center">
                          <span className="text-2xl">🛡️</span>
                        </div>
                        <div className="text-xs text-purple-300 mb-1">
                          Loss Recovery
                        </div>
                        <div className="text-lg font-bold text-orange-400">
                          {selectedChallenge.rewards.lossCoins} ZC
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 w-2/4">
                  <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
                    <div className="space-y-3">
                      {selectedChallenge.prerequisites.map((prereq, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-lg p-3"
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

                  <div className="border bg-[#10081C] border-purple-500/30 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold mb-4">
                      Coin Incentive System
                    </h2>
                    <div className="flex flex-col divide-y divide-purple-500/80 rounded-xl overflow-hidden">
                      <div className="flex justify-between py-2">
                        <div className="text-sm mb-1">Loss Recovery</div>
                        <div className="text-sm font-bold text-orange-400">
                          {selectedChallenge.coinIncentive.loss}
                        </div>
                      </div>
                      <div className="flex justify-between py-2">
                        <div className="text-sm mb-1">Profit Bonus</div>
                        <div className="text-sm font-bold text-green-400">
                          {selectedChallenge.coinIncentive.profit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-2">
              <div className="space-y-2 w-full">
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
          <div className="flex w-full justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Challenges</h1>
                <p className="text-purple-300 text-lg">
                  {programData?.name || "ZeuzCrypto Challenges"} – Learn, Trade
                  & Earn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {weeksData.slice(0, 4).map((week) => (
              <button
                key={week.id}
                onClick={() => setSelectedWeek(week.id)}
                className={`p-2 rounded-xl border transition-all ${
                  selectedWeek === week.id
                    ? "bg-purple-900/30 border-purple-500 shadow-md shadow-purple-800/30"
                    : "border-purple-500/30 hover:border-purple-400/50"
                }`}
              >
                <div className="text-xl font-bold mb-1">
                  Week {week.week_number}
                </div>
                <div className="text-xs text-purple-300">
                  {week.tasks.length} Task{week.tasks.length !== 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {currentWeekData?.title || "Select a week"}
          </h2>

          {currentWeekData?.description && (
            <p className="text-purple-300 mb-6">
              {currentWeekData.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentWeekData?.tasks?.map((task) => (
              <div
                key={task.id}
                className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 cursor-pointer rounded-2xl p-6 transition-all"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                    {currentWeekData.is_completed ? "Completed" : "Available"}
                  </span>
                  {task.is_mandatory && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                      Mandatory
                    </span>
                  )}
                </div>

                {/* Task Info */}
                <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                <p className="text-sm text-purple-300 mb-4">
                  {task.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-purple-600 rounded text-xs">
                    {programData?.difficulty || "Beginner"}
                  </span>
                  <span className="px-2 py-1 bg-indigo-600 rounded text-xs">
                    {task.task_type}
                  </span>
                </div>

                {/* Quick Mission Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-purple-300">
                    <span>Target:</span>
                    <span className="font-semibold text-pink-400">
                      {task.target_value}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-300">
                    <span>Min Trades:</span>
                    <span className="font-semibold text-green-400">
                      {currentWeekData.min_trades_required}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-300">
                    <span>Type:</span>
                    <span className="font-semibold text-white">
                      {currentWeekData.trading_type}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => viewChallengeDetails(task, currentWeekData)}
                  disabled={loadingChallengeId === task.id}
                  className={`w-full font-medium py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border-1 border-white/20
    ${
      loadingChallengeId === task.id
        ? "bg-purple-400 cursor-not-allowed"
        : "bg-purple-600 hover:bg-purple-700 text-white"
    }`}
                >
                  {loadingChallengeId === task.id
                    ? "Loading..."
                    : "View Challenge"}
                </button>
              </div>
            ))}
          </div>

          {currentWeekData?.tasks?.length === 0 && (
            <div className="text-center py-12 text-purple-300">
              <p>No tasks available for this week</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
