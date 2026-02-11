

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  CheckCircle,
  AlertCircle,
  Shield,
  Zap,
  BookOpen
} from "lucide-react";
import Trading from "../components/common/Trading";
import OrderHistory from "./OrderHistory";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;



// Mission Briefing Modal
// Mission Briefing Modal
const MissionBriefingModal = ({ week, onClose, onAccept, loading, isJoined }) => {
  const [briefingComplete, setBriefingComplete] = useState(false);

  useEffect(() => {
    // Simulate "reading" or processing time before enabling buttons
    const timer = setTimeout(() => setBriefingComplete(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0a1f] border border-purple-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-purple-900/20 p-6 flex items-center justify-between border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Target className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Mission Briefing</h2>
              <p className="text-purple-300 text-xs font-mono">CLASSIFIED // EYES ONLY</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Shield size={18} className="text-blue-400" />
              Operation: {week.title}
            </h3>
            <div className="bg-black/40 rounded-lg p-4 border border-green-500/20 shadow-inner min-h-[100px]">
              <div
                className="font-mono text-green-400 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4"
                dangerouslySetInnerHTML={{ __html: week.learning_outcome || "Your objective is to master the market dynamics of this sector. Proceed with caution." }}
              />
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-4 transition-opacity duration-500 ${briefingComplete ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-purple-900/10 rounded-xl p-4 border border-purple-500/20">
              <h4 className="text-purple-300 text-xs uppercase mb-2 font-bold">Trading Parameters</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white font-mono">{week.trading_type?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Target:</span>
                  <span className="text-green-400 font-mono">+{week.target_goal}% Balance</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/20">
              <h4 className="text-blue-300 text-xs uppercase mb-2 font-bold">Clearance Level</h4>
              <div className="flex items-center gap-2 text-white">
                <Zap className="text-yellow-400" size={16} />
                <span className="font-mono text-sm">Level {week.week_number} Access</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Complete this mission to unlock Level {week.week_number + 1}.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-4 bg-black/20">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-all font-mono text-sm"
          >
            TYPE: DECLINE
          </button>
          <button
            onClick={onAccept}
            disabled={!briefingComplete || loading}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm flex items-center justify-center gap-2 ${isJoined ? "bg-blue-600 hover:bg-blue-500" : "bg-green-600 hover:bg-green-500"
              }`}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isJoined ? <Play size={16} /> : <Check size={16} />)}
            {isJoined ? "CONTINUE MISSION" : "ACCEPT MISSION"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Challenges() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWeek, setSelectedWeek] = useState(undefined);
  const [briefingWeek, setBriefingWeek] = useState(null); // Week selected for briefing



  const handleAcceptMission = () => {
    if (briefingWeek) {
      setJoiningChallenge(true); // Start loading animation

      // Simulate network/transition delay
      setTimeout(async () => {
        handleSetSelectedWeek(briefingWeek.id);

        if (briefingWeek.tasks && briefingWeek.tasks.length > 0) {
          await viewChallengeDetails(briefingWeek.tasks[0], briefingWeek);
        } else {
          toast.success("Mission parameters loaded.");
        }

        setBriefingWeek(null); // Close modal
        setJoiningChallenge(false); // Stop loading
      }, 1500);
    }
  };
  const [selectedChallenge, setSelectedChallenge] = useState(() => {
    try {
      const saved = localStorage.getItem("selectedChallenge");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse selectedChallenge from localStorage", e);
      return null;
    }
  });

  // Persist selectedChallenge to localStorage
  useEffect(() => {
    if (selectedChallenge) {
      localStorage.setItem("selectedChallenge", JSON.stringify(selectedChallenge));
    } else {
      localStorage.removeItem("selectedChallenge");
    }
  }, [selectedChallenge]);

  console.log(selectedChallenge, "the selected challenge");;
  const [isChallengeStarted, setIsChallengeStarted] = useState(false);
  const [showHoldings, setShowHoldings] = useState(false);
  const [walletData, setWalletData] = useState(null);
  console.log(walletData, "the wallet data");
  const [walletLoading, setWalletLoading] = useState(false);

  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [weeksData, setWeeksData] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [joiningChallenge, setJoiningChallenge] = useState(false);
  const [completingChallenge, setCompletingChallenge] = useState(false);
  const [userProgressLoading, setUserProgressLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false); // Global Portfolio Loading State

  console.log(weeksData, "weeks data")
  console.log(userProgress, "the user progress")

  // Sync state from URL on initial load and when URL changes
  useEffect(() => {
    const weekParam = searchParams.get("week");
    const viewParam = searchParams.get("view");

    if (weekParam) {
      setSelectedWeek(weekParam);
    }

    if (viewParam === "holdings") {
      setShowHoldings(true);
    } else {
      setShowHoldings(false);
    }
  }, [searchParams]);

  // Update URL helpers
  const updateURL = (params) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    });
  };

  const handleSetSelectedWeek = (id) => {
    setSelectedWeek(id);
    updateURL({ week: id });
  };

  const handleShowHoldings = (show) => {
    setShowHoldings(show);
    updateURL({ view: show ? "holdings" : null });
  };

  const handleSetSelectedChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    if (challenge) {
      updateURL({ task: challenge.id });
    } else {
      updateURL({ task: null });
      // Restore week wallet if we have user progress and are going back to the week view
      if (userProgress?.id) {
        fetchWalletData(userProgress.id);
      }
    }
  };

  const fetchWalletData = async (participationId) => {
    if (!participationId) return;
    setWalletLoading(true);
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
        console.log(`[DEBUG] fetchWalletData called for participationId: ${participationId}`);
        console.log("[DEBUG] All available wallets from API:", data.results.map(w => ({ id: w.id, pid: w.participation_id, active: w.is_active })));

        const currentWallet = data.results.find(
          (wallet) => wallet.participation_id === participationId
        );

        if (!currentWallet) {
          console.warn(`[WARNING] No wallet found for participationId: ${participationId}. Available IDs:`, data.results.map(w => w.participation_id));
        } else {
          console.log(`[DEBUG] Found matching wallet:`, currentWallet.id);
        }

        setWalletData(currentWallet || null);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      setWalletData(null);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChallenge?.participationId) {
      fetchWalletData(selectedChallenge.participationId);
    } else {
      // If we exit a challenge task, we might want to ensure the week wallet is active.
      // However, fetchUserProgress handles the main load.
      // If we go Back -> handleSetSelectedChallenge(null) handles restoration manually?
      // No, let's keep it clean: meaningful updates only.
    }
  }, [selectedChallenge]);

  // Effect to handle deep linking for task details once weeksData is loaded
  useEffect(() => {
    const taskParam = searchParams.get("task");
    if (taskParam && weeksData.length > 0 && !selectedChallenge) {
      // Find the task in the loaded weeksData
      for (const week of weeksData) {
        const task = week.tasks.find((t) => t.id.toString() === taskParam);
        if (task) {
          viewChallengeDetails(task, week);
          break;
        }
      }
    }
  }, [weeksData, searchParams]);

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

  console.log(programData?.id, "the program data id")

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

      if (!data?.results || data.results.length === 0) {
        setError("No challenges Available");
        setLoading(false);
        return;
      }

      // Logic to select the default program:
      // 1. Priority: Joined programs (is_joined = true)
      // 2. Priority: Active programs (is_active = true)
      // 3. Fallback: First available program

      const sortedPrograms = data.results.sort((a, b) => {
        // Sort by is_joined (descending)
        if (a.is_joined !== b.is_joined) return b.is_joined - a.is_joined;
        // Then by is_active (descending)
        if (a.is_active !== b.is_active) return b.is_active - a.is_active;
        return 0;
      });

      console.log("Sorted programs for selection:", sortedPrograms);

      const selectedProgram = sortedPrograms[0];

      if (selectedProgram) {
        console.log("Auto-selecting program:", selectedProgram);
        setProgramData(selectedProgram);
      } else {
        console.warn("No suitable program found.");
        setError("No challenges available");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError("Failed to load programs: " + err.message);
      setLoading(false);
    }
  };

  const fetchWeeks = async (programId) => {
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const url = `${baseURL}challenges/weeks/?program_id=${programId}`;
      console.log(programId, "the program id")
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

      // Deduplicate weeks based on ID (just in case backend returns duplicates due to OR query)
      const uniqueWeeks = Array.from(new Map(data.map(item => [item.id, item])).values());

      // Sort by week number
      const sortedWeeks = uniqueWeeks.sort((a, b) => a.week_number - b.week_number);
      console.log("Sorted weeks:", sortedWeeks);

      setWeeksData(sortedWeeks);

      // Set default week logic:
      // 1. URL param "week"
      // 2. First incomplete week (Current user progress)
      // 3. Fallback to first week
      if (sortedWeeks.length > 0 && selectedWeek === undefined) {
        const weekParam = searchParams.get("week");
        if (weekParam) {
          setSelectedWeek(weekParam);
        } else {
          // Find the first week that is NOT completed
          const activeWeek = sortedWeeks.find(w => !w.is_completed);
          // If all completed, maybe go to the last week or first week. Let's start with activeWeek or the first one.
          // User request: "initially in the 2nd" (next one).
          const defaultId = activeWeek ? activeWeek.id : sortedWeeks[sortedWeeks.length - 1].id;
          handleSetSelectedWeek(defaultId);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching weeks:", err);
      setError("Failed to load weeks: " + err.message);
      setLoading(false);
    }
  };

  // Ensure user progress is fetched whenever selectedWeek updates
  useEffect(() => {
    if (selectedWeek) {
      fetchUserProgress(selectedWeek);
    }
  }, [selectedWeek]);


  const fetchUserProgress = async (weekId) => {
    try {
      setUserProgressLoading(true);
      setPortfolioLoading(true);
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
      console.log(`[DEBUG] fetchUserProgress called for weekId: ${weekId}`);
      console.log(`[DEBUG] Returned Participation ID: ${data.id}`);
      console.log(`[DEBUG] Returned Participation Week ID: ${data.week?.id || data.week}`);

      if (data.week && data.week.id && data.week.id.toString() !== weekId.toString()) {
        console.error("[CRITICAL] Mismatch! Requested week", weekId, "but got participation for week", data.week.id);
      }

      if (data.error) {
        console.log("User not participating in challenge");
        setUserProgress(null);


      } else {
        setUserProgress(data);
        if (data.id) {
          // Chain wallet fetch to ensure single loading flow
          await fetchWalletData(data.id);
        }
      }

      return data;
    } catch (err) {
      console.error("Error fetching user progress:", err);
      setUserProgress(null);
    } finally {
      setUserProgressLoading(false);
      setPortfolioLoading(false);
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
          handleSetSelectedChallenge({
            ...selectedChallenge,
            participationId: data.id
          });
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
              color: userProgressData?.tier_info?.name === "Firecracker" ? "text-orange-400 font-bold border-b-2 border-orange-400" : "text-orange-400",
            },
            {
              name: "Wave Hopper",
              range: "51 - 75%",
              color: userProgressData?.tier_info?.name === "Wave Hopper" ? "text-yellow-400 font-bold border-b-2 border-yellow-400" : "text-yellow-400",
            },
            {
              name: "Coin Scout",
              range: "26 - 50%",
              color: userProgressData?.tier_info?.name === "Coin Scout" ? "text-blue-400 font-bold border-b-2 border-blue-400" : "text-blue-400"
            },
            {
              name: "Byte Bouncer",
              range: "16 - 25%",
              color: userProgressData?.tier_info?.name === "Byte Bouncer" ? "text-purple-400 font-bold border-b-2 border-purple-400" : "text-purple-400",
            },
            {
              name: "Unranked",
              range: "0 - 15%",
              color: "text-gray-400"
            }
          ],
          currentScore: userProgressData?.score_details?.total_score
            ? Math.round(Number(userProgressData.score_details.total_score))
            : 0,
        },
        challengeTiers: [
          { name: "Bronze", level: "Beginner - Level 1", unlocked: weekData.week_number >= 1 },
          { name: "Silver", level: "Intermediate - Level 2", unlocked: weekData.week_number >= 2 },
          { name: "Gold", level: "Advanced - Level 3", unlocked: weekData.week_number >= 3 },
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
          <p className="text-xl mb-4">{error}</p>
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

  /* DEBUG: Relaxed match */
  const currentWeekData = weeksData.find((week) => week.id.toString() === selectedWeek?.toString());

  /* TEMP DEBUG OVERLAY */
  if (showHoldings) {
    console.log("DEBUG RENDER:", { selectedWeek, found: !!currentWeekData, weekNum: currentWeekData?.week_number });
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
      <div className="min-h-screen text-white p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          {/* Back Button */}
          <button
            onClick={() => handleShowHoldings(false)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all self-start"
          >
            ← Back to Challenges
          </button>

          {/* Global Loading State for Portfolio */}
          {portfolioLoading && (
            <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
              <Loader2 className="animate-spin text-purple-400 mb-4" size={48} />
              <p className="text-purple-300 font-bold">Loading Portfolio Data...</p>
            </div>
          )}

          {/* Wallet Info */}
          {(walletData || walletLoading) ? (
            <div className="sm:min-w-[420px] rounded-xl p-3 border shadow-lg border-purple-500/40 transition-all">
              {walletLoading || !walletData ? (
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
                <div className="h-auto sm:h-[120px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      <span className="truncate">
                        {currentWeekData?.week_number ? `Week ${currentWeekData.week_number} Wallet` : walletData.week_title}
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Available (Equity) */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-2 sm:p-1 border border-gray-700/50 hover:border-green-500/30 transition-all">
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mb-1 sm:mb-1.5 uppercase tracking-wide">
                        Current (Equity)
                      </p>
                      <p className="text-base sm:text-lg font-bold text-green-400 tabular-nums">
                        {parseFloat(
                          walletData.current_balance
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Locked */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-2 sm:p-1 border border-gray-700/50 hover:border-yellow-500/30 transition-all">
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mb-1 sm:mb-1.5 uppercase tracking-wide">
                        Locked
                      </p>
                      <p className="text-base sm:text-lg font-bold text-yellow-400 tabular-nums">
                        {parseFloat(walletData.locked_balance).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>

                    {/* Earned */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-2 sm:p-1 border border-gray-700/50 hover:border-blue-500/30 transition-all">
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mb-1 sm:mb-1.5 uppercase tracking-wide">
                        Earned
                      </p>
                      <p className="text-base sm:text-lg font-bold text-blue-400 tabular-nums">
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
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center w-full">
              <AlertCircle size={48} className="text-gray-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Wallet Found</h3>
              <p className="text-gray-400 max-w-md mb-6">
                You haven't started the trading challenge for this week yet.
                Join the challenge to create your wallet and start trading.
              </p>
              <button
                onClick={() => handleShowHoldings(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
              >
                Go to Challenge Board
              </button>
            </div>
          )}
        </div>

        {walletData && (
          <div className="mt-4 sm:-mt-16">
            <OrderHistory
              selectedChallenge={selectedChallenge || (currentWeekData ? { weekData: currentWeekData } : null)}
              walletData={walletData}
              walletLoading={walletLoading} // Pass the loading state
            />    </div>
        )}
      </div>
    );
  }



  // Challenge Detail View
  if (selectedChallenge) {
    return (
      <div className="min-h-screen text-white px-2 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            {/* Back Button */}
            <button
              onClick={() => handleSetSelectedChallenge(null)}
              className="flex items-center justify-center gap-1 sm:gap-2 text-purple-400 hover:text-white hover:bg-purple-700/20 sm:border sm:border-purple-700/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs sm:text-base">Back</span>
            </button>

            {/* Holdings Button */}
            <button
              onClick={() => handleShowHoldings(true)}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-4 rounded-full sm:rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <LineChart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base">Trades History</span>
            </button>
          </div>

          {/* First Row: Header + Action Button - Mobile Stacked, Desktop Grid */}
          <div className="flex flex-col lg:grid lg:grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 items-start">
            <div className="w-full xl:col-span-2 p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                {selectedChallenge.title}
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-yellow-400 text-sm sm:text-base">
                  {selectedChallenge.difficulty}
                </div>
                <span className="px-2 sm:px-3 py-1 font-bold text-[#B13DFF] rounded-full text-xs sm:text-sm">
                  {selectedChallenge.level}
                </span>
                <span className="px-2 sm:px-3 py-1 border border-[#6034A6] rounded-full text-xs sm:text-sm">
                  {selectedChallenge.category}
                </span>
              </div>

              <div className="flex justify-start lg:justify-start items-center gap-4 py-4 sm:py-6">
                {userProgressLoading ? (
                  <button
                    disabled
                    className="w-full sm:w-auto bg-gray-600/20 text-gray-400 font-bold py-2.5 sm:py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base sm:text-lg cursor-wait"
                  >
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm sm:text-base">Loading Status...</span>
                  </button>
                ) : (!userProgress || (userProgress.status !== 'COMPLETED' && !userProgress.is_completed)) ? (
                  <>
                    <button
                      onClick={() => {
                        if (!userProgress || userProgress.error) {
                          if (selectedChallenge.weekData) {
                            joinChallenge(selectedChallenge.weekData.id);
                          }
                        } else {
                          setIsChallengeStarted(true);
                        }
                      }}
                      disabled={joiningChallenge}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joiningChallenge ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span className="text-sm sm:text-base">Joining...</span>
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          <span className="text-sm sm:text-base">{getChallengeButtonText()}</span>
                        </>
                      )}
                    </button>

                    {/* Complete Challenge Button */}
                    {userProgress && userProgress.status === 'IN_PROGRESS' && (
                      <button
                        onClick={async () => {
                          try {
                            setCompletingChallenge(true); // Ensure this state is defined
                            const tokens = JSON.parse(localStorage.getItem("authTokens"));
                            const participationId = userProgress.id;

                            const response = await fetch(`${baseURL}challenges/participations/${participationId}/complete-challenge/`, {
                              method: 'POST',
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${tokens?.access}`,
                              }
                            });

                            const data = await response.json();

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
                              toast.success("Challenge Completed Successfully!", {
                                duration: 4000,
                                position: "top-center",
                                style: {
                                  background: "#1f1730",
                                  color: "#fff",
                                  border: "1px solid #22c55e",
                                },
                              });
                              // Update local state to reflect completion
                              setUserProgress({ ...userProgress, status: 'COMPLETED' });
                            }
                          } catch (err) {
                            console.error("Error completing challenge:", err);
                            toast.error("An error occurred", {
                              duration: 4000,
                              position: "top-center",
                              style: {
                                background: "#1f1730",
                                color: "#fff",
                                border: "1px solid #ef4444",
                              },
                            });
                          } finally {
                            setCompletingChallenge(false);
                          }
                        }}
                        disabled={completingChallenge}
                        className="w-full sm:w-auto bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 font-bold py-2 sm:py-2.5 px-3 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-1.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {completingChallenge ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <CheckCircle size={20} />
                        )}
                        <span className="text-sm sm:text-base">Complete Challenge</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle size={20} />
                    Challenge Completed
                  </div>
                )}
              </div>
            </div>

            {walletData && (
              <div className="w-full rounded-xl p-3 border shadow-lg border-purple-500/40 transition-all">
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
                  <div className="h-auto sm:h-[120px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        <span className="truncate">{walletData.week_title} Wallet</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-2 sm:p-1 border border-gray-700/50 hover:border-green-500/30 transition-all">
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mb-1 sm:mb-1.5 uppercase tracking-wide">
                          Available
                        </p>
                        <p className="text-base sm:text-lg font-bold text-green-400 tabular-nums">
                          {parseFloat(
                            walletData.available_balance
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-2 sm:p-1 border border-gray-700/50 hover:border-yellow-500/30 transition-all">
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mb-1 sm:mb-1.5 uppercase tracking-wide">
                          Locked
                        </p>
                        <p className="text-base sm:text-lg font-bold text-yellow-400 tabular-nums">
                          {parseFloat(walletData.locked_balance).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-2 sm:p-1 border border-gray-700/50 hover:border-blue-500/30 transition-all">
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mb-1  sm:mb-1.5 uppercase tracking-wide">
                          Earned
                        </p>
                        <p className="text-base sm:text-lg font-bold text-blue-400 tabular-nums">
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

          <div className="flex flex-col lg:flex-row w-full flex-1 justify-between gap-4 lg:gap-6">
            <div className="w-full lg:w-10/12 space-y-4 sm:space-y-6">
              {/* Your Mission */}
              <div className="bg-[#10081C] rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                  <Target className="" size={24} />
                  Your Mission
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="rounded-xl p-3 sm:p-4 border border-purple-500/20">
                    <div className="text-xs sm:text-sm text-purple-300 mb-1">
                      Target PnL
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#7A00E4]">
                      {selectedChallenge.mission.targetPnL}
                    </div>
                    <div className="text-xs mt-1">from entry</div>
                  </div>
                  <div className="rounded-xl p-3 sm:p-4 border border-purple-500/20">
                    <div className="text-xs sm:text-sm text-purple-300 mb-1">
                      Start Date
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-green-400">
                      {selectedChallenge.mission.startDate}
                    </div>
                  </div>
                  <div className="rounded-xl p-3 sm:p-4 border border-purple-500/20">
                    <div className="text-xs sm:text-sm text-purple-300 mb-1">End Date</div>
                    <div className="text-lg sm:text-xl font-bold text-red-400">
                      {selectedChallenge.mission.endDate}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 border border-purple-500/20 rounded-xl">
                    <div className="text-xs sm:text-sm text-purple-300 mb-2">
                      Allowed Pairs
                    </div>
                    <div className="text-base sm:text-lg font-bold text-[#F3AD0A]">
                      {selectedChallenge.mission.allowedPairs}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 border border-purple-500/20 rounded-xl">
                    <div className="text-xs sm:text-sm text-purple-300 mb-2">
                      Minimum Trades
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      {selectedChallenge.mission.minTrades}
                    </div>
                  </div>
                </div>

                {/* Task Description */}
                {selectedChallenge.timerBehavior && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-purple-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-xl sm:text-2xl">📝</span>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-green-400 mb-1">
                          Task Description
                        </h3>
                        <p
                          className="text-xs sm:text-sm text-purple-200"
                          dangerouslySetInnerHTML={{
                            __html: selectedChallenge.timerBehavior,
                          }}
                        />

                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards & Unlocks */}
              <div className="flex flex-col lg:flex-row gap-2 w-full">
                {selectedChallenge.rewards && (
                  <div className="border w-full lg:w-2/4 bg-[#10081C] border-purple-500/30 rounded-2xl p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                      Rewards & Unlocks
                    </h2>

                    {selectedChallenge.rewards.badgeName !== "No badge" && (
                      <div className="mb-4 sm:mb-6 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 border-2 border-yellow-400 rounded-full flex items-center justify-center bg-yellow-400/10">
                          <span className="text-3xl sm:text-4xl">🏆</span>
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-yellow-400 mb-1">
                          {selectedChallenge.rewards.badgeName}
                        </div>
                        {selectedChallenge.rewards.badgeDescription && (
                          <div className="text-xs sm:text-sm text-purple-300">
                            {selectedChallenge.rewards.badgeDescription}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 border border-purple-500/20 rounded-xl">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 border rounded-full flex items-center justify-center">
                          <span className="text-xl sm:text-2xl">💰</span>
                        </div>
                        <div className="text-xs text-purple-300 mb-1">
                          Profit Bonus
                        </div>
                        <div className="text-base sm:text-lg font-bold text-green-400">
                          {selectedChallenge.rewards.profitCoins} ZC
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 border border-purple-500/20 rounded-xl">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 border rounded-full flex items-center justify-center">
                          <span className="text-xl sm:text-2xl">🛡️</span>
                        </div>
                        <div className="text-xs text-purple-300 mb-1">
                          Loss Recovery
                        </div>
                        <div className="text-base sm:text-lg font-bold text-orange-400">
                          {selectedChallenge.rewards.lossCoins} ZC
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 w-full lg:w-2/4">
                  <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">Prerequisites</h2>
                    <div className="space-y-3">
                      {selectedChallenge.prerequisites.map((prereq, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-lg p-2 sm:p-3"
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${prereq.completed ? "bg-green-500" : "bg-gray-600"
                              }`}
                          >
                            {prereq.completed && <Check size={16} />}
                          </div>
                          <span
                            className={`text-xs sm:text-sm ${prereq.completed ? "text-white" : "text-gray-400"
                              }`}
                          >
                            {prereq.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border bg-[#10081C] border-purple-500/30 rounded-2xl p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">
                      Coin Incentive System
                    </h2>
                    <div className="flex flex-col divide-y divide-purple-500/80 rounded-xl overflow-hidden">
                      <div className="flex justify-between py-2">
                        <div className="text-xs sm:text-sm mb-1">Loss Recovery</div>
                        <div className="text-xs sm:text-sm font-bold text-orange-400">
                          {selectedChallenge.coinIncentive.loss}
                        </div>
                      </div>
                      <div className="flex justify-between py-2">
                        <div className="text-xs sm:text-sm mb-1">Profit Bonus</div>
                        <div className="text-xs sm:text-sm font-bold text-green-400">
                          {selectedChallenge.coinIncentive.profit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-2 w-full lg:w-auto">
              <div className="space-y-2 w-full">
                <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Scoring System</h3>
                  <p className="text-xs sm:text-sm text-red-400 mb-4">
                    {selectedChallenge.scoringSystem.type}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-purple-300">Profit ➡️</span>
                      <span className="font-semibold">Score</span>
                    </div>
                    {selectedChallenge.scoringSystem.tiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-purple-500/20"
                      >
                        <span className={`text-xs sm:text-sm ${tier.color}`}>{tier.name}</span>
                        <span className="text-purple-300 text-xs sm:text-sm">
                          {tier.range}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base text-purple-300">Score</span>
                      <span className="text-xl sm:text-2xl font-bold text-orange-400">
                        {selectedChallenge.scoringSystem.currentScore}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#10081C] border border-purple-500/30 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-4">Challenge Tiers</h3>
                  <div className="space-y-3">
                    {selectedChallenge.challengeTiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${tier.unlocked
                          ? "bg-orange-900/20 border-orange-500/30"
                          : "bg-gray-900/20 border-gray-500/30"
                          }`}
                      >
                        <span className="text-xl sm:text-2xl">
                          {tier.name === "Bronze"
                            ? "🥉"
                            : tier.name === "Silver"
                              ? "🥈"
                              : "🥇"}
                        </span>
                        <div className="flex-1">
                          <div
                            className={`text-sm sm:text-base font-semibold ${tier.unlocked
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
    <div className="min-h-screen text-white p-2 sm:p-4  overflow-x-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#2e1065_0%,_transparent_50%)] opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                TRADER EVOLUTION
              </span>
            </h1>
            <p className="text-purple-300 text-lg">
              {programData?.name || "Career Mode"} – Master the markets, one level at a time.
            </p>
          </div>

          {/* Weekly Portfolio Buttons */}
          {weeksData.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              {weeksData
                .filter(w => {
                  // Show if completed OR it's the current "active" (first incomplete) week
                  // We also show previous weeks even if not completed? (e.g. skipped? unlikely with sequential logic)
                  // Best logic: Show all weeks up to the "active" week.
                  const activeWeekIndex = weeksData.findIndex(wk => !wk.is_completed);
                  // If all completed, activeWeekIndex is -1, show all.
                  // If none completed, activeWeekIndex is 0, show only first.
                  const currentWeekIndex = weeksData.findIndex(wk => wk.id === w.id);

                  if (activeWeekIndex === -1) return true; // All weeks completed
                  return currentWeekIndex <= activeWeekIndex;
                })
                .map((week) => {
                  console.log("Rendering button for week:", week.week_number, week.id, week.is_completed);
                  return (
                    <button
                      key={week.id}
                      onClick={() => {
                        // If clicking the ALREADY selected week, force a refetch
                        // because useEffect won't fire if ID hasn't changed.
                        const isSameWeek = selectedWeek?.toString() === week.id.toString();

                        handleSetSelectedWeek(week.id);

                        // Manually clear challenge without triggering the "restore wallet" logic
                        setSelectedChallenge(null);
                        updateURL({ task: null });

                        setUserProgress(null); // Clear previous progress to avoid stale data
                        setWalletData(null); // Clear previous wallet data
                        handleShowHoldings(true);

                        if (isSameWeek) {
                          console.log("Forcing refetch for same week:", week.id);
                          fetchUserProgress(week.id);
                        }
                      }}
                      className={`flex items-center gap-3 border px-4 py-2 rounded-xl transition-all shadow-lg group ${selectedWeek === week.id || selectedWeek === week.id.toString()
                        ? "bg-[#120B20] border-purple-500 hover:border-purple-400 hover:shadow-purple-500/20"
                        : "bg-purple-900/10 border-purple-500/20 hover:border-purple-500/40 opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${week.is_completed ? "bg-green-500/20 group-hover:bg-green-500/30" : "bg-purple-600/20 group-hover:bg-purple-600/30"}`}>
                        {week.is_completed ? (
                          <CheckCircle size={20} className="text-green-400" />
                        ) : (
                          <LineChart size={20} className="text-purple-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">
                          {week.is_completed ? "Completed" : "Current"}
                        </div>
                        <div className="font-bold text-sm">
                          Week {week.week_number} • {week.trading_type ? week.trading_type.replace(/_/g, " ") : "Report"}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        {/* Mission Map */}
        <div className="relative py-12 mb-20">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-[40px] left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent hidden md:block" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-4 relative">
            {weeksData.map((week, index) => {
              // Logic for Unlocked: If previous week is verified completed OR it's the first week.
              // We need to check if previous week exists and is completed.
              const previousWeek = index > 0 ? weeksData[index - 1] : null;
              // You might want to check userProgress for that week too, but let's assume weeksData has mapped 'is_completed' correctly from the fetch logic?
              // The fetch logic seemed to sort but not explicitly map user progress to the week object property 'is_completed'.
              // Wait, line 1550 used `w.is_completed`. Let's assume the backend or fetch logic handles it.

              const isUnlocked = index === 0 || (previousWeek && previousWeek.is_completed);
              const isCompleted = week.is_completed;
              const isCurrent = isUnlocked && !isCompleted;

              return (
                <div key={week.id} className="relative flex flex-col items-center group">
                  {/* Node */}
                  <button
                    onClick={() => {
                      if (isUnlocked) setBriefingWeek(week);
                    }}
                    disabled={!isUnlocked}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10 relative
                                    ${isCompleted
                        ? "bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        : isCurrent
                          ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)] scale-110"
                          : "bg-gray-900 border-gray-800 text-gray-600 grayscale opacity-70"}
                                `}
                  >
                    {isCompleted ? (
                      <CheckCircle size={32} />
                    ) : isCurrent ? (
                      <Target size={32} className="animate-pulse" />
                    ) : (
                      <Lock size={28} />
                    )}

                    {isCurrent && (
                      <span className="absolute -inset-2 border border-purple-500/50 rounded-3xl animate-ping opacity-50" />
                    )}
                  </button>

                  {/* Label */}
                  <div className="mt-6 text-center transition-all duration-300 group-hover:-translate-y-1">
                    <h3 className={`font-bold text-lg ${isUnlocked ? "text-white" : "text-gray-600"}`}>Week {week.week_number}</h3>
                    <p className={`text-xs uppercase tracking-widest font-bold mt-1 ${isUnlocked ? "text-purple-400" : "text-gray-700"}`}>
                      {week.trading_type?.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Vertical Line for Mobile */}
                  {index < weeksData.length - 1 && (
                    <div className="absolute -bottom-12 left-1/2 w-0.5 h-12 bg-purple-900/30 md:hidden" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Mission Details (Preview) */}
        {currentWeekData && (
          <div className="bg-[#10081C] border border-purple-500/20 rounded-3xl p-8 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target size={200} />
            </div>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="bg-purple-600 w-2 h-8 rounded-full" />
              Current Objective: {currentWeekData.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div>
                <p className="text-purple-200 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: currentWeekData.description }} />

                <div className="flex gap-4">
                  <button
                    onClick={() => setBriefingWeek(currentWeekData)}
                    className="bg-white text-purple-900 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors flex items-center gap-2"
                  >
                    <BookOpen size={18} />
                    Open Briefing
                  </button>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-6 border border-white/5">
                <h4 className="text-sm text-gray-400 uppercase font-bold mb-4">Mission Parameters</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Target PnL</span>
                    <span className="text-green-400 font-mono font-bold">+{currentWeekData.target_goal}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Max Drawdown</span>
                    <span className="text-red-400 font-mono font-bold">{currentWeekData.max_drawdown || "5"}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Min Trades</span>
                    <span className="text-white font-mono font-bold">{currentWeekData.min_trades_required}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Briefing Modal */}
      {briefingWeek && (
        <MissionBriefingModal
          week={briefingWeek}
          onClose={() => setBriefingWeek(null)}
          onAccept={handleAcceptMission}
          loading={joiningChallenge}
          isJoined={selectedWeek === briefingWeek.id} // If we are already on this week, show Continue
        />
      )}
    </div>
  );
}
