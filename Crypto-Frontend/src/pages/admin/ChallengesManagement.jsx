// import React, { useState, useEffect } from "react";
// import {
//   Plus,
//   Calendar,
//   Users,
//   Trophy,
//   ChevronRight,
//   Loader,
//   Target,
//   Clock,
//   TrendingUp,
//   Star,
//   Award,
//   Lock,
//   Unlock,
//   ArrowLeft,
//   Trash2,
// } from "lucide-react";

// const baseURL = import.meta.env.VITE_API_BASE_URL;

// // Toast Component
// const Toast = ({ message, type, onClose }) => {
//   useEffect(() => {
//     const timer = setTimeout(onClose, 4000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
//   const icon = type === "success" ? "✓" : "✕";

//   return (
//     <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
//       <span className="text-xl font-bold">{icon}</span>
//       <span>{message}</span>
//     </div>
//   );
// };

// // Create New Challenge Component
// const CreateChallenge = ({ onBack, onSuccess }) => {
//   const [step, setStep] = useState(1); // 1: Challenge, 2: Weeks, 3: Tasks
//   const [challengeId, setChallengeId] = useState(null);
//   console.log(challengeId,"the challenge id")
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     difficulty: "BEGINNER",
//     is_active: true,
//   });
//   const [weeks, setWeeks] = useState([]);
//   const [currentWeek, setCurrentWeek] = useState(1);
//   const [weekFormData, setWeekFormData] = useState({
//     title: "",
//     description: "",
//     learning_outcome: "",
//     trading_type: "SPOT",
//     start_date: "",
//     end_date: "",
//     target_goal: 5,
//     min_trades_required: 8,
//     is_active: true,
//   });
//   const [tasks, setTasks] = useState({});
//   const [currentTask, setCurrentTask] = useState({
//     title: "",
//     description: "",
//     task_type: "PORTFOLIO_BALANCE",
//     target_value: 10,
//     is_mandatory: true,
//     order: 1,
//   });
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);

//   const showToast = (message, type) => {
//     setToast({ message, type });
//   };

//   const handleChallengeSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));
//       const response = await fetch(`${baseURL}challenges/admin/challenges/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokens.access}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();
//       console.log(data,"the data of the respone when creatin challenge")

//       if (response.ok) {
//         setChallengeId(data.data.id);
//         showToast("Challenge created successfully!", "success");
//         setTimeout(() => setStep(2), 1000);
//       } else {
//         showToast(data.detail || "Failed to create challenge", "error");
//       }
//     } catch (error) {
//       showToast("Error creating challenge: " + error.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleWeekSave = () => {
//     if (!weekFormData.title || !weekFormData.start_date || !weekFormData.end_date) {
//       showToast("Please fill all required fields", "error");
//       return;
//     }

//     setWeeks((prev) => {
//       const newWeeks = [...prev];
//       newWeeks[currentWeek - 1] = {
//         ...weekFormData,
//         week_number: currentWeek,
//       };
//       return newWeeks;
//     });

//     showToast(`Week ${currentWeek} data saved`, "success");
//   };

//   const handleWeeksSubmit = async () => {
//     if (weeks.length === 0) {
//       showToast("Please add at least one week", "error");
//       return;
//     }

//     setLoading(true);
//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));
//       const createdWeeks = [];

//       for (const week of weeks) {
//         const response = await fetch(
//           `${baseURL}challenges/admin/weeks/?program_id=${challengeId}`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${tokens.access}`,
//             },
//             body: JSON.stringify({
//               program: challengeId,
//               ...week,
//             }),
//           }
//         );

//         const data = await response.json();

//         console.log(data,"the resoponse creating week")
//         if (response.ok) {
//           createdWeeks.push(data);
//         } else {
//           showToast(`Failed to create week ${week.week_number}: ${data.detail || "Unknown error"}`, "error");
//           setLoading(false);
//           return;
//         }
//       }

//       showToast("All weeks created successfully!", "success");
//       setWeeks(createdWeeks);
//       setTimeout(() => setStep(3), 1000);
//     } catch (error) {
//       showToast("Error creating weeks: " + error.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Check if current week already has a task
// const currentWeekHasTask = tasks[currentWeek] && tasks[currentWeek].length > 0;
//   // const handleAddTask = () => {
//   //   if (!currentTask.title || !currentTask.description) {
//   //     showToast("Please fill task title and description", "error");
//   //     return;
//   //   }

//   //   setTasks((prev) => {
//   //     const weekTasks = prev[currentWeek] || [];
//   //     return {
//   //       ...prev,
//   //       [currentWeek]: [...weekTasks, { ...currentTask }],
//   //     };
//   //   });

//   //   setCurrentTask({
//   //     title: "",
//   //     description: "",
//   //     task_type: "PORTFOLIO_BALANCE",
//   //     target_value: 10,
//   //     is_mandatory: true,
//   //     order: (tasks[currentWeek]?.length || 0) + 2,
//   //   });

//   //   showToast("Task added", "success");
//   // };

//   const handleAddTask = () => {
//     if (!currentTask.title || !currentTask.description) {
//       showToast("Please fill task title and description", "error");
//       return;
//     }

//     if (currentWeekHasTask) {
//       showToast("This week already has a task. Remove it first to add a new one.", "error");
//       return;
//     }

//     setTasks((prev) => ({
//       ...prev,
//       [currentWeek]: [{ ...currentTask }],
//     }));

//     setCurrentTask({
//       title: "",
//       description: "",
//       task_type: "PORTFOLIO_BALANCE",
//       target_value: 10,
//       is_mandatory: true,
//       order: 1,
//     });

//     showToast("Task added", "success");
//   };

//   // const handleRemoveTask = (weekNum, taskIndex) => {
//   //   setTasks((prev) => {
//   //     const weekTasks = [...(prev[weekNum] || [])];
//   //     weekTasks.splice(taskIndex, 1);
//   //     return {
//   //       ...prev,
//   //       [weekNum]: weekTasks,
//   //     };
//   //   });
//   //   showToast("Task removed", "success");
//   // };

//   const handleRemoveTask = (weekNum) => {
//     setTasks((prev) => {
//       const newTasks = { ...prev };
//       delete newTasks[weekNum];
//       return newTasks;
//     });
//     showToast("Task removed", "success");
//   };

//   // const handleTasksSubmit = async () => {
//   //   setLoading(true);
//   //   try {
//   //     const tokens = JSON.parse(localStorage.getItem("authTokens"));

//   //     for (const [weekNumber, weekTasks] of Object.entries(tasks)) {
//   //       const weekData = weeks.find(w => w.week_number === parseInt(weekNumber));
//   //       if (!weekData) continue;

//   //       for (const task of weekTasks) {
//   //         const response = await fetch(
//   //           `${baseURL}challenges/admin/tasks/`,
//   //           {
//   //             method: "POST",
//   //             headers: {
//   //               "Content-Type": "application/json",
//   //               Authorization: `Bearer ${tokens.access}`,
//   //             },
//   //             body: JSON.stringify({
//   //               week: weekData.id,
//   //               ...task,
//   //             }),
//   //           }
//   //         );

//   //         const data = await response.json();

//   //         console.log(data,"the resposnse data")
//   //         if (!response.ok) {
//   //           showToast(`Failed to create task: ${data.detail || "Unknown error"}`, "error");
//   //           setLoading(false);
//   //           return;
//   //         }
//   //       }
//   //     }

//   //     showToast("Challenge created successfully with all weeks and tasks!", "success");
//   //     setTimeout(() => onSuccess(), 1500);
//   //   } catch (error) {
//   //     showToast("Error creating tasks: " + error.message, "error");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const handleTasksSubmit = async () => {
//     setLoading(true);
//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));

//       for (const [weekNumber, weekTasks] of Object.entries(tasks)) {
//         const weekData = weeks.find(w => w.week_number === parseInt(weekNumber));
//         if (!weekData) continue;

//         for (const task of weekTasks) {
//           const response = await fetch(
//             `${baseURL}challenges/tasks/?week=${weekData.id}`, // Changed: Added week query parameter
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${tokens.access}`,
//               },
//               body: JSON.stringify({
//                 week: weekData.id, // This stays in the body
//                 ...task,
//               }),
//             }
//           );

//           const data = await response.json();

//           console.log(data,"the response data")
//           if (!response.ok) {
//             showToast(`Failed to create task: ${data.detail || "Unknown error"}`, "error");
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       showToast("Challenge created successfully with all weeks and tasks!", "success");
//       setTimeout(() => onSuccess(), 1500);
//     } catch (error) {
//       showToast("Error creating tasks: " + error.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSkipTasks = () => {
//     showToast("Challenge created successfully!", "success");
//     setTimeout(() => onSuccess(), 1000);
//   };

//   useEffect(() => {
//     if (step === 2 && currentWeek <= weeks.length && weeks[currentWeek - 1]) {
//       setWeekFormData(weeks[currentWeek - 1]);
//     } else if (step === 2) {
//       setWeekFormData({
//         title: "",
//         description: "",
//         learning_outcome: "",
//         trading_type: "SPOT",
//         start_date: "",
//         end_date: "",
//         target_goal: 5,
//         min_trades_required: 8,
//         is_active: true,
//       });
//     }
//   }, [currentWeek, step]);

//   return (
//     <div className="min-h-screen text-white p-6">
//       {toast && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={() => setToast(null)}
//         />
//       )}

//       <div className="max-w-6xl mx-auto">
//         <button
//           onClick={onBack}
//           className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
//         >
//           <ArrowLeft size={20} />
//           Back to Challenges
//         </button>

//         {/* Progress Steps */}
//         <div className="mb-8 flex items-center justify-center gap-4">
//           <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'}`}>
//               1
//             </div>
//             <span className="font-medium">Challenge</span>
//           </div>
//           <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-purple-400' : 'bg-gray-500'}`} />
//           <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'}`}>
//               2
//             </div>
//             <span className="font-medium">Weeks</span>
//           </div>
//           <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-purple-400' : 'bg-gray-500'}`} />
//           <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-400' : 'text-gray-500'}`}>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'}`}>
//               3
//             </div>
//             <span className="font-medium">Tasks</span>
//           </div>
//         </div>

//         <div className="rounded-2xl border border-purple-500/30 p-8">
//           <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
//             <Plus className="text-purple-400" size={32} />
//             {step === 1 ? 'Create New Challenge' : step === 2 ? 'Add Weeks' : 'Add Tasks'}
//           </h1>

//           {/* Step 1: Challenge Form */}
//           {step === 1 && (
//             <form onSubmit={handleChallengeSubmit} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-purple-300 mb-2">
//                   Challenge Name
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.name}
//                   onChange={(e) =>
//                     setFormData({ ...formData, name: e.target.value })
//                   }
//                   className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                   placeholder="e.g., ZeuzMonth - March 2025"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-purple-300 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   required
//                   value={formData.description}
//                   onChange={(e) =>
//                     setFormData({ ...formData, description: e.target.value })
//                   }
//                   className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[120px]"
//                   placeholder="Describe the challenge objectives and structure..."
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">
//                     Difficulty
//                   </label>
//                   <select
//                     value={formData.difficulty}
//                     onChange={(e) =>
//                       setFormData({ ...formData, difficulty: e.target.value })
//                     }
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                   >
//                     <option value="BEGINNER" className="bg-gray-900">Beginner</option>
//                     <option value="INTERMEDIATE" className="bg-gray-900">Intermediate</option>
//                     <option value="ADVANCED" className="bg-gray-900">Advanced</option>
//                     <option value="EXPERT" className="bg-gray-900">Expert</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">
//                     Status
//                   </label>
//                   <select
//                     value={formData.is_active}
//                     onChange={(e) =>
//                       setFormData({ ...formData, is_active: e.target.value === "true" })
//                     }
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                   >
//                     <option value="true" className="bg-gray-900">Active</option>
//                     <option value="false" className="bg-gray-900">Inactive</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex gap-4 pt-4">
//                 <button
//                   type="button"
//                   onClick={onBack}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader className="animate-spin" size={20} />
//                       Creating...
//                     </>
//                   ) : (
//                     <>
//                       Next: Add Weeks
//                       <ChevronRight size={20} />
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           )}

