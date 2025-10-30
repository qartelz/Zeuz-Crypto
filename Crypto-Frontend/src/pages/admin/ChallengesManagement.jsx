import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  Loader,
  Target,
  Clock,
  TrendingUp,
  Star,
  Award,
  Lock,
  Unlock,
  ArrowLeft,
  Trash2,
} from "lucide-react";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      <span className="text-xl font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
};

// Create New Challenge Component
const CreateChallenge = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Challenge, 2: Weeks, 3: Tasks
  const [challengeId, setChallengeId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficulty: "BEGINNER",
    is_active: true,
  });
  const [weeks, setWeeks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weekFormData, setWeekFormData] = useState({
    title: "",
    description: "",
    learning_outcome: "",
    trading_type: "SPOT",
    start_date: "",
    end_date: "",
    target_goal: 5,
    min_trades_required: 8,
    is_active: true,
  });
  const [tasks, setTasks] = useState({});
  const [currentTask, setCurrentTask] = useState({
    title: "",
    description: "",
    task_type: "PORTFOLIO_BALANCE",
    target_value: 10,
    is_mandatory: true,
    order: 1,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleChallengeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(`${baseURL}challenges/admin/challenges/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setChallengeId(data.id);
        showToast("Challenge created successfully!", "success");
        setTimeout(() => setStep(2), 1000);
      } else {
        showToast(data.detail || "Failed to create challenge", "error");
      }
    } catch (error) {
      showToast("Error creating challenge: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWeekSave = () => {
    if (!weekFormData.title || !weekFormData.start_date || !weekFormData.end_date) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setWeeks((prev) => {
      const newWeeks = [...prev];
      newWeeks[currentWeek - 1] = {
        ...weekFormData,
        week_number: currentWeek,
      };
      return newWeeks;
    });

    showToast(`Week ${currentWeek} data saved`, "success");
  };

  const handleWeeksSubmit = async () => {
    if (weeks.length === 0) {
      showToast("Please add at least one week", "error");
      return;
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const createdWeeks = [];

      for (const week of weeks) {
        const response = await fetch(
          `${baseURL}challenges/admin/weeks/?program_id=${challengeId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access}`,
            },
            body: JSON.stringify({
              program: challengeId,
              ...week,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          createdWeeks.push(data);
        } else {
          showToast(`Failed to create week ${week.week_number}: ${data.detail || "Unknown error"}`, "error");
          setLoading(false);
          return;
        }
      }

      showToast("All weeks created successfully!", "success");
      setWeeks(createdWeeks);
      setTimeout(() => setStep(3), 1000);
    } catch (error) {
      showToast("Error creating weeks: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    if (!currentTask.title || !currentTask.description) {
      showToast("Please fill task title and description", "error");
      return;
    }

    setTasks((prev) => {
      const weekTasks = prev[currentWeek] || [];
      return {
        ...prev,
        [currentWeek]: [...weekTasks, { ...currentTask }],
      };
    });

    setCurrentTask({
      title: "",
      description: "",
      task_type: "PORTFOLIO_BALANCE",
      target_value: 10,
      is_mandatory: true,
      order: (tasks[currentWeek]?.length || 0) + 2,
    });

    showToast("Task added", "success");
  };

  const handleRemoveTask = (weekNum, taskIndex) => {
    setTasks((prev) => {
      const weekTasks = [...(prev[weekNum] || [])];
      weekTasks.splice(taskIndex, 1);
      return {
        ...prev,
        [weekNum]: weekTasks,
      };
    });
    showToast("Task removed", "success");
  };

  const handleTasksSubmit = async () => {
    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      
      for (const [weekNumber, weekTasks] of Object.entries(tasks)) {
        const weekData = weeks.find(w => w.week_number === parseInt(weekNumber));
        if (!weekData) continue;

        for (const task of weekTasks) {
          const response = await fetch(
            `${baseURL}challenges/admin/tasks/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokens.access}`,
              },
              body: JSON.stringify({
                week: weekData.id,
                ...task,
              }),
            }
          );

          const data = await response.json();

          console.log(data,"the resposnse data")
          if (!response.ok) {
            showToast(`Failed to create task: ${data.detail || "Unknown error"}`, "error");
            setLoading(false);
            return;
          }
        }
      }

      showToast("Challenge created successfully with all weeks and tasks!", "success");
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      showToast("Error creating tasks: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTasks = () => {
    showToast("Challenge created successfully!", "success");
    setTimeout(() => onSuccess(), 1000);
  };

  useEffect(() => {
    if (step === 2 && currentWeek <= weeks.length && weeks[currentWeek - 1]) {
      setWeekFormData(weeks[currentWeek - 1]);
    } else if (step === 2) {
      setWeekFormData({
        title: "",
        description: "",
        learning_outcome: "",
        trading_type: "SPOT",
        start_date: "",
        end_date: "",
        target_goal: 5,
        min_trades_required: 8,
        is_active: true,
      });
    }
  }, [currentWeek, step]);

  return (
    <div className="min-h-screen text-white p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Challenges
        </button>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'}`}>
              1
            </div>
            <span className="font-medium">Challenge</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-purple-400' : 'bg-gray-500'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'}`}>
              2
            </div>
            <span className="font-medium">Weeks</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-purple-400' : 'bg-gray-500'}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'}`}>
              3
            </div>
            <span className="font-medium">Tasks</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 p-8">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Plus className="text-purple-400" size={32} />
            {step === 1 ? 'Create New Challenge' : step === 2 ? 'Add Weeks' : 'Add Tasks'}
          </h1>

          {/* Step 1: Challenge Form */}
          {step === 1 && (
            <form onSubmit={handleChallengeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Challenge Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                  placeholder="e.g., ZeuzMonth - March 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[120px]"
                  placeholder="Describe the challenge objectives and structure..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                  >
                    <option value="BEGINNER" className="bg-gray-900">Beginner</option>
                    <option value="INTERMEDIATE" className="bg-gray-900">Intermediate</option>
                    <option value="ADVANCED" className="bg-gray-900">Advanced</option>
                    <option value="EXPERT" className="bg-gray-900">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value === "true" })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                  >
                    <option value="true" className="bg-gray-900">Active</option>
                    <option value="false" className="bg-gray-900">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next: Add Weeks
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Weeks Form */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Week Selector */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((weekNum) => (
                  <button
                    key={weekNum}
                    type="button"
                    onClick={() => setCurrentWeek(weekNum)}
                    className={`p-4 rounded-xl border transition-all ${
                      currentWeek === weekNum
                        ? "bg-purple-900/30 border-purple-500 shadow-lg"
                        : weeks[weekNum - 1]
                        ? "border-green-500/50 bg-green-900/10"
                        : "border-purple-500/30 hover:border-purple-400/50"
                    }`}
                  >
                    <div className="text-lg font-bold">Week {weekNum}</div>
                    {weeks[weekNum - 1] && (
                      <div className="text-xs text-green-400 mt-1">✓ Saved</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-purple-900/10 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">Editing: Week {currentWeek}</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Week Title
                  </label>
                  <input
                    type="text"
                    required
                    value={weekFormData.title}
                    onChange={(e) =>
                      setWeekFormData({ ...weekFormData, title: e.target.value })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Introduction to Spot Trading"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={weekFormData.description}
                    onChange={(e) =>
                      setWeekFormData({ ...weekFormData, description: e.target.value })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[100px]"
                    placeholder="Describe the week's objectives..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Learning Outcome
                  </label>
                  <textarea
                    required
                    value={weekFormData.learning_outcome}
                    onChange={(e) =>
                      setWeekFormData({ ...weekFormData, learning_outcome: e.target.value })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[80px]"
                    placeholder="What will users learn this week..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Trading Type
                    </label>
                    <select
                      value={weekFormData.trading_type}
                      onChange={(e) =>
                        setWeekFormData({ ...weekFormData, trading_type: e.target.value })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    >
                      <option value="SPOT" className="bg-gray-900">Spot Trading</option>
                      <option value="SPOT_FUTURES" className="bg-gray-900">Spot + Futures</option>
                      <option value="SPOT_FUTURES_OPTIONS" className="bg-gray-900">Spot + Futures + Options</option>
                      <option value="PORTFOLIO" className="bg-gray-900">Portfolio Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Target Goal (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={weekFormData.target_goal}
                      onChange={(e) =>
                        setWeekFormData({ ...weekFormData, target_goal: parseFloat(e.target.value) })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Min Trades Required
                    </label>
                    <input
                      type="number"
                      value={weekFormData.min_trades_required}
                      onChange={(e) =>
                        setWeekFormData({ ...weekFormData, min_trades_required: parseInt(e.target.value) })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={weekFormData.start_date}
                      onChange={(e) =>
                        setWeekFormData({ ...weekFormData, start_date: e.target.value })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={weekFormData.end_date}
                      onChange={(e) =>
                        setWeekFormData({ ...weekFormData, end_date: e.target.value })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleWeekSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Save Week {currentWeek}
                </button>
              </div>

              <div className="flex gap-4 pt-4 border-t border-purple-500/30">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleWeeksSubmit}
                  disabled={loading || weeks.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Creating Weeks...
                    </>
                  ) : (
                    <>
                      Next: Add Tasks
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tasks Form */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Week Selector for Tasks */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {weeks.map((week) => (
                  <button
                    key={week.week_number}
                    type="button"
                    onClick={() => setCurrentWeek(week.week_number)}
                    className={`p-4 rounded-xl border transition-all ${
                      currentWeek === week.week_number
                        ? "bg-purple-900/30 border-purple-500 shadow-lg"
                        : "border-purple-500/30 hover:border-purple-400/50"
                    }`}
                  >
                    <div className="text-lg font-bold">Week {week.week_number}</div>
                    <div className="text-xs text-purple-300 mt-1">
                      {tasks[week.week_number]?.length || 0} tasks
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-purple-900/10 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Add Tasks for Week {currentWeek}
                </h3>
                <p className="text-sm text-purple-300">
                  {weeks.find(w => w.week_number === currentWeek)?.title}
                </p>
              </div>

              {/* Existing Tasks */}
              {tasks[currentWeek] && tasks[currentWeek].length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-purple-300">Added Tasks:</h4>
                  {tasks[currentWeek].map((task, index) => (
                    <div key={index} className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-white mb-1">{task.title}</h5>
                          <p className="text-sm text-purple-300">{task.description}</p>
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-purple-600/30 rounded">
                              {task.task_type}
                            </span>
                            <span className="px-2 py-1 bg-blue-600/30 rounded">
                              Target: {task.target_value}
                            </span>
                            {task.is_mandatory && (
                              <span className="px-2 py-1 bg-red-600/30 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTask(currentWeek, index)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Task Form */}
              <div className="bg-gray-900/30 rounded-lg p-6 border border-purple-500/20">
                <h4 className="font-semibold text-purple-300 mb-4">Add New Task</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={currentTask.title}
                      onChange={(e) =>
                        setCurrentTask({ ...currentTask, title: e.target.value })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Complete 5 profitable trades"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={currentTask.description}
                      onChange={(e) =>
                        setCurrentTask({ ...currentTask, description: e.target.value })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[80px]"
                      placeholder="Describe the task requirements..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Task Type
                      </label>
                      <select
                        value={currentTask.task_type}
                        onChange={(e) =>
                          setCurrentTask({ ...currentTask, task_type: e.target.value })
                        }
                        className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                      >
                        <option value="PORTFOLIO_BALANCE" className="bg-gray-900">Portfolio Balance</option>
                        <option value="TRADE_COUNT" className="bg-gray-900">Trade Count</option>
                        <option value="PROFIT_TARGET" className="bg-gray-900">Profit Target</option>
                        <option value="WIN_RATE" className="bg-gray-900">Win Rate</option>
                        <option value="RISK_MANAGEMENT" className="bg-gray-900">Risk Management</option>
                        <option value="LEARNING" className="bg-gray-900">Learning</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Target Value
                      </label>
                      <input
                        type="number"
                        value={currentTask.target_value}
                        onChange={(e) =>
                          setCurrentTask({ ...currentTask, target_value: parseFloat(e.target.value) })
                        }
                        className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Mandatory
                      </label>
                      <select
                        value={currentTask.is_mandatory}
                        onChange={(e) =>
                          setCurrentTask({ ...currentTask, is_mandatory: e.target.value === "true" })
                        }
                        className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                      >
                        <option value="true" className="bg-gray-900">Yes</option>
                        <option value="false" className="bg-gray-900">No</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add Task to Week {currentWeek}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-purple-500/30">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Back to Weeks
                </button>
                <button
                  type="button"
                  onClick={handleSkipTasks}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Skip Tasks
                </button>
                <button
                  type="button"
                  onClick={handleTasksSubmit}
                  disabled={loading || Object.keys(tasks).length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Creating Tasks...
                    </>
                  ) : (
                    <>
                      <Trophy size={20} />
                      Complete Challenge
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Challenge Details View Component
const ChallengeDetails = ({ challengeId, onBack }) => {
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    fetchWeekData();
  }, [challengeId]);

  const fetchWeekData = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(
        `${baseURL}challenges/weeks/?program_id=${challengeId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
      const data = await response.json();
      setWeekData(data.slice(0, 4));
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyStars = (difficulty) => {
    const stars = {
      BEGINNER: "★★★",
      INTERMEDIATE: "★★★★",
      ADVANCED: "★★★★★",
      EXPERT: "★★★★★",
    };
    return stars[difficulty] || "★★★";
  };

  const getTradingTypeLabel = (type) => {
    const labels = {
      SPOT: "Spot Trading",
      SPOT_FUTURES: "Spot + Futures",
      SPOT_FUTURES_OPTIONS: "Spot + Futures + Options",
      PORTFOLIO: "Portfolio Management",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <Loader className="animate-spin text-purple-400" size={48} />
      </div>
    );
  }

  const currentWeek = weekData.find((w) => w.week_number === selectedWeek);

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Challenges List
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {weekData[0]?.program_name || "Challenge Details"}
          </h1>
          <p className="text-purple-300 text-lg">
            View and manage weekly challenge structure
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {weekData.map((week) => (
              <button
                key={week.id}
                onClick={() => setSelectedWeek(week.week_number)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedWeek === week.week_number
                    ? "bg-purple-900/30 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "border-purple-500/30 hover:border-purple-400/50"
                }`}
              >
                <div className="text-xl font-bold mb-1">
                  Week {week.week_number}
                </div>
                <div className="text-xs text-purple-300">
                  {week.is_completed
                    ? "✓ Completed"
                    : week.is_ongoing
                    ? "In Progress"
                    : "Upcoming"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {currentWeek && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-purple-500/30 p-6">
                <h2 className="text-3xl font-bold mb-3">{currentWeek.title}</h2>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="text-yellow-400">
                    {getDifficultyStars("BEGINNER")}
                  </span>
                  <span className="px-3 py-1 bg-purple-600 rounded-full text-sm">
                    {getTradingTypeLabel(currentWeek.trading_type)}
                  </span>
                </div>
                <p className="text-purple-200">{currentWeek.description}</p>
              </div>

              <div className="rounded-2xl border border-purple-500/30 p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Target className="text-purple-400" size={28} />
                  Mission Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">
                      Target Goal
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      +{currentWeek.target_goal}%
                    </div>
                  </div>
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">
                      Min Trades
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {currentWeek.min_trades_required}
                    </div>
                  </div>
                  <div className="rounded-xl p-4 border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-1">Duration</div>
                    <div className="text-2xl font-bold text-orange-400">
                      7 Days
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="text-yellow-400" size={28} />
                  Learning Outcome
                </h3>
                <p className="text-purple-200">
                  {currentWeek.learning_outcome}
                </p>
              </div>

              {currentWeek.tasks && currentWeek.tasks.length > 0 && (
                <div className="rounded-2xl border border-purple-500/30 p-6">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Award className="text-purple-400" size={28} />
                    Tasks
                  </h3>
                  <div className="space-y-3">
                    {currentWeek.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg p-4 border border-purple-500/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-white mb-1">
                              {task.title}
                            </h4>
                            <p className="text-sm text-purple-300">
                              {task.description}
                            </p>
                          </div>
                          {task.is_mandatory && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-purple-500/30 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="text-purple-400" size={24} />
                  Schedule
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-purple-300 mb-1">
                      Start Date
                    </div>
                    <div className="text-white font-semibold">
                      {new Date(currentWeek.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-purple-300 mb-1">End Date</div>
                    <div className="text-white font-semibold">
                      {new Date(currentWeek.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {currentWeek.reward && (
                <div className="rounded-2xl border border-purple-500/30 p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="text-yellow-400" size={24} />
                    Rewards
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="font-semibold text-orange-400 mb-1">
                        {currentWeek.reward.badge_name}
                      </div>
                      <div className="text-xs text-purple-300">
                        {currentWeek.reward.badge_description}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 text-center">
                        <div className="text-xs text-purple-300 mb-1">
                          Profit Bonus
                        </div>
                        <div className="text-lg font-bold text-green-400">
                          {currentWeek.reward.profit_bonus_coins} ZC
                        </div>
                      </div>
                      <div className="rounded-lg p-3 text-center">
                        <div className="text-xs text-purple-300 mb-1">
                          Loss Recovery
                        </div>
                        <div className="text-lg font-bold text-orange-400">
                          {currentWeek.reward.loss_recovery_coins} ZC
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-purple-500/30 p-6">
                <h3 className="text-xl font-bold mb-4">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Active</span>
                    <span
                      className={
                        currentWeek.is_active
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {currentWeek.is_active ? (
                        <Unlock size={20} />
                      ) : (
                        <Lock size={20} />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Ongoing</span>
                    <span
                      className={
                        currentWeek.is_ongoing
                          ? "text-green-400"
                          : "text-gray-400"
                      }
                    >
                      {currentWeek.is_ongoing ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Completed</span>
                    <span
                      className={
                        currentWeek.is_completed
                          ? "text-green-400"
                          : "text-gray-400"
                      }
                    >
                      {currentWeek.is_completed ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Challenges Management Component
export default function ChallengesManagement() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("list");
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  useEffect(() => {
    if (currentView === "list") {
      fetchChallenges();
    }
  }, [currentView]);

  const fetchChallenges = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(
        `${baseURL}challenges/admin/challenges`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
      const data = await response.json();
      setChallenges(data.results);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (challengeId) => {
    setSelectedChallengeId(challengeId);
    setCurrentView("details");
  };

  if (currentView === "create") {
    return (
      <CreateChallenge
        onBack={() => setCurrentView("list")}
        onSuccess={() => setCurrentView("list")}
      />
    );
  }

  if (currentView === "details" && selectedChallengeId) {
    return (
      <ChallengeDetails
        challengeId={selectedChallengeId}
        onBack={() => setCurrentView("list")}
      />
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Challenges Management</h1>
            <p className="text-purple-300 text-lg">
              Create and manage trading challenges
            </p>
          </div>
          <button
            onClick={() => setCurrentView("create")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Create New Challenge
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
            <div>
              <div className="text-sm text-purple-300">Total Challenges</div>
              <div className="text-2xl font-semibold text-white">
                {challenges?.length}
              </div>
            </div>
            <Trophy className="text-yellow-400 opacity-90" size={26} />
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
            <div>
              <div className="text-sm text-purple-300">Active Challenges</div>
              <div className="text-2xl font-semibold text-white">
                {challenges?.filter((c) => c.is_active).length}
              </div>
            </div>
            <TrendingUp className="text-green-400 opacity-90" size={26} />
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
            <div>
              <div className="text-sm text-purple-300">Total Participants</div>
              <div className="text-2xl font-semibold text-white">
                {challenges?.reduce((sum, c) => sum + c.total_participants, 0)}
              </div>
            </div>
            <Users className="text-blue-400 opacity-90" size={26} />
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 backdrop-blur-sm p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-white mb-6">
            All Challenges
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-purple-400" size={48} />
            </div>
          ) : challenges?.length === 0 ? (
            <div className="text-center py-16 text-purple-300">
              <Trophy size={72} className="mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-medium mb-2">No Challenges Yet</h3>
              <p className="text-sm opacity-70">
                Create your first challenge to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {challenges?.map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => handleViewDetails(challenge.id)}
                  className="group rounded-xl border border-purple-500/20 bg-[#120B20]/40 p-6 transition-all duration-300 hover:border-purple-400/40 hover:bg-[#160C26]/70 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
                        {challenge.name}
                      </h3>
                      <span
                        className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${
                          challenge.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {challenge.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <ChevronRight
                      size={22}
                      className="text-purple-400 opacity-80 group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </div>

                  <p className="text-sm text-purple-300/80 mb-5 leading-relaxed line-clamp-2">
                    {challenge.description || "No description available."}
                  </p>

                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-purple-300/70 mb-0.5">
                        Difficulty
                      </p>
                      <p className="font-medium text-orange-400 capitalize">
                        {challenge.difficulty.toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-300/70 mb-0.5">Weeks</p>
                      <p className="font-medium text-purple-400">
                        {challenge.weeks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-300/70 mb-0.5">
                        Participants
                      </p>
                      <p className="font-medium text-blue-400">
                        {challenge.total_participants}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-300/70 mb-0.5">
                        Created
                      </p>
                      <p className="font-medium text-white">
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}