//           {/* Step 2: Weeks Form */}
//           {step === 2 && (
//             <div className="space-y-6">
//               {/* Week Selector */}
//               <div className="grid grid-cols-4 gap-4 mb-6">
//                 {[1, 2, 3, 4].map((weekNum) => (
//                   <button
//                     key={weekNum}
//                     type="button"
//                     onClick={() => setCurrentWeek(weekNum)}
//                     className={`p-4 rounded-xl border transition-all ${
//                       currentWeek === weekNum
//                         ? "bg-purple-900/30 border-purple-500 shadow-lg"
//                         : weeks[weekNum - 1]
//                         ? "border-green-500/50 bg-green-900/10"
//                         : "border-purple-500/30 hover:border-purple-400/50"
//                     }`}
//                   >
//                     <div className="text-lg font-bold">Week {weekNum}</div>
//                     {weeks[weekNum - 1] && (
//                       <div className="text-xs text-green-400 mt-1">✓ Saved</div>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-purple-900/10 rounded-lg p-4 mb-4">
//                 <h3 className="text-lg font-semibold mb-2">Editing: Week {currentWeek}</h3>
//               </div>

//               <div className="grid grid-cols-1 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">
//                     Week Title
//                   </label>
//                   <input
//                     type="text"
//                     required
//                     value={weekFormData.title}
//                     onChange={(e) =>
//                       setWeekFormData({ ...weekFormData, title: e.target.value })
//                     }
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                     placeholder="e.g., Introduction to Spot Trading"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">
//                     Description
//                   </label>
//                   <textarea
//                     required
//                     value={weekFormData.description}
//                     onChange={(e) =>
//                       setWeekFormData({ ...weekFormData, description: e.target.value })
//                     }
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[100px]"
//                     placeholder="Describe the week's objectives..."
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">
//                     Learning Outcome
//                   </label>
//                   <textarea
//                     required
//                     value={weekFormData.learning_outcome}
//                     onChange={(e) =>
//                       setWeekFormData({ ...weekFormData, learning_outcome: e.target.value })
//                     }
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[80px]"
//                     placeholder="What will users learn this week..."
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       Trading Type
//                     </label>
//                     <select
//                       value={weekFormData.trading_type}
//                       onChange={(e) =>
//                         setWeekFormData({ ...weekFormData, trading_type: e.target.value })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                     >
//                       <option value="SPOT" className="bg-gray-900">Spot Trading</option>
//                       <option value="SPOT_FUTURES" className="bg-gray-900">Spot + Futures</option>
//                       <option value="SPOT_FUTURES_OPTIONS" className="bg-gray-900">Spot + Futures + Options</option>
//                       <option value="PORTFOLIO" className="bg-gray-900">Portfolio Management</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       Target Goal (%)
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={weekFormData.target_goal}
//                       onChange={(e) =>
//                         setWeekFormData({ ...weekFormData, target_goal: parseFloat(e.target.value) })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       Min Trades Required
//                     </label>
//                     <input
//                       type="number"
//                       value={weekFormData.min_trades_required}
//                       onChange={(e) =>
//                         setWeekFormData({ ...weekFormData, min_trades_required: parseInt(e.target.value) })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       Start Date
//                     </label>
//                     <input
//                       type="datetime-local"
//                       required
//                       value={weekFormData.start_date}
//                       onChange={(e) =>
//                         setWeekFormData({ ...weekFormData, start_date: e.target.value })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       End Date
//                     </label>
//                     <input
//                       type="datetime-local"
//                       required
//                       value={weekFormData.end_date}
//                       onChange={(e) =>
//                         setWeekFormData({ ...weekFormData, end_date: e.target.value })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-4 pt-4">
//                 <button
//                   type="button"
//                   onClick={handleWeekSave}
//                   className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
//                 >
//                   Save Week {currentWeek}
//                 </button>
//               </div>

//               <div className="flex gap-4 pt-4 border-t border-purple-500/30">
//                 <button
//                   type="button"
//                   onClick={() => setStep(1)}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
//                 >
//                   Back
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleWeeksSubmit}
//                   disabled={loading || weeks.length === 0}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader className="animate-spin" size={20} />
//                       Creating Weeks...
//                     </>
//                   ) : (
//                     <>
//                       Next: Add Tasks
//                       <ChevronRight size={20} />
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Step 3: Tasks Form */}
//           {step === 3 && (
//             <div className="space-y-6">
//               {/* Week Selector for Tasks */}
//               <div className="grid grid-cols-4 gap-4 mb-6">
//                 {weeks.map((week) => (
//                   <button
//                     key={week.week_number}
//                     type="button"
//                     onClick={() => setCurrentWeek(week.week_number)}
//                     className={`p-4 rounded-xl border transition-all ${
//                       currentWeek === week.week_number
//                         ? "bg-purple-900/30 border-purple-500 shadow-lg"
//                         : "border-purple-500/30 hover:border-purple-400/50"
//                     }`}
//                   >
//                     <div className="text-lg font-bold">Week {week.week_number}</div>
//                     {/* <div className="text-xs text-purple-300 mt-1">
//                       {tasks[week.week_number]?.length || 0} tasks
//                     </div> */}

// <div className="text-xs text-purple-300 mt-1">
//   {tasks[week.week_number] ? "1 task" : "0 tasks"}
// </div>
//                   </button>
//                 ))}
//               </div>

//               <div className="bg-purple-900/10 rounded-lg p-4 mb-4">
//                 <h3 className="text-lg font-semibold mb-2">
//                   Add Tasks for Week {currentWeek}
//                 </h3>
//                 <p className="text-sm text-purple-300">
//                   {weeks.find(w => w.week_number === currentWeek)?.title}
//                 </p>
//               </div>

//               {/* Existing Tasks */}
//               {/* {tasks[currentWeek] && tasks[currentWeek].length > 0 && (
//                 <div className="space-y-3 mb-6">
//                   <h4 className="font-semibold text-purple-300">Added Tasks:</h4>
//                   {tasks[currentWeek].map((task, index) => (
//                     <div key={index} className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
//                       <div className="flex justify-between items-start">
//                         <div className="flex-1">
//                           <h5 className="font-semibold text-white mb-1">{task.title}</h5>
//                           <p className="text-sm text-purple-300">{task.description}</p>
//                           <div className="mt-2 flex gap-2 text-xs">
//                             <span className="px-2 py-1 bg-purple-600/30 rounded">
//                               {task.task_type}
//                             </span>
//                             <span className="px-2 py-1 bg-blue-600/30 rounded">
//                               Target: {task.target_value}
//                             </span>
//                             {task.is_mandatory && (
//                               <span className="px-2 py-1 bg-red-600/30 rounded">
//                                 Mandatory
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => handleRemoveTask(currentWeek, index)}
//                           className="text-red-400 hover:text-red-300 p-2"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )} */}

//               {/* Existing Tasks */}
// {currentWeekHasTask && (
//   <div className="space-y-3 mb-6">
//     <h4 className="font-semibold text-purple-300">Current Task:</h4>
//     <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
//       <div className="flex justify-between items-start">
//         <div className="flex-1">
//           <h5 className="font-semibold text-white mb-1">{tasks[currentWeek][0].title}</h5>
//           <p className="text-sm text-purple-300">{tasks[currentWeek][0].description}</p>
//           <div className="mt-2 flex gap-2 text-xs">
//             <span className="px-2 py-1 bg-purple-600/30 rounded">
//               {tasks[currentWeek][0].task_type}
//             </span>
//             <span className="px-2 py-1 bg-blue-600/30 rounded">
//               Target: {tasks[currentWeek][0].target_value}
//             </span>
//             {tasks[currentWeek][0].is_mandatory && (
//               <span className="px-2 py-1 bg-red-600/30 rounded">
//                 Mandatory
//               </span>
//             )}
//           </div>
//         </div>
//         <button
//           onClick={() => handleRemoveTask(currentWeek)}
//           className="text-red-400 hover:text-red-300 p-2"
//         >
//           <Trash2 size={18} />
//         </button>
//       </div>
//     </div>
//   </div>
// )}

//               {/* Add New Task Form */}
//               <div className="bg-gray-900/30 rounded-lg p-6 border border-purple-500/20">
//                 <h4 className="font-semibold text-purple-300 mb-4">Add New Task</h4>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       Task Title
//                     </label>
//                     <input
//                       type="text"
//                       value={currentTask.title}
//                       onChange={(e) =>
//                         setCurrentTask({ ...currentTask, title: e.target.value })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                       placeholder="e.g., Complete 5 profitable trades"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-purple-300 mb-2">
//                       Description
//                     </label>
//                     <textarea
//                       value={currentTask.description}
//                       onChange={(e) =>
//                         setCurrentTask({ ...currentTask, description: e.target.value })
//                       }
//                       className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[80px]"
//                       placeholder="Describe the task requirements..."
//                     />
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-purple-300 mb-2">
//                         Task Type
//                       </label>
//                       <select
//                         value={currentTask.task_type}
//                         onChange={(e) =>
//                           setCurrentTask({ ...currentTask, task_type: e.target.value })
//                         }
//                         className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                       >
//                         <option value="PORTFOLIO_BALANCE" className="bg-gray-900">Portfolio Balance</option>
//                         <option value="TRADE_COUNT" className="bg-gray-900">Trade Count</option>
//                         <option value="PROFIT_TARGET" className="bg-gray-900">Profit Target</option>
//                         <option value="WIN_RATE" className="bg-gray-900">Win Rate</option>
//                         <option value="RISK_MANAGEMENT" className="bg-gray-900">Risk Management</option>
//                         <option value="LEARNING" className="bg-gray-900">Learning</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-purple-300 mb-2">
//                         Target Value
//                       </label>
//                       <input
//                         type="number"
//                         value={currentTask.target_value}
//                         onChange={(e) =>
//                           setCurrentTask({ ...currentTask, target_value: parseFloat(e.target.value) })
//                         }
//                         className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-purple-300 mb-2">
//                         Mandatory
//                       </label>
//                       <select
//                         value={currentTask.is_mandatory}
//                         onChange={(e) =>
//                           setCurrentTask({ ...currentTask, is_mandatory: e.target.value === "true" })
//                         }
//                         className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                       >
//                         <option value="true" className="bg-gray-900">Yes</option>
//                         <option value="false" className="bg-gray-900">No</option>
//                       </select>
//                     </div>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={handleAddTask}
//                     className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
//                   >
//                     <Plus size={20} />
//                     Add Task to Week {currentWeek}
//                   </button>
//                 </div>
//               </div>

//               <div className="flex gap-4 pt-4 border-t border-purple-500/30">
//                 <button
//                   type="button"
//                   onClick={() => setStep(2)}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
//                 >
//                   Back to Weeks
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleSkipTasks}
//                   className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
//                 >
//                   Skip Tasks
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleTasksSubmit}
//                   disabled={loading || Object.keys(tasks).length === 0}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader className="animate-spin" size={20} />
//                       Creating Tasks...
//                     </>
//                   ) : (
//                     <>
//                       <Trophy size={20} />
//                       Complete Challenge
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Challenge Details View Component
// const ChallengeDetails = ({ challengeId, onBack }) => {
//   const [weekData, setWeekData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedWeek, setSelectedWeek] = useState(1);

//   const [editingTask, setEditingTask] = useState(null);
// const [taskFormData, setTaskFormData] = useState({
//   title: "",
//   description: "",
//   task_type: "PORTFOLIO_BALANCE",
//   target_value: 10,
//   is_mandatory: true,
//   order: 1,
// });
// const [toast, setToast] = useState(null);

// const showToast = (message, type) => {
//   setToast({ message, type });
// };

// const handleEditTask = (task) => {
//   setEditingTask(task);
//   setTaskFormData({
//     title: task.title,
//     description: task.description,
//     task_type: task.task_type,
//     target_value: task.target_value,
//     is_mandatory: task.is_mandatory,
//     order: task.order,
//   });
// };

// const handleSaveTask = async () => {
//   try {
//     const tokens = JSON.parse(localStorage.getItem("authTokens"));
//     const response = await fetch(
//       `${baseURL}challenges/tasks/?week=${currentWeek.id}`,
//       {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokens.access}`,
//         },
//         body: JSON.stringify({
//           week: currentWeek.id,
//           ...taskFormData,
//         }),
//       }
//     );

//     const data = await response.json();

//     if (response.ok) {
//       showToast("Task updated successfully!", "success");
//       setEditingTask(null);
//       fetchWeekData(); // Refresh the data
//     } else {
//       showToast(data.detail || "Failed to update task", "error");
//     }
//   } catch (error) {
//     showToast("Error updating task: " + error.message, "error");
//   }
// };

// const handleCancelEdit = () => {
//   setEditingTask(null);
//   setTaskFormData({
//     title: "",
//     description: "",
//     task_type: "PORTFOLIO_BALANCE",
//     target_value: 10,
//     is_mandatory: true,
//     order: 1,
//   });
// };

//   useEffect(() => {
//     fetchWeekData();
//   }, [challengeId]);

//   const fetchWeekData = async () => {
//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));
//       const response = await fetch(
//         `${baseURL}challenges/weeks/?program_id=${challengeId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${tokens.access}`,
//           },
//         }
//       );
//       const data = await response.json();
//       setWeekData(data.slice(0, 4));
//     } catch (error) {
//       console.error("Error fetching week data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getDifficultyStars = (difficulty) => {
//     const stars = {
//       BEGINNER: "★★★",
//       INTERMEDIATE: "★★★★",
//       ADVANCED: "★★★★★",
//       EXPERT: "★★★★★",
//     };
//     return stars[difficulty] || "★★★";
//   };

//   const getTradingTypeLabel = (type) => {
//     const labels = {
//       SPOT: "Spot Trading",
//       SPOT_FUTURES: "Spot + Futures",
//       SPOT_FUTURES_OPTIONS: "Spot + Futures + Options",
//       PORTFOLIO: "Portfolio Management",
//     };
//     return labels[type] || type;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen text-white flex items-center justify-center">
//         <Loader className="animate-spin text-purple-400" size={48} />
//       </div>
//     );
//   }

//   const currentWeek = weekData.find((w) => w.week_number === selectedWeek);

//   return (
//     <div className="min-h-screen text-white p-6">
//       <div className="max-w-7xl mx-auto">
//         <button
//           onClick={onBack}
//           className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
//         >
//           <ArrowLeft size={20} />
//           Back to Challenges List
//         </button>

//         <div className="mb-8">
//           <h1 className="text-4xl font-bold mb-2">
//             {weekData[0]?.program_name || "Challenge Details"}
//           </h1>
//           <p className="text-purple-300 text-lg">
//             View and manage weekly challenge structure
//           </p>
//         </div>

//         <div className="mb-8">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {weekData.map((week) => (
//               <button
//                 key={week.id}
//                 onClick={() => setSelectedWeek(week.week_number)}
//                 className={`p-4 rounded-xl border transition-all ${
//                   selectedWeek === week.week_number
//                     ? "bg-purple-900/30 border-purple-500 shadow-lg shadow-purple-500/20"
//                     : "border-purple-500/30 hover:border-purple-400/50"
//                 }`}
//               >
//                 <div className="text-xl font-bold mb-1">
//                   Week {week.week_number}
//                 </div>
//                 <div className="text-xs text-purple-300">
//                   {week.is_completed
//                     ? "✓ Completed"
//                     : week.is_ongoing
//                     ? "In Progress"
//                     : "Upcoming"}
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {currentWeek && (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <div className="lg:col-span-2 space-y-6">
//               <div className="rounded-2xl border border-purple-500/30 p-6">
//                 <h2 className="text-3xl font-bold mb-3">{currentWeek.title}</h2>
//                 <div className="flex items-center gap-3 flex-wrap mb-4">
//                   <span className="text-yellow-400">
//                     {getDifficultyStars("BEGINNER")}
//                   </span>
//                   <span className="px-3 py-1 bg-purple-600 rounded-full text-sm">
//                     {getTradingTypeLabel(currentWeek.trading_type)}
//                   </span>
//                 </div>
//                 <p className="text-purple-200">{currentWeek.description}</p>
//               </div>

//               <div className="rounded-2xl border border-purple-500/30 p-6">
//                 <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
//                   <Target className="text-purple-400" size={28} />
//                   Mission Goals
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="rounded-xl p-4 border border-purple-500/20">
//                     <div className="text-sm text-purple-300 mb-1">
//                       Target Goal
//                     </div>
//                     <div className="text-2xl font-bold text-green-400">
//                       +{currentWeek.target_goal}%
//                     </div>
//                   </div>
//                   <div className="rounded-xl p-4 border border-purple-500/20">
//                     <div className="text-sm text-purple-300 mb-1">
//                       Min Trades
//                     </div>
//                     <div className="text-2xl font-bold text-purple-400">
//                       {currentWeek.min_trades_required}
//                     </div>
//                   </div>
//                   <div className="rounded-xl p-4 border border-purple-500/20">
//                     <div className="text-sm text-purple-300 mb-1">Duration</div>
//                     <div className="text-2xl font-bold text-orange-400">
//                       7 Days
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-purple-500/30 p-6">
//                 <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
//                   <Star className="text-yellow-400" size={28} />
//                   Learning Outcome
//                 </h3>
//                 <p className="text-purple-200">
//                   {currentWeek.learning_outcome}
//                 </p>
//               </div>

//               {/* {currentWeek.tasks && currentWeek.tasks.length > 0 && (
//                 <div className="rounded-2xl border border-purple-500/30 p-6">
//                   <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
//                     <Award className="text-purple-400" size={28} />
//                     Tasks
//                   </h3>
//                   <div className="space-y-3">
//                     {currentWeek.tasks.map((task) => (
//                       <div
//                         key={task.id}
//                         className="rounded-lg p-4 border border-purple-500/20"
//                       >
//                         <div className="flex items-start justify-between">
//                           <div>
//                             <h4 className="font-semibold text-white mb-1">
//                               {task.title}
//                             </h4>
//                             <p className="text-sm text-purple-300">
//                               {task.description}
//                             </p>
//                           </div>
//                           {task.is_mandatory && (
//                             <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
//                               Required
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )} */}

// {currentWeek.tasks && currentWeek.tasks.length > 0 && (
//   <div className="rounded-2xl border border-purple-500/30 p-6">
//     <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
//       <Award className="text-purple-400" size={28} />
//       Tasks
//     </h3>
//     <div className="space-y-3">
//       {currentWeek.tasks.map((task) => (
//         <div key={task.id} className="rounded-lg p-4 border border-purple-500/20">
//           {editingTask?.id === task.id ? (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-purple-300 mb-2">Title</label>
//                 <input
//                   type="text"
//                   value={taskFormData.title}
//                   onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
//                   className="w-full border border-purple-500/30 rounded-lg px-4 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
//                 <textarea
//                   value={taskFormData.description}
//                   onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
//                   className="w-full border border-purple-500/30 rounded-lg px-4 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[80px]"
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">Task Type</label>
//                   <select
//                     value={taskFormData.task_type}
//                     onChange={(e) => setTaskFormData({ ...taskFormData, task_type: e.target.value })}
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                   >
//                     <option value="PORTFOLIO_BALANCE" className="bg-gray-900">Portfolio Balance</option>
//                     <option value="TRADE_COUNT" className="bg-gray-900">Trade Count</option>
//                     <option value="PROFIT_TARGET" className="bg-gray-900">Profit Target</option>
//                     <option value="WIN_RATE" className="bg-gray-900">Win Rate</option>
//                     <option value="RISK_MANAGEMENT" className="bg-gray-900">Risk Management</option>
//                     <option value="LEARNING" className="bg-gray-900">Learning</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-purple-300 mb-2">Target Value</label>
//                   <input
//                     type="number"
//                     value={taskFormData.target_value}
//                     onChange={(e) => setTaskFormData({ ...taskFormData, target_value: parseFloat(e.target.value) })}
//                     className="w-full border border-purple-500/30 rounded-lg px-4 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
//                   />
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={handleSaveTask}
//                   className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
//                 >
//                   Save
//                 </button>
//                 <button
//                   onClick={handleCancelEdit}
//                   className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="flex items-start justify-between">
//               <div>
//                 <h4 className="font-semibold text-white mb-1">{task.title}</h4>
//                 <p className="text-sm text-purple-300">{task.description}</p>
//                 <div className="mt-2 flex gap-2 text-xs">
//                   <span className="px-2 py-1 bg-purple-600/30 rounded">{task.task_type}</span>
//                   <span className="px-2 py-1 bg-blue-600/30 rounded">Target: {task.target_value}</span>
//                   {task.is_mandatory && (
//                     <span className="px-2 py-1 bg-red-600/30 rounded">Required</span>
//                   )}
//                 </div>
//               </div>
//               <button
//                 onClick={() => handleEditTask(task)}
//                 className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
//               >
//                 Edit
//               </button>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   </div>
// )}

// {toast && (
//   <Toast
//     message={toast.message}
//     type={toast.type}
//     onClose={() => setToast(null)}
//   />
// )}
//             </div>

//             <div className="space-y-6">
//               <div className="rounded-2xl border border-purple-500/30 p-6">
//                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
//                   <Calendar className="text-purple-400" size={24} />
//                   Schedule
//                 </h3>
//                 <div className="space-y-3">
//                   <div>
//                     <div className="text-sm text-purple-300 mb-1">
//                       Start Date
//                     </div>
//                     <div className="text-white font-semibold">
//                       {new Date(currentWeek.start_date).toLocaleDateString()}
//                     </div>
//                   </div>
//                   <div>
//                     <div className="text-sm text-purple-300 mb-1">End Date</div>
//                     <div className="text-white font-semibold">
//                       {new Date(currentWeek.end_date).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {currentWeek.reward && (
//                 <div className="rounded-2xl border border-purple-500/30 p-6">
//                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
//                     <Trophy className="text-yellow-400" size={24} />
//                     Rewards
//                   </h3>
//                   <div className="space-y-4">
//                     <div className="text-center">
//                       <div className="text-4xl mb-2">🏆</div>
//                       <div className="font-semibold text-orange-400 mb-1">
//                         {currentWeek.reward.badge_name}
//                       </div>
//                       <div className="text-xs text-purple-300">
//                         {currentWeek.reward.badge_description}
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="rounded-lg p-3 text-center">
//                         <div className="text-xs text-purple-300 mb-1">
//                           Profit Bonus
//                         </div>
//                         <div className="text-lg font-bold text-green-400">
//                           {currentWeek.reward.profit_bonus_coins} ZC
//                         </div>
//                       </div>
//                       <div className="rounded-lg p-3 text-center">
//                         <div className="text-xs text-purple-300 mb-1">
//                           Loss Recovery
//                         </div>
//                         <div className="text-lg font-bold text-orange-400">
//                           {currentWeek.reward.loss_recovery_coins} ZC
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="rounded-2xl border border-purple-500/30 p-6">
//                 <h3 className="text-xl font-bold mb-4">Status</h3>
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <span className="text-purple-300">Active</span>
//                     <span
//                       className={
//                         currentWeek.is_active
//                           ? "text-green-400"
//                           : "text-red-400"
//                       }
//                     >
//                       {currentWeek.is_active ? (
//                         <Unlock size={20} />
//                       ) : (
//                         <Lock size={20} />
//                       )}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-purple-300">Ongoing</span>
//                     <span
//                       className={
//                         currentWeek.is_ongoing
//                           ? "text-green-400"
//                           : "text-gray-400"
//                       }
//                     >
//                       {currentWeek.is_ongoing ? "Yes" : "No"}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-purple-300">Completed</span>
//                     <span
//                       className={
//                         currentWeek.is_completed
//                           ? "text-green-400"
//                           : "text-gray-400"
//                       }
//                     >
//                       {currentWeek.is_completed ? "Yes" : "No"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Main Challenges Management Component
// export default function ChallengesManagement() {
//   const [challenges, setChallenges] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentView, setCurrentView] = useState("list");
//   const [selectedChallengeId, setSelectedChallengeId] = useState(null);

//   useEffect(() => {
//     if (currentView === "list") {
//       fetchChallenges();
//     }
//   }, [currentView]);

//   const fetchChallenges = async () => {
//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));
//       const response = await fetch(
//         `${baseURL}challenges/admin/challenges`,
//         {
//           headers: {
//             Authorization: `Bearer ${tokens.access}`,
//           },
//         }
//       );
//       const data = await response.json();
//       setChallenges(data.results);
//     } catch (error) {
//       console.error("Error fetching challenges:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = (challengeId) => {
//     setSelectedChallengeId(challengeId);
//     setCurrentView("details");
//   };

//   if (currentView === "create") {
//     return (
//       <CreateChallenge
//         onBack={() => setCurrentView("list")}
//         onSuccess={() => setCurrentView("list")}
//       />
//     );
//   }

//   if (currentView === "details" && selectedChallengeId) {
//     return (
//       <ChallengeDetails
//         challengeId={selectedChallengeId}
//         onBack={() => setCurrentView("list")}
//       />
//     );
//   }

//   return (
//     <div className="min-h-screen text-white p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-4xl font-bold mb-2">Challenges Management</h1>
//             <p className="text-purple-300 text-lg">
//               Create and manage trading challenges
//             </p>
//           </div>
//           <button
//             onClick={() => setCurrentView("create")}
//             className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
//           >
//             <Plus size={20} />
//             Create New Challenge
//           </button>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
//           <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
//             <div>
//               <div className="text-sm text-purple-300">Total Challenges</div>
//               <div className="text-2xl font-semibold text-white">
//                 {challenges?.length}
//               </div>
//             </div>
//             <Trophy className="text-yellow-400 opacity-90" size={26} />
//           </div>

//           <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
//             <div>
//               <div className="text-sm text-purple-300">Active Challenges</div>
//               <div className="text-2xl font-semibold text-white">
//                 {challenges?.filter((c) => c.is_active).length}
//               </div>
//             </div>
//             <TrendingUp className="text-green-400 opacity-90" size={26} />
//           </div>

//           <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
//             <div>
//               <div className="text-sm text-purple-300">Total Participants</div>
//               <div className="text-2xl font-semibold text-white">
//                 {challenges?.reduce((sum, c) => sum + c.total_participants, 0)}
//               </div>
//             </div>
//             <Users className="text-blue-400 opacity-90" size={26} />
//           </div>
//         </div>

//         <div className="rounded-2xl border border-purple-500/20 backdrop-blur-sm p-6 shadow-md">
//           <h2 className="text-2xl font-semibold text-white mb-6">
//             All Challenges
//           </h2>

//           {loading ? (
//             <div className="flex items-center justify-center py-16">
//               <Loader className="animate-spin text-purple-400" size={48} />
//             </div>
//           ) : challenges?.length === 0 ? (
//             <div className="text-center py-16 text-purple-300">
//               <Trophy size={72} className="mx-auto mb-4 opacity-40" />
//               <h3 className="text-xl font-medium mb-2">No Challenges Yet</h3>
//               <p className="text-sm opacity-70">
//                 Create your first challenge to get started.
//               </p>
//             </div>
//           ) : (
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//               {challenges?.map((challenge) => (
//                 <div
//                   key={challenge.id}
//                   onClick={() => handleViewDetails(challenge.id)}
//                   className="group rounded-xl border border-purple-500/20 bg-[#120B20]/40 p-6 transition-all duration-300 hover:border-purple-400/40 hover:bg-[#160C26]/70 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
//                 >
//                   <div className="flex items-start justify-between mb-3">
//                     <div>
//                       <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
//                         {challenge.name}
//                       </h3>
//                       <span
//                         className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${
//                           challenge.is_active
//                             ? "bg-green-500/20 text-green-400"
//                             : "bg-gray-500/20 text-gray-400"
//                         }`}
//                       >
//                         {challenge.is_active ? "Active" : "Inactive"}
//                       </span>
//                     </div>
//                     <ChevronRight
//                       size={22}
//                       className="text-purple-400 opacity-80 group-hover:translate-x-1 transition-transform duration-300"
//                     />
//                   </div>

//                   <p className="text-sm text-purple-300/80 mb-5 leading-relaxed line-clamp-2">
//                     {challenge.description || "No description available."}
//                   </p>

//                   <div className="grid grid-cols-2 gap-y-3 text-sm">
//                     <div>
//                       <p className="text-xs text-purple-300/70 mb-0.5">
//                         Difficulty
//                       </p>
//                       <p className="font-medium text-orange-400 capitalize">
//                         {challenge.difficulty.toLowerCase()}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-purple-300/70 mb-0.5">Weeks</p>
//                       <p className="font-medium text-purple-400">
//                         {challenge.weeks}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-purple-300/70 mb-0.5">
//                         Participants
//                       </p>
//                       <p className="font-medium text-blue-400">
//                         {challenge.total_participants}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-purple-300/70 mb-0.5">
//                         Created
//                       </p>
//                       <p className="font-medium text-white">
//                         {new Date(challenge.created_at).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// Create New Challenge Component
// const CreateChallenge = ({ onBack, onSuccess }) => {
//   const [step, setStep] = useState(1); // 1: Challenge, 2: Weeks, 3: Tasks
//   const [challengeId, setChallengeId] = useState(null);
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     difficulty: "BEGINNER",
//     is_active: true,
//   });
//   const [weeks, setWeeks] = useState([]);
//   const [createdWeeks, setCreatedWeeks] = useState([]); // Store created weeks with IDs
//   const [currentWeek, setCurrentWeek] = useState(1);
//   const [weekFormData, setWeekFormData] = useState({
//     title: "",
//     description: "",
//     learning_outcome: "",
//     trading_type: "SPOT",
//     start_date: "",
//     end_date: "",
//     target_goal: 5,
//     min_trades_required: 3,
//     is_active: true,
//   });
//   const [tasks, setTasks] = useState({});
//   const [currentTask, setCurrentTask] = useState({
//     title: "",
//     description: "",
//     task_type: "PORTFOLIO_BALANCE",
//     target_value: 10,
//     is_mandatory: true,
//     order: 1,
//   });
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);

//   const showToast = (message, type) => {
//     setToast({ message, type });
//   };

//   const handleChallengeSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));
//       const response = await fetch(`${baseURL}challenges/admin/challenges/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokens.access}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setChallengeId(data.data.id);
//         showToast("Challenge created successfully!", "success");
//         setTimeout(() => setStep(2), 1000);
//       } else {
//         showToast(data.detail || "Failed to create challenge", "error");
//       }
//     } catch (error) {
//       showToast("Error creating challenge: " + error.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleWeekSave = () => {
//     if (!weekFormData.title || !weekFormData.start_date || !weekFormData.end_date) {
//       showToast("Please fill all required fields", "error");
//       return;
//     }

//     // Check if maximum 4 weeks already exist
//     if (weeks.length >= 4 && !weeks[currentWeek - 1]) {
//       showToast("Maximum 4 weeks allowed per program", "error");
//       return;
//     }

//     setWeeks((prev) => {
//       const newWeeks = [...prev];
//       newWeeks[currentWeek - 1] = {
//         ...weekFormData,
//         week_number: currentWeek,
//       };
//       return newWeeks;
//     });

//     showToast(`Week ${currentWeek} data saved`, "success");
//   };

//   // const handleWeeksSubmit = async () => {
//   //   if (weeks.length === 0) {
//   //     showToast("Please add at least one week", "error");
//   //     return;
//   //   }

//   //   if (weeks.length > 4) {
//   //     showToast("Maximum 4 weeks allowed per program", "error");
//   //     return;
//   //   }

//   //   setLoading(true);
//   //   try {
//   //     const tokens = JSON.parse(localStorage.getItem("authTokens"));
//   //     const createdWeeksData = [];

//   //     for (const week of weeks) {
//   //       // Format dates to ISO format with Z suffix
//   //       const formattedStartDate = new Date(week.start_date).toISOString();
//   //       const formattedEndDate = new Date(week.end_date).toISOString();

//   //       const response = await fetch(
//   //         `${baseURL}challenges/admin/weeks/`,
//   //         {
//   //           method: "POST",
//   //           headers: {
//   //             "Content-Type": "application/json",
//   //             Authorization: `Bearer ${tokens.access}`,
//   //           },
//   //           body: JSON.stringify({
//   //             program: challengeId,
//   //             title: week.title,
//   //             description: week.description,
//   //             learning_outcome: week.learning_outcome,
//   //             week_number: week.week_number,
//   //             trading_type: week.trading_type,
//   //             start_date: formattedStartDate,
//   //             end_date: formattedEndDate,
//   //             target_goal: week.target_goal,
//   //             min_trades_required: week.min_trades_required,
//   //             is_active: week.is_active,
//   //           }),
//   //         }
//   //       );

//   //       const data = await response.json();

//   //       if (response.ok) {
//   //         createdWeeksData.push(data);
//   //       } else {
//   //         showToast(`Failed to create week ${week.week_number}: ${data.detail || "Unknown error"}`, "error");
//   //         setLoading(false);
//   //         return;
//   //       }
//   //     }

//   //     showToast("All weeks created successfully!", "success");
//   //     setCreatedWeeks(createdWeeksData);
//   //     setTimeout(() => setStep(3), 1000);
//   //   } catch (error) {
//   //     showToast("Error creating weeks: " + error.message, "error");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const handleWeeksSubmit = async () => {
//     if (weeks.length === 0) {
//       showToast("Please add at least one week", "error");
//       return;
//     }

//     if (weeks.length > 4) {
//       showToast("Maximum 4 weeks allowed per program", "error");
//       return;
//     }

//     setLoading(true);
//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));
//       const createdWeeksData = [];

//       for (const week of weeks) {
//         // Format dates to ISO format with Z suffix
//         const formattedStartDate = new Date(week.start_date).toISOString();
//         const formattedEndDate = new Date(week.end_date).toISOString();

//         const payload = {
//           program: challengeId,
//           title: week.title,
//           description: week.description,
//           learning_outcome: week.learning_outcome,
//           week_number: week.week_number,
//           trading_type: week.trading_type,
//           start_date: formattedStartDate,
//           end_date: formattedEndDate,
//           target_goal: week.target_goal,
//           min_trades_required: week.min_trades_required,
//           is_active: week.is_active,
//         };

//         // Console log the payload
//         console.log(`Week ${week.week_number} Payload:`, payload);
//         console.log(`Week ${week.week_number} Payload (JSON):`, JSON.stringify(payload, null, 2));

//         const response = await fetch(
//           `${baseURL}challenges/admin/weeks/`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${tokens.access}`,
//             },
//             body: JSON.stringify(payload),
//           }
//         );

//         const data = await response.json();

//         // Console log the response
//         console.log(`Week ${week.week_number} Response:`, data);

//         if (response.ok) {
//           createdWeeksData.push(data);
//         } else {
//           console.error(`Week ${week.week_number} Error Response:`, data);
//           showToast(`Failed to create week ${week.week_number}: ${data.detail || "Unknown error"}`, "error");
//           setLoading(false);
//           return;
//         }
//       }

//       console.log("All Created Weeks Data:", createdWeeksData);
//       showToast("All weeks created successfully!", "success");
//       setCreatedWeeks(createdWeeksData);
//       setTimeout(() => setStep(3), 1000);
//     } catch (error) {
//       console.error("Error creating weeks:", error);
//       showToast("Error creating weeks: " + error.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Check if current week already has a task (max 1 task per week)
//   const currentWeekHasTask = tasks[currentWeek] && tasks[currentWeek].length > 0;

//   const handleAddTask = () => {
//     if (!currentTask.title || !currentTask.description) {
//       showToast("Please fill task title and description", "error");
//       return;
//     }

//     if (currentWeekHasTask) {
//       showToast("Only 1 task allowed per week. Remove the existing task first.", "error");
//       return;
//     }

//     setTasks((prev) => ({
//       ...prev,
//       [currentWeek]: [{ ...currentTask }],
//     }));

//     setCurrentTask({
//       title: "",
//       description: "",
//       task_type: "PORTFOLIO_BALANCE",
//       target_value: 10,
//       is_mandatory: true,
//       order: 1,
//     });

//     showToast("Task added", "success");
//   };

//   const handleRemoveTask = (weekNum) => {
//     setTasks((prev) => {
//       const newTasks = { ...prev };
//       delete newTasks[weekNum];
//       return newTasks;
//     });
//     showToast("Task removed", "success");
//   };

//   const handleTasksSubmit = async () => {
//     setLoading(true);
//     try {
//       const tokens = JSON.parse(localStorage.getItem("authTokens"));

//       for (const [weekNumber, weekTasks] of Object.entries(tasks)) {
//         const weekData = createdWeeks.find(w => w.week_number === parseInt(weekNumber));
//         if (!weekData) continue;

//         for (const task of weekTasks) {
//           const response = await fetch(
//             `${baseURL}challenges/tasks/?week=${weekData.id}`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${tokens.access}`,
//               },
//               body: JSON.stringify({
//                 week: weekData.id,
//                 title: task.title,
//                 description: task.description,
//                 task_type: task.task_type,
//                 target_value: task.target_value,
//                 is_mandatory: task.is_mandatory,
//                 order: task.order,
//               }),
//             }
//           );

//           const data = await response.json();

//           if (!response.ok) {
//             showToast(`Failed to create task: ${data.detail || "Unknown error"}`, "error");
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       showToast("Challenge created successfully with all weeks and tasks!", "success");
//       setTimeout(() => onSuccess(), 1500);
//     } catch (error) {
//       showToast("Error creating tasks: " + error.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSkipTasks = () => {
//     showToast("Challenge created successfully!", "success");
//     setTimeout(() => onSuccess(), 1000);
//   };

//   useEffect(() => {
//     if (step === 2 && currentWeek <= weeks.length && weeks[currentWeek - 1]) {
//       setWeekFormData(weeks[currentWeek - 1]);
//     } else if (step === 2) {
//       setWeekFormData({
//         title: "",
//         description: "",
//         learning_outcome: "",
//         trading_type: "SPOT",
//         start_date: "",
//         end_date: "",
//         target_goal: 5,
//         min_trades_required: 3,
//         is_active: true,
//       });
//     }
// }, [currentWeek, step]);

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

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
};
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
  const [createdWeeks, setCreatedWeeks] = useState({}); // Changed to object: { weekNumber: weekData }
  const [currentWeek, setCurrentWeek] = useState(1);
  // const [weekFormData, setWeekFormData] = useState({
  //   title: "",
  //   description: "",
  //   learning_outcome: "",
  //   trading_type: "SPOT",
  //   start_date: "",
  //   end_date: "",
  //   target_goal: 5,
  //   min_trades_required: 3,
  //   is_active: true,
  // });

  const [weekFormData, setWeekFormData] = useState({
    title: "",
    description: "",
    learning_outcome: "",
    trading_type: "SPOT",
    start_date: "",
    end_date: "",
    target_goal: 5,
    min_trades_required: "",
    min_spot_trades: 0,
    min_futures_trades: 0,
    min_options_trades: 0,
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
      console.log(data);

      if (response.ok) {
        setChallengeId(data.data.id);
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
    if (
      !weekFormData.title ||
      !weekFormData.start_date ||
      !weekFormData.end_date
    ) {
      showToast("Please fill all required fields", "error");
      return;
    }

    // Check if maximum 4 weeks already exist
    if (weeks.length >= 4 && !weeks[currentWeek - 1]) {
      showToast("Maximum 4 weeks allowed per program", "error");
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

  // New function to create a single week
  const handleCreateWeek = async (weekNumber) => {
    const week = weeks[weekNumber - 1];

    if (!week) {
      showToast(`Please save Week ${weekNumber} data first`, "error");
      console.error(`Week ${weekNumber} not found in weeks array`, {
        weekNumber,
        weeks,
      });
      return null;
    }

    // Check if week is already created
    if (createdWeeks[weekNumber]) {
      console.log(
        `Week ${weekNumber} already created with ID:`,
        createdWeeks[weekNumber].id
      );
      console.log(`Week ${weekNumber} full data:`, createdWeeks[weekNumber]);
      return createdWeeks[weekNumber];
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const formattedStartDate = new Date(week.start_date).toISOString();
      const formattedEndDate = new Date(week.end_date).toISOString();

      // const payload = {
      //   program: challengeId,
      //   title: week.title,
      //   description: week.description,
      //   learning_outcome: week.learning_outcome,
      //   week_number: week.week_number,
      //   trading_type: week.trading_type,
      //   start_date: formattedStartDate,
      //   end_date: formattedEndDate,
      //   target_goal: parseFloat(week.target_goal), // Ensure it's a number
      //   min_trades_required: parseInt(week.min_trades_required), // Ensure it's a number
      //   is_active: week.is_active,
      // };

      const payload = {
        program: challengeId,
        title: week.title,
        description: week.description,
        learning_outcome: week.learning_outcome,
        week_number: week.week_number,
        trading_type: week.trading_type,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        target_goal: parseFloat(week.target_goal),
        min_trades_required: parseInt(week.min_trades_required),
        is_active: week.is_active,
        min_spot_trades : parseInt(week.min_spot_trades)
      };

      // Add conditional fields based on trading type
      if (week.trading_type !== "SPOT") {
        
        payload.min_futures_trades = parseInt(week.min_futures_trades);

        if (
          week.trading_type === "SPOT_FUTURES_OPTIONS" ||
          week.trading_type === "PORTFOLIO"
        ) {
          payload.min_options_trades = parseInt(week.min_options_trades);
        }
      }

      console.log(
        `Creating Week ${weekNumber} Payload:`,
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch(`${baseURL}challenges/admin/weeks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(`Week ${weekNumber} Response Status:`, response.status);
      console.log(
        `Week ${weekNumber} Response Data:`,
        JSON.stringify(data, null, 2)
      );

      if (response.ok) {
        // Store the created week data - it could be in data or data.data
        const weekDataToStore = data.data || data;

        console.log(`Storing Week ${weekNumber} with data:`, weekDataToStore);

        setCreatedWeeks((prev) => ({
          ...prev,
          [weekNumber]: weekDataToStore,
        }));

        showToast(`Week ${weekNumber} created successfully!`, "success");
        return weekDataToStore;
      } else {
        console.error(`Week ${weekNumber} Error:`, data);
        showToast(
          `Failed to create week ${weekNumber}: ${
            data.detail || JSON.stringify(data)
          }`,
          "error"
        );
        return null;
      }
    } catch (error) {
      console.error(`Error creating week ${weekNumber}:`, error);
      showToast("Error creating week: " + error.message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleWeeksSubmit = async () => {
    if (weeks.length === 0) {
      showToast("Please add at least one week", "error");
      return;
    }

    if (weeks.length > 4) {
      showToast("Maximum 4 weeks allowed per program", "error");
      return;
    }

    showToast("Weeks data saved! Now add tasks.", "success");
    setTimeout(() => setStep(3), 500);
  };

  // Check if current week already has a task (max 1 task per week)
  const currentWeekHasTask =
    tasks[currentWeek] && tasks[currentWeek].length > 0;

  const handleAddTask = async () => {
    if (!currentTask.title || !currentTask.description) {
      showToast("Please fill task title and description", "error");
      return;
    }

    if (currentWeekHasTask) {
      showToast(
        "Only 1 task allowed per week. Remove the existing task first.",
        "error"
      );
      return;
    }

    // Create the week first if not already created - get the week data directly
    const weekData = await handleCreateWeek(currentWeek);
    if (!weekData) {
      return; // Stop if week creation failed
    }

    // Now create the task using the returned weekData
    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const taskPayload = {
        week: weekData.id,
        title: currentTask.title,
        description: currentTask.description,
        task_type: currentTask.task_type,
        target_value: currentTask.target_value,
        is_mandatory: currentTask.is_mandatory,
        order: currentTask.order,
      };

      console.log(`Creating task for Week ${currentWeek}:`, taskPayload);

      const response = await fetch(
        `${baseURL}challenges/tasks/?week=${weekData.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(taskPayload),
        }
      );

      const data = await response.json();
      console.log(`Task Response:`, data);

      if (response.ok) {
        setTasks((prev) => ({
          ...prev,
          [currentWeek]: [{ ...currentTask, id: data.id }],
        }));

        setCurrentTask({
          title: "",
          description: "",
          task_type: "PORTFOLIO_BALANCE",
          target_value: 10,
          is_mandatory: true,
          order: 1,
        });

        showToast(`Task added to Week ${currentWeek}`, "success");
      } else {
        showToast(
          `Failed to create task: ${data.detail || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating task:", error);
      showToast("Error creating task: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTask = (weekNum) => {
    setTasks((prev) => {
      const newTasks = { ...prev };
      delete newTasks[weekNum];
      return newTasks;
    });
    showToast("Task removed", "success");
  };

  const handleTasksSubmit = async () => {
    if (Object.keys(tasks).length === 0) {
      showToast("Please add at least one task", "error");
      return;
    }

    showToast(
      "Challenge created successfully with all weeks and tasks!",
      "success"
    );
    setTimeout(() => onSuccess(), 1500);
  };

  const handleSkipTasks = () => {
    showToast("Challenge created successfully!", "success");
    setTimeout(() => onSuccess(), 1000);
  };

  // useEffect(() => {
  //   if (step === 2 && currentWeek <= weeks.length && weeks[currentWeek - 1]) {
  //     setWeekFormData(weeks[currentWeek - 1]);
  //   } else if (step === 2) {
  //     setWeekFormData({
  //       title: "",
  //       description: "",
  //       learning_outcome: "",
  //       trading_type: "SPOT",
  //       start_date: "",
  //       end_date: "",
  //       target_goal: 5,
  //       min_trades_required: 3,
  //       is_active: true,
  //     });
  //   }
  // }, [currentWeek, step]);

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
        min_trades_required: "",
        min_spot_trades: 0,
        min_futures_trades: 0,
        min_options_trades: 0,
        is_active: true,
      });
    }
  }, [currentWeek, step]);

  const handleTradingTypeChange = (tradingType) => {
    setWeekFormData({
      ...weekFormData,
      trading_type: tradingType,
      min_trades_required: 0,
      min_spot_trades: 0,
      min_futures_trades: 0,
      min_options_trades: 0,
    });
  };

  // Rest of the JSX remains the same...

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
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? "text-purple-400" : "text-gray-500"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1
                  ? "border-purple-400 bg-purple-400/20"
                  : "border-gray-500"
              }`}
            >
              1
            </div>
            <span className="font-medium">Challenge</span>
          </div>
          <div
            className={`w-12 h-0.5 ${
              step >= 2 ? "bg-purple-400" : "bg-gray-500"
            }`}
          />
          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? "text-purple-400" : "text-gray-500"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2
                  ? "border-purple-400 bg-purple-400/20"
                  : "border-gray-500"
              }`}
            >
              2
            </div>
            <span className="font-medium">Weeks</span>
          </div>
          <div
            className={`w-12 h-0.5 ${
              step >= 3 ? "bg-purple-400" : "bg-gray-500"
            }`}
          />
          <div
            className={`flex items-center gap-2 ${
              step >= 3 ? "text-purple-400" : "text-gray-500"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3
                  ? "border-purple-400 bg-purple-400/20"
                  : "border-gray-500"
              }`}
            >
              3
            </div>
            <span className="font-medium">Tasks</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 p-8">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Plus className="text-purple-400" size={32} />
            {step === 1
              ? "Create New Challenge"
              : step === 2
              ? "Add Weeks (Max 4)"
              : "Add Tasks (1 per Week)"}
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
                  placeholder="e.g., Challenges for BEGINNER"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Description
                </label>
                {/* <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500 min-h-[120px]"
                  placeholder="Describe the challenge objectives and structure..."
                /> */}

                <div>
                  <ReactQuill
                    value={formData.description}
                    onChange={(value) =>
                      setFormData({ ...formData, description: value })
                    }
                    placeholder="Describe the challenge objectives and structure..."
                    className="quill-custom"
                  />
                </div>
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
                    <option value="BEGINNER" className="bg-gray-900">
                      Beginner
                    </option>
                    <option value="INTERMEDIATE" className="bg-gray-900">
                      Intermediate
                    </option>
                    <option value="ADVANCED" className="bg-gray-900">
                      Advanced
                    </option>
                    <option value="EXPERT" className="bg-gray-900">
                      Expert
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.value === "true",
                      })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                  >
                    <option value="true" className="bg-gray-900">
                      Active
                    </option>
                    <option value="false" className="bg-gray-900">
                      Inactive
                    </option>
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
                {[1, 2, 3, 4].map((weekNum) => {
                  const isPreviousWeekSaved =
                    weekNum === 1 || weeks[weekNum - 2];
                  const isCurrentWeekSaved = weeks[weekNum - 1];
                  const isLocked = !isPreviousWeekSaved;

                  return (
                    <div key={weekNum} className="relative h-20">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isLocked) {
                            setCurrentWeek(weekNum);
                          }
                        }}
                        className={`w-full h-full p-4 rounded-xl border transition-all flex flex-col items-center justify-center ${
                          isLocked
                            ? "bg-gray-900/50 border-gray-700/50 cursor-default"
                            : currentWeek === weekNum
                            ? "bg-purple-900/30 border-purple-500 shadow-lg"
                            : isCurrentWeekSaved
                            ? "border-green-500/50 bg-green-900/10 hover:border-green-400/50"
                            : "border-purple-500/30 hover:border-purple-400/50"
                        }`}
                      >
                        <div
                          className={`text-lg font-bold ${
                            isLocked ? "text-gray-500" : "text-white"
                          }`}
                        >
                          Week {weekNum}
                        </div>
                        {isCurrentWeekSaved && !isLocked && (
                          <div className="text-xs text-green-400 mt-1">
                            ✓ Saved
                          </div>
                        )}
                      </button>

                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50">
                          <div className="text-center px-2">
                            <Lock
                              className="mx-auto mb-2 text-gray-400"
                              size={24}
                            />
                            <div className="text-xs text-gray-400 font-medium leading-tight">
                              Save Week {weekNum - 1}
                              <br />
                              to add Week {weekNum}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* <div className="bg-purple-900/10 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">Editing: Week {currentWeek}</h3>
                <p className="text-sm text-purple-300">Maximum 4 weeks allowed per program</p>
              </div> */}

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
                      setWeekFormData({
                        ...weekFormData,
                        title: e.target.value,
                      })
                    }
                    className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Week 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Description
                  </label>
                  <ReactQuill
                    value={weekFormData.description}
                    onChange={(value) =>
                      setWeekFormData({ ...weekFormData, description: value })
                    }
                    placeholder="Describe the week's objectives..."
                    className="quill-custom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Learning Outcome
                  </label>
                  <ReactQuill
                    value={weekFormData.learning_outcome}
                    onChange={(value) =>
                      setWeekFormData({
                        ...weekFormData,
                        learning_outcome: value,
                      })
                    }
                    placeholder="What will users learn this week..."
                    className="quill-custom"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Trading Type
                    </label>
                    {/* <select
                      value={weekFormData.trading_type}
                      onChange={(e) =>
                        setWeekFormData({
                          ...weekFormData,
                          trading_type: e.target.value,
                        })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    > */}

                    <select
                      value={weekFormData.trading_type}
                      onChange={(e) => handleTradingTypeChange(e.target.value)}
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    >
                      <option value="SPOT" className="bg-gray-900">
                        Spot Trading
                      </option>
                      <option value="SPOT_FUTURES" className="bg-gray-900">
                        Spot + Futures
                      </option>
                      <option
                        value="SPOT_FUTURES_OPTIONS"
                        className="bg-gray-900"
                      >
                        Spot + Futures + Options
                      </option>
                      <option value="PORTFOLIO" className="bg-gray-900">
                        Portfolio Management
                      </option>
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
                        setWeekFormData({
                          ...weekFormData,
                          target_goal: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Min Trades Required
                    </label>
                    <input
                      type="number"
                      value={weekFormData.min_trades_required}
                      onChange={(e) =>
                        setWeekFormData({
                          ...weekFormData,
                          min_trades_required: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                    />
                  </div> */}

                  {weekFormData.trading_type === "SPOT" ? (
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Min Trades Required
                      </label>
                      <input
                        type="number"
                        value={weekFormData.min_trades_required}
                        onChange={(e) =>
                          setWeekFormData({
                            ...weekFormData,
                            min_trades_required:
                              e.target.value === ""
                                ? ""
                                : parseInt(e.target.value),
                          })
                        }
                        className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ) : weekFormData.trading_type === "SPOT_FUTURES" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Min Spot Trades
                        </label>
                        <input
                          type="number"
                          value={weekFormData.min_spot_trades}
                          onChange={(e) => {
                            const spotTrades = parseInt(e.target.value) || 0;
                            setWeekFormData({
                              ...weekFormData,
                              min_spot_trades: spotTrades,
                              min_trades_required:
                                spotTrades + weekFormData.min_futures_trades,
                            });
                          }}
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Min Futures Trades
                        </label>
                        <input
                          type="number"
                          value={weekFormData.min_futures_trades}
                          onChange={(e) => {
                            const futuresTrades = parseInt(e.target.value) || 0;
                            setWeekFormData({
                              ...weekFormData,
                              min_futures_trades: futuresTrades,
                              min_trades_required:
                                weekFormData.min_spot_trades + futuresTrades,
                            });
                          }}
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </>
                  ) : (
                    // SPOT_FUTURES_OPTIONS or PORTFOLIO
                    <>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Min Spot Trades
                        </label>
                        <input
                          type="number"
                          value={weekFormData.min_spot_trades}
                          onChange={(e) => {
                            const spotTrades = parseInt(e.target.value) || 0;
                            setWeekFormData({
                              ...weekFormData,
                              min_spot_trades: spotTrades,
                              min_trades_required:
                                spotTrades +
                                weekFormData.min_futures_trades +
                                weekFormData.min_options_trades,
                            });
                          }}
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Min Futures Trades
                        </label>
                        <input
                          type="number"
                          value={weekFormData.min_futures_trades}
                          onChange={(e) => {
                            const futuresTrades = parseInt(e.target.value) || 0;
                            setWeekFormData({
                              ...weekFormData,
                              min_futures_trades: futuresTrades,
                              min_trades_required:
                                weekFormData.min_spot_trades +
                                futuresTrades +
                                weekFormData.min_options_trades,
                            });
                          }}
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Min Options Trades
                        </label>
                        <input
                          type="number"
                          value={weekFormData.min_options_trades}
                          onChange={(e) => {
                            const optionsTrades = parseInt(e.target.value) || 0;
                            setWeekFormData({
                              ...weekFormData,
                              min_options_trades: optionsTrades,
                              min_trades_required:
                                weekFormData.min_spot_trades +
                                weekFormData.min_futures_trades +
                                optionsTrades,
                            });
                          }}
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </>
                  )}
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
                        setWeekFormData({
                          ...weekFormData,
                          start_date: e.target.value,
                        })
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
                        setWeekFormData({
                          ...weekFormData,
                          end_date: e.target.value,
                        })
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
                {weeks.map((week, index) => {
                  const weekNumber = index + 1;
                  const isCreated = !!createdWeeks[weekNumber];

                  return (
                    <button
                      key={weekNumber}
                      type="button"
                      onClick={() => setCurrentWeek(weekNumber)}
                      className={`p-4 rounded-xl border transition-all ${
                        currentWeek === weekNumber
                          ? "bg-purple-900/30 border-purple-500 shadow-lg"
                          : "border-purple-500/30 hover:border-purple-400/50"
                      }`}
                    >
                      <div className="text-lg font-bold">Week {weekNumber}</div>
                      <div className="text-xs text-purple-300 mt-1">
                        {tasks[weekNumber] ? "1 task" : "0 tasks"}
                      </div>
                      {isCreated && (
                        <div className="text-xs text-green-400 mt-1">
                          ✓ Created
                        </div>
                      )}
                      {!isCreated && (
                        <div className="text-xs text-yellow-400 mt-1">
                          Not created
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* <div className="bg-purple-900/10 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">
        Add Task for Week {currentWeek}
      </h3>
      <p className="text-sm text-purple-300">
        {weeks[currentWeek - 1]?.title || `Week ${currentWeek}`}
      </p>
      <p className="text-xs text-orange-400 mt-1">
        ⚠️ Only 1 task allowed per week
      </p>
      {!createdWeeks[currentWeek] && (
        <p className="text-xs text-yellow-400 mt-2">
          ℹ️ Week will be created automatically when you add a task
        </p>
      )}
    </div> */}

              {/* Existing Task */}
              {currentWeekHasTask && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-purple-300">
                    Current Task:
                  </h4>
                  <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-semibold text-white mb-1">
                          {tasks[currentWeek][0].title}
                        </h5>
                        <p
  className="text-sm text-purple-300"
  dangerouslySetInnerHTML={{
    __html: tasks[currentWeek][0].description,
  }}
/>

<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
  {/* Task Type */}
  <span className="inline-flex items-center rounded-full bg-purple-500/15 px-3 py-1 font-medium text-purple-300 border border-purple-500/30">
    {tasks[currentWeek][0].task_type}
  </span>

  {/* Target */}
  <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 font-medium text-blue-300 border border-blue-500/30">
    🎯 Target: {tasks[currentWeek][0].target_value} %
  </span>

  {/* Mandatory */}
  {tasks[currentWeek][0].is_mandatory && (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 font-medium text-red-300 border border-red-500/30">
      ⚠ Mandatory
    </span>
  )}
</div>

                      </div>
                      {/* <button
              onClick={() => handleRemoveTask(currentWeek)}
              className="text-red-400 hover:text-red-300 p-2"
            >
              <Trash2 size={18} />
            </button> */}
                    </div>
                  </div>
                  {/* <p className="text-sm text-purple-300 italic">
          This week already has a task. Remove it to add a different task.
        </p> */}
                </div>
              )}

              {/* Add New Task Form - Only show if week doesn't have a task */}
              {!currentWeekHasTask && (
                <div className="bg-gray-900/30 rounded-lg p-6 border border-purple-500/20">
                  <h4 className="font-semibold text-purple-300 mb-4">
                    Add New Task
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={currentTask.title}
                        onChange={(e) =>
                          setCurrentTask({
                            ...currentTask,
                            title: e.target.value,
                          })
                        }
                        className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        placeholder="e.g., Maintain positive portfolio balance"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Description
                      </label>
                      <ReactQuill
  value={currentTask.description}
  onChange={(value) =>
    setCurrentTask({
      ...currentTask,
      description: value,
    })
  }
  placeholder="Describe the task requirements..."
  className="quill-custom"
/>
                    </div>

                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> */}
                    <div
                      className={`grid grid-cols-1 ${
                        weekFormData.trading_type === "SPOT"
                          ? "md:grid-cols-3"
                          : weekFormData.trading_type === "SPOT_FUTURES"
                          ? "md:grid-cols-4"
                          : "md:grid-cols-5"
                      } gap-4`}
                    >
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Task Type
                        </label>
                        <select
                          value={currentTask.task_type}
                          onChange={(e) =>
                            setCurrentTask({
                              ...currentTask,
                              task_type: e.target.value,
                            })
                          }
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        >
                          <option
                            value="PORTFOLIO_BALANCE"
                            className="bg-gray-900"
                          >
                            Portfolio Balance
                          </option>
                          <option value="TRADE_COUNT" className="bg-gray-900">
                            Trade Count
                          </option>
                          <option value="PROFIT_TARGET" className="bg-gray-900">
                            Profit Target
                          </option>
                          <option value="WIN_RATE" className="bg-gray-900">
                            Win Rate
                          </option>
                          <option
                            value="RISK_MANAGEMENT"
                            className="bg-gray-900"
                          >
                            Risk Management
                          </option>
                          <option value="LEARNING" className="bg-gray-900">
                            Learning
                          </option>
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
                            setCurrentTask({
                              ...currentTask,
                              target_value: parseFloat(e.target.value),
                            })
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
                            setCurrentTask({
                              ...currentTask,
                              is_mandatory: e.target.value === "true",
                            })
                          }
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                        >
                          <option value="true" className="bg-gray-900">
                            Yes
                          </option>
                          <option value="false" className="bg-gray-900">
                            No
                          </option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTask}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          Add Task to Week {currentWeek}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

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
                      Saving...
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
  const [weekTasks, setWeekTasks] = useState({});
  console.log(weekTasks, "the week task");
  const [toast, setToast] = useState(null);

  const [editingWeek, setEditingWeek] = useState(null);
  const [editWeekData, setEditWeekData] = useState({
    title: "",
    description: "",
  });

  // Add this state for editing learning outcome (add to existing state variables)
  const [editingLearning, setEditingLearning] = useState(false);
  const [editLearningData, setEditLearningData] = useState("");

  // Add these handler functions
  const handleEditLearning = () => {
    setEditingLearning(true);
    setEditLearningData(currentWeek.learning_outcome);
  };

  const handleUpdateLearning = async () => {
    if (!editLearningData.trim()) {
      showToast("Please fill the learning outcome", "error");
      return;
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const payload = {
        learning_outcome: editLearningData,
      };

      console.log("Updating Learning Outcome:", currentWeek.id, payload);

      const response = await fetch(
        `${baseURL}challenges/admin/weeks/${currentWeek.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("Learning outcome updated successfully!", "success");
        setEditingLearning(false);
        await fetchWeekData(); // Refresh the data
      } else {
        showToast(
          `Failed to update learning outcome: ${JSON.stringify(data)}`,
          "error"
        );
      }
    } catch (error) {
      showToast("Error updating learning outcome: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLearningEdit = () => {
    setEditingLearning(false);
    setEditLearningData("");
  };

  // Add this handler function
  const handleEditWeek = (week) => {
    setEditingWeek(week);
    setEditWeekData({
      title: week.title,
      description: week.description,
    });
  };

  const [editingGoals, setEditingGoals] = useState(false);
  const [editGoalsData, setEditGoalsData] = useState({
    target_goal: 0,
    min_trades_required: 0,
  });

  // Add these handler functions
  const handleEditGoals = () => {
    setEditingGoals(true);
    setEditGoalsData({
      target_goal: currentWeek.target_goal,
      min_trades_required: currentWeek.min_trades_required,
    });
  };

  const handleUpdateGoals = async () => {
    if (!editGoalsData.target_goal || !editGoalsData.min_trades_required) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const payload = {
        target_goal: parseFloat(editGoalsData.target_goal),
        min_trades_required: parseInt(editGoalsData.min_trades_required),
      };

      console.log("Updating Goals:", currentWeek.id, payload);

      const response = await fetch(
        `${baseURL}challenges/admin/weeks/${currentWeek.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("Goals updated successfully!", "success");
        setEditingGoals(false);
        await fetchWeekData(); // Refresh the data
      } else {
        showToast(`Failed to update goals: ${JSON.stringify(data)}`, "error");
      }
    } catch (error) {
      showToast("Error updating goals: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGoalsEdit = () => {
    setEditingGoals(false);
    setEditGoalsData({
      target_goal: 0,
      min_trades_required: 0,
    });
  };

  const handleUpdateWeek = async () => {
    if (!editWeekData.title || !editWeekData.description) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const payload = {
        title: editWeekData.title,
        description: editWeekData.description,
      };

      console.log("Updating Week:", currentWeek.id, payload);

      const response = await fetch(
        `${baseURL}challenges/admin/weeks/${currentWeek.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("Week updated successfully!", "success");
        setEditingWeek(null);
        await fetchWeekData(); // Refresh the data
      } else {
        showToast(`Failed to update week: ${JSON.stringify(data)}`, "error");
      }
    } catch (error) {
      showToast("Error updating week: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWeekEdit = () => {
    setEditingWeek(null);
    setEditWeekData({
      title: "",
      description: "",
    });
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchWeekData();
  }, [challengeId]);

  // Add state for editing task
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    title: "",
    description: "",
    task_type: "PORTFOLIO_BALANCE",
    target_value: 10,
    is_mandatory: true,
    order: 1,
  });

  // Handle edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditTaskData({
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      target_value: parseFloat(task.target_value),
      is_mandatory: task.is_mandatory,
      order: task.order,
    });
  };

  // Handle update task
  const handleUpdateTask = async () => {
    if (!editTaskData.title || !editTaskData.description) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      // Only include fields that might have changed
      const payload = {
        title: editTaskData.title,
        description: editTaskData.description,
        task_type: editTaskData.task_type,
        target_value: parseFloat(editTaskData.target_value),
        is_mandatory: editTaskData.is_mandatory,
        order: editTaskData.order,
      };

      console.log("=== UPDATE TASK DEBUG ===");
      console.log("Task ID:", editingTask.id);
      console.log("Method: PATCH (Partial Update)");
      console.log("Payload (Object):", payload);
      console.log("Payload (JSON):", JSON.stringify(payload, null, 2));
      console.log("API URL:", `${baseURL}challenges/tasks/${editingTask.id}/`);

      const response = await fetch(
        `${baseURL}challenges/tasks/${editingTask.id}/`,
        {
          method: "PATCH", // ✅ Changed from PUT to PATCH
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("Response Status:", response.status);
      console.log("Response OK:", response.ok);

      const data = await response.json();
      console.log("Response Data:", JSON.stringify(data, null, 2));

      if (response.ok) {
        showToast("Task updated successfully!", "success");
        setEditingTask(null);
        await fetchTasksForWeek(currentWeek.id);
      } else {
        console.error("❌ Update failed:", data);
        showToast(`Failed to update task: ${JSON.stringify(data)}`, "error");
      }
    } catch (error) {
      console.error("❌ Error updating task:", error);
      showToast("Error updating task: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setLoading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      const response = await fetch(`${baseURL}challenges/tasks/${taskId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (response.ok || response.status === 204) {
        showToast("Task deleted successfully!", "success");
        // Refresh tasks for current week
        await fetchTasksForWeek(currentWeek.id);
      } else {
        const data = await response.json();
        showToast(
          `Failed to delete task: ${data.detail || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast("Error deleting task: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTaskData({
      title: "",
      description: "",
      task_type: "PORTFOLIO_BALANCE",
      target_value: 10,
      is_mandatory: true,
      order: 1,
    });
  };

  const fetchWeekData = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      const response = await fetch(
        `${baseURL}challenges/admin/weeks/?program=${challengeId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
      const data = await response.json();

      const weeks = data.results || data;
      setWeekData(weeks.slice(0, 4));

      // Fetch tasks for each week
      for (const week of weeks) {
        await fetchTasksForWeek(week.id);
      }
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForWeek = async (weekId) => {
    try {
      const tokens = JSON.parse(localStorage.getItem("authTokens"));

      // Change: Use 'week' parameter to filter by week ID
      const response = await fetch(
        `${baseURL}challenges/tasks/?week=${weekId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );

      const data = await response.json();
      console.log(`Tasks response for week ${weekId}:`, data);

      // Handle response - could be array or object with results
      const tasks = Array.isArray(data) ? data : data.results || [];

      // Filter tasks client-side to ensure we only get tasks for this week
      const filteredTasks = tasks.filter((task) => task.week === weekId);

      console.log(`Filtered tasks for week ${weekId}:`, filteredTasks);

      setWeekTasks((prev) => ({
        ...prev,
        [weekId]: filteredTasks,
      }));
    } catch (error) {
      console.error(`Error fetching tasks for week ${weekId}:`, error);
      setWeekTasks((prev) => ({
        ...prev,
        [weekId]: [],
      }));
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

  // Get tasks for current week using week ID
  const currentWeekTasks =
    currentWeek && weekTasks[currentWeek.id] ? weekTasks[currentWeek.id] : [];

  console.log("=== DEBUG ===");
  console.log("Selected Week Number:", selectedWeek);
  console.log("Current Week Object:", currentWeek);
  console.log("Current Week ID:", currentWeek?.id);
  console.log("All weekTasks:", weekTasks);
  console.log("Current Week Tasks:", currentWeekTasks);

  console.log(currentWeekTasks, "current week task");

  return (
    <div className="min-h-screen text-white p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
                  {weekTasks[week.id] && weekTasks[week.id].length > 0
                    ? `${weekTasks[week.id].length} task`
                    : "No tasks"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {currentWeek && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* <div className="rounded-2xl border border-purple-500/30 p-6">
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
              </div> */}

              <div className="rounded-2xl border border-purple-500/30 p-6">
                {editingWeek && editingWeek.id === currentWeek.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold mb-4">
                      Edit Week {currentWeek.week_number}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Week Title
                      </label>
                      <input
                        type="text"
                        value={editWeekData.title}
                        onChange={(e) =>
                          setEditWeekData({
                            ...editWeekData,
                            title: e.target.value,
                          })
                        }
                        className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Description
                      </label>
                      <ReactQuill
  value={editWeekData.description}
  onChange={(value) =>
    setEditWeekData({
      ...editWeekData,
      description: value,
    })
  }
  placeholder="Describe the week's objectives..."
  className="quill-custom"
/>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateWeek}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelWeekEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-3xl font-bold">
                        {currentWeek.title}
                      </h2>
                      <button
                        onClick={() => handleEditWeek(currentWeek)}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit Week"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap mb-4">
                      <span className="text-yellow-400">
                        {getDifficultyStars("BEGINNER")}
                      </span>
                      <span className="px-3 py-1 bg-purple-600 rounded-full text-sm">
                        {getTradingTypeLabel(currentWeek.trading_type)}
                      </span>
                    </div>

                    <p
  className="text-purple-200"
  dangerouslySetInnerHTML={{
    __html: currentWeek.description,
  }}
/>

                  </div>
                )}
              </div>

              {/* <div className="rounded-2xl border border-purple-500/30 p-6">
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
                </div> */}

              <div className="rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Target className="text-purple-400" size={28} />
                    Mission Goals
                  </h3>
                  {!editingGoals && (
                    <button
                      onClick={handleEditGoals}
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit Goals"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}
                </div>

                {editingGoals ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Target Goal (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editGoalsData.target_goal}
                          onChange={(e) =>
                            setEditGoalsData({
                              ...editGoalsData,
                              target_goal: e.target.value,
                            })
                          }
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                          placeholder="e.g., 5.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                          Min Trades Required
                        </label>
                        <input
                          type="number"
                          value={editGoalsData.min_trades_required}
                          onChange={(e) =>
                            setEditGoalsData({
                              ...editGoalsData,
                              min_trades_required: e.target.value,
                            })
                          }
                          className="w-full border border-purple-500/30 rounded-lg px-4 py-3 text-white bg-transparent focus:outline-none focus:border-purple-500"
                          placeholder="e.g., 8"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleUpdateGoals}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelGoalsEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
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
                      <div className="text-sm text-purple-300 mb-1">
                        Duration
                      </div>
                      <div className="text-2xl font-bold text-orange-400">
                        7 Days
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="rounded-2xl border border-purple-500/30 p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="text-yellow-400" size={28} />
                  Learning Outcome
                </h3>
                <p className="text-purple-200">
                  {currentWeek.learning_outcome}
                </p>
              </div> */}

              <div className="rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="text-yellow-400" size={28} />
                    Learning Outcome
                  </h3>
                  {!editingLearning && (
                    <button
                      onClick={handleEditLearning}
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit Learning Outcome"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}
                </div>

                {editingLearning ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Learning Outcome
                      </label>
                     
<ReactQuill
  value={editLearningData}
  onChange={(value) => setEditLearningData(value)}
  placeholder="Describe what users will learn this week..."
  className="quill-custom"
/>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateLearning}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelLearningEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <p
                  className="text-purple-200"
                  dangerouslySetInnerHTML={{
                    __html: currentWeek.learning_outcome,
                  }}
                />
                
                )}
              </div>

              {/* Display Tasks */}
              {currentWeekTasks.length > 0 && (
                <div className="rounded-2xl border border-purple-500/30 p-6">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Award className="text-purple-400" size={28} />
                    Tasks for Week {selectedWeek}
                  </h3>

                  <div className="space-y-3">
                    {currentWeekTasks.map((task) => (
                      <div key={task.id}>
                        {/* Show Edit Form if editing this task */}
                        {editingTask && editingTask.id === task.id ? (
                          <div className="rounded-lg p-4 border border-purple-500/30 bg-purple-900/20">
                            <h4 className="font-semibold text-white mb-3">
                              Edit Task
                            </h4>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-purple-300 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={editTaskData.title}
                                  onChange={(e) =>
                                    setEditTaskData({
                                      ...editTaskData,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full border border-purple-500/30 rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-purple-300 mb-1">
                                  Description
                                </label>
                                <ReactQuill
  value={editTaskData.description}
  onChange={(value) =>
    setEditTaskData({
      ...editTaskData,
      description: value,
    })
  }
  placeholder="Describe the task requirements..."
  className="quill-custom"
/>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-purple-300 mb-1">
                                    Task Type
                                  </label>
                                  <select
                                    value={editTaskData.task_type}
                                    onChange={(e) =>
                                      setEditTaskData({
                                        ...editTaskData,
                                        task_type: e.target.value,
                                      })
                                    }
                                    className="w-full border border-purple-500/30 rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
                                  >
                                    <option
                                      value="PORTFOLIO_BALANCE"
                                      className="bg-gray-900"
                                    >
                                      Portfolio Balance
                                    </option>
                                    <option
                                      value="TRADE_COUNT"
                                      className="bg-gray-900"
                                    >
                                      Trade Count
                                    </option>
                                    <option
                                      value="PROFIT_TARGET"
                                      className="bg-gray-900"
                                    >
                                      Profit Target
                                    </option>
                                    <option
                                      value="WIN_RATE"
                                      className="bg-gray-900"
                                    >
                                      Win Rate
                                    </option>
                                    <option
                                      value="RISK_MANAGEMENT"
                                      className="bg-gray-900"
                                    >
                                      Risk Management
                                    </option>
                                    <option
                                      value="LEARNING"
                                      className="bg-gray-900"
                                    >
                                      Learning
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-purple-300 mb-1">
                                    Target Value
                                  </label>
                                  <input
                                    type="number"
                                    value={editTaskData.target_value}
                                    onChange={(e) =>
                                      setEditTaskData({
                                        ...editTaskData,
                                        target_value: parseFloat(
                                          e.target.value
                                        ),
                                      })
                                    }
                                    className="w-full border border-purple-500/30 rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-purple-300 mb-1">
                                    Mandatory
                                  </label>
                                  <select
                                    value={editTaskData.is_mandatory}
                                    onChange={(e) =>
                                      setEditTaskData({
                                        ...editTaskData,
                                        is_mandatory: e.target.value === "true",
                                      })
                                    }
                                    className="w-full border border-purple-500/30 rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:border-purple-500"
                                  >
                                    <option
                                      value="true"
                                      className="bg-gray-900"
                                    >
                                      Yes
                                    </option>
                                    <option
                                      value="false"
                                      className="bg-gray-900"
                                    >
                                      No
                                    </option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={handleUpdateTask}
                                  disabled={loading}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {loading ? "Updating..." : "Save Changes"}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Show Task Details
                          // <div className="rounded-lg p-4 border border-purple-500/20 bg-purple-900/10">
                          //   <div className="flex items-start justify-between">
                          //     <div className="flex-1">
                          //       <h4 className="font-semibold text-white mb-1">
                          //         {task.title}
                          //       </h4>
                          //       <p className="text-sm text-purple-300">
                          //         {task.description}
                          //       </p>
                          //       <div className="mt-2 flex gap-2 text-xs flex-wrap">
                          //         <span className="px-2 py-1 bg-purple-600/30 rounded">
                          //           {task.task_type}
                          //         </span>
                          //         <span className="px-2 py-1 bg-blue-600/30 rounded">
                          //           Target: {task.target_value}
                          //         </span>
                          //         {task.is_mandatory && (
                          //           <span className="px-2 py-1 bg-red-600/30 rounded">
                          //             Mandatory
                          //           </span>
                          //         )}
                          //         <span className="px-2 py-1 bg-gray-600/30 rounded">
                          //           Order: {task.order}
                          //         </span>
                          //       </div>
                          //     </div>

                          //     {/* Edit and Delete Buttons */}
                          //     <div className="flex gap-2 ml-4">
                          //       <button
                          //         onClick={() => handleEditTask(task)}
                          //         className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                          //         title="Edit Task"
                          //       >
                          //         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          //           <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          //           <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          //         </svg>
                          //       </button>
                          //       {/* <button
                          //         onClick={() => handleDeleteTask(task.id)}
                          //         className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
                          //         title="Delete Task"
                          //       >
                          //         <Trash2 size={18} />
                          //       </button> */}
                          //     </div>
                          //   </div>
                          // </div>

                          <div className="rounded-xl p-5 border border-purple-500/30 bg-purple-900/10 hover:border-purple-400/40 hover:bg-purple-900/15 transition-all duration-300">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* Title with Edit Button */}
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="font-semibold text-white text-lg">
                                    {task.title}
                                  </h4>
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded-lg transition-all flex-shrink-0"
                                    title="Edit Task"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </button>
                                </div>

                                {/* Description */}
                                <p
  className="text-sm text-purple-300 leading-relaxed"
  dangerouslySetInnerHTML={{
    __html: task.description,
  }}
/>


                                {/* Tags/Badges */}
                                <div className="flex gap-2 flex-wrap">
                                  <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-lg text-xs font-medium">
                                    {task.task_type.replace(/_/g, " ")}
                                  </span>

                                  <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-lg text-xs font-medium">
                                    Target:{" "}
                                    {parseFloat(task.target_value).toFixed(2)}%
                                  </span>

                                  {task.is_mandatory && (
                                    <span className="px-3 py-1 bg-red-600/30 text-red-200 rounded-lg text-xs font-medium">
                                      Required
                                    </span>
                                  )}

                                  <span className="px-3 py-1 bg-gray-600/30 text-gray-200 rounded-lg text-xs font-medium">
                                    Order: {task.order}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
                    <span className="text-purple-300">Participants</span>
                    <span className="text-white font-semibold">
                      {currentWeek.participants_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Completions</span>
                    <span className="text-green-400 font-semibold">
                      {currentWeek.completions_count || 0}
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
      const response = await fetch(`${baseURL}challenges/admin/challenges/`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });
      const data = await response.json();
      setChallenges(data.results || data);
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
                {challenges?.length || 0}
              </div>
            </div>
            <Trophy className="text-yellow-400 opacity-90" size={26} />
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
            <div>
              <div className="text-sm text-purple-300">Active Challenges</div>
              <div className="text-2xl font-semibold text-white">
                {challenges?.filter((c) => c.is_active).length || 0}
              </div>
            </div>
            <TrendingUp className="text-green-400 opacity-90" size={26} />
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-4 flex items-center justify-between hover:border-purple-400/40 transition-all duration-300">
            <div>
              <div className="text-sm text-purple-300">Total Participants</div>
              <div className="text-2xl font-semibold text-white">
                {challenges?.reduce(
                  (sum, c) => sum + (c.total_participants || 0),
                  0
                )}
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

                  <p
                    className="text-sm text-purple-300/80 mb-5 leading-relaxed line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html:
                        challenge.description || "No description available.",
                    }}
                  />

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
                        {challenge.weeks || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-300/70 mb-0.5">
                        Participants
                      </p>
                      <p className="font-medium text-blue-400">
                        {challenge.total_participants || 0}
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
