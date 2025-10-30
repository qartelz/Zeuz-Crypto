import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Calendar,
  MapPin,
  Mail,
  Activity,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ArrowLeft,
  DollarSign,
  TrendingUpIcon,
  Loader,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-yellow-500";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "⚠";

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in`}>
      <span className="text-xl font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
};

const UserProfile = () => {
  const { userId } = useParams();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleBack = () => {
    if (location.pathname.startsWith("/admin/users/")) {
      navigate("/admin/userspage");
    } else if (location.pathname.startsWith("/admin/reports/")) {
      navigate("/admin/reports");
    } else if (location.pathname.startsWith("/admin/settings/")) {
      navigate("/admin/settings");
    } else if (location.pathname.startsWith("/admin/adminspage/")) {
      navigate("/admin/adminspage");
    } else {
      navigate(-1);
    }
  };

  const tokens = JSON.parse(localStorage.getItem('authTokens'));

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${baseURL}account/users/${userId}/details/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if user is rejected
        if (data.admin_users && data.admin_users.length > 0) {
          const rejectedUser = data.admin_users.find(admin => admin.status === "rejected");
          if (rejectedUser) {
            showToast(
              `This user was rejected. Reason: ${rejectedUser.rejection_reason || "No reason provided"}`,
              "error"
            );
            setTimeout(() => {
              handleBack();
            }, 3000);
            return;
          }
        }
        
        setUserData(data);
      } catch (err) {
        setError(err.message || "Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // Calculate portfolio distribution
  const calculatePortfolioDistribution = () => {
    if (!userData?.trades) return [];
    
    const typeCount = { SPOT: 0, FUTURES: 0, OPTIONS: 0 };
    userData.trades.forEach(trade => {
      if (trade.status === "OPEN") {
        typeCount[trade.trade_type] = (typeCount[trade.trade_type] || 0) + 1;
      }
    });

    const total = Object.values(typeCount).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return [
      { name: "Spot", value: Math.round((typeCount.SPOT / total) * 100), color: "#f59e0b" },
      { name: "Futures", value: Math.round((typeCount.FUTURES / total) * 100), color: "#10b981" },
      { name: "Options", value: Math.round((typeCount.OPTIONS / total) * 100), color: "#3b82f6" },
    ].filter(item => item.value > 0);
  };

  // Calculate win rate
  const calculateWinRate = () => {
    if (!userData?.trades) return 0;
    const closedTrades = userData.trades.filter(t => t.status === "CLOSED");
    if (closedTrades.length === 0) return 0;
    const winningTrades = closedTrades.filter(t => parseFloat(t.realized_pnl) > 0);
    return ((winningTrades.length / closedTrades.length) * 100).toFixed(1);
  };

  // Calculate total PnL
  const calculateTotalPnL = () => {
    if (!userData?.trades) return 0;
    const total = userData.trades.reduce((sum, trade) => {
      return sum + parseFloat(trade.realized_pnl || 0) + parseFloat(trade.unrealized_pnl || 0);
    }, 0);
    return total.toFixed(2);
  };

  // Get trades by status
  const getTradesByStatus = (status) => {
    if (!userData?.trades) return [];
    return userData.trades.filter(t => t.status === status);
  };

  const StatCard = ({ icon, title, value, change, changeType, subtitle }) => (
    <div className="group rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-5 transition-all duration-300 hover:border-purple-400/40 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className={`p-2.5 rounded-lg mr-3 transition-all duration-300 ${
              changeType === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
              changeType === 'negative' ? 'bg-red-500/20 text-red-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="text-xs font-medium text-purple-300/70 uppercase tracking-wide">{title}</h3>
              <p className="text-xl font-bold text-white mt-0.5">{value}</p>
              {subtitle && <p className="text-xs text-purple-300/60 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {change && (
            <div className={`flex items-center text-sm font-medium ${
              changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {changeType === 'positive' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TradeRow = ({ trade, isActive = false }) => {
    const pnl = isActive ? parseFloat(trade.unrealized_pnl) : parseFloat(trade.realized_pnl);
    const pnlPercent = trade.pnl_percentage ? `${trade.pnl_percentage.toFixed(2)}%` : '0.00%';
    
    return (
      <tr className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-all duration-200">
        <td className="p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <span className="font-semibold text-white">{trade.asset_symbol}</span>
              <p className="text-xs text-purple-300/70">{trade.trade_type}</p>
            </div>
          </div>
        </td>
        <td className="p-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            trade.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trade.direction}
          </span>
        </td>
        <td className="p-4 font-medium text-purple-200">${parseFloat(trade.average_price).toFixed(2)}</td>
        <td className="p-4 font-medium text-purple-200">{parseFloat(trade.total_quantity).toFixed(4)}</td>
        <td className="p-4">
          <div className="text-right">
            <div className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}{pnlPercent}
            </div>
            <div className={`text-sm ${pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
              {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
            </div>
          </div>
        </td>
        <td className="p-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            trade.status === 'CLOSED' ? 'bg-gray-500/20 text-gray-400' :
            trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {trade.status}
          </span>
        </td>
      </tr>
    );
  };

  const ChallengeCard = ({ challenge }) => {
    const progress = parseFloat(challenge.portfolio_return_pct || 0);
    const targetGoal = parseFloat(challenge.week_details?.target_goal || 0);
    const progressPercent = targetGoal > 0 ? Math.min((progress / targetGoal) * 100, 100) : 0;
    
    return (
      <div
        className="group rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-6 transition-all duration-300 hover:border-purple-400/40 hover:bg-[#160C26]/70 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
        onClick={() => setSelectedChallenge(challenge)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg mr-3 ${
              challenge.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {challenge.status === 'COMPLETED' ? <Trophy size={24} /> : <Target size={24} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{challenge.week_details?.title}</h3>
              <p className="text-sm text-purple-300/70">{challenge.week_details?.program_name}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            challenge.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {challenge.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-purple-300/70">Progress</span>
            <span className="text-sm font-bold text-purple-400">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-purple-500/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-purple-300/70">
          <span>Trades: {challenge.total_trades}/{challenge.week_details?.min_trades_required}</span>
          <span>Return: {challenge.portfolio_return_pct}%</span>
        </div>
      </div>
    );
  };

  const renderTab = () => {
    if (!userData) return null;

    switch (activeTab) {
      case "overview":
        const totalPnL = parseFloat(calculateTotalPnL());
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={<TrendingUp size={20} />} 
                title="Win Rate" 
                value={`${calculateWinRate()}%`} 
                changeType="neutral"
              />
              <StatCard 
                icon={<Activity size={20} />} 
                title="Total Trades" 
                value={userData.trades?.length || 0} 
                subtitle={`${getTradesByStatus("OPEN").length} active`}
                changeType="neutral"
              />
              <StatCard 
                icon={<Award size={20} />} 
                title="Challenges" 
                value={userData.challenge_participations?.length || 0} 
                subtitle={`${userData.challenge_participations?.filter(c => c.status === "IN_PROGRESS").length || 0} ongoing`}
                changeType="neutral"
              />
              <StatCard 
                icon={<DollarSign size={20} />} 
                title="Total PnL" 
                value={`${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL)}`}
                change={`${totalPnL >= 0 ? '+' : ''}${((totalPnL / parseFloat(userData.wallet?.balance || 1)) * 100).toFixed(2)}%`}
                changeType={totalPnL >= 0 ? "positive" : "negative"}
              />
            </div>

            <div className="grid grid-cols-1  lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-xl border border-purple-500/20 bg-[#120B20]/60 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Wallet Balance</h2>
                    <p className="text-purple-300/70 text-sm">Available funds and trading capital</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                    <p className="text-sm text-purple-300/70 mb-1">Total Balance</p>
                    <p className="text-2xl font-bold text-white">${userData.wallet?.balance || '0.00'}</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                    <p className="text-sm text-purple-300/70 mb-1">Total PnL</p>
                    <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL)}
                    </p>
                  </div>
                </div>
              </div>

              {calculatePortfolioDistribution().length > 0 && (
                <div className="rounded-xl  border border-purple-500/20 bg-[#120B20]/60 p-6">
                  <h2 className="text-xl font-bold text-white mb-5">Portfolio Distribution</h2>
                  <ResponsiveContainer width="100%" height={110}>
                    <PieChart>
                      <Pie
                        data={calculatePortfolioDistribution()}
                        cx="40%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {calculatePortfolioDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a0f2e', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {calculatePortfolioDistribution().map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm text-purple-300/70">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "closed":
        const closedTrades = getTradesByStatus("CLOSED");
        return (
          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/40 overflow-hidden">
            <div className="bg-purple-500/10 px-6 py-4 border-b border-purple-500/20">
              <h2 className="text-xl font-bold text-white">Closed Trades</h2>
              <p className="text-purple-300/70 text-sm mt-1">Trading history and performance</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-500/5">
                  <tr>
                    <th className="text-left p-4 font-semibold text-purple-300">Symbol</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Direction</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Avg Price</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Quantity</th>
                    <th className="text-right p-4 font-semibold text-purple-300">PnL</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.length > 0 ? (
                    closedTrades.map((trade) => (
                      <TradeRow key={trade.id} trade={trade} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-purple-300/70">
                        No closed trades found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "active":
        const activeTrades = getTradesByStatus("OPEN");
        return (
          <div className="rounded-xl border border-purple-500/20 bg-[#120B20]/40 overflow-hidden">
            <div className="bg-purple-500/10 px-6 py-4 border-b border-purple-500/20">
              <h2 className="text-xl font-bold text-white">Active Trades</h2>
              <p className="text-purple-300/70 text-sm mt-1">Currently open positions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-500/5">
                  <tr>
                    <th className="text-left p-4 font-semibold text-purple-300">Symbol</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Direction</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Avg Price</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Quantity</th>
                    <th className="text-right p-4 font-semibold text-purple-300">PnL</th>
                    <th className="text-left p-4 font-semibold text-purple-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.length > 0 ? (
                    activeTrades.map((trade) => (
                      <TradeRow key={trade.id} trade={trade} isActive={true} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-purple-300/70">
                        No active trades found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "challenges":
        return (
          <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.challenge_participations?.length > 0 ? (
                userData.challenge_participations.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-purple-300/70">
                  <Trophy size={64} className="mx-auto mb-4 opacity-40" />
                  <h3 className="text-xl font-medium mb-2">No Challenges Yet</h3>
                  <p className="text-sm opacity-70">User hasn't participated in any challenges.</p>
                </div>
              )}
            </div>

            {selectedChallenge && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#120B20] border border-purple-500/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedChallenge.week_details?.title}</h2>
                        <p className="text-white/80 mt-1">{selectedChallenge.week_details?.program_name}</p>
                      </div>
                      <button
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setSelectedChallenge(null)}
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-white mb-2">Description</h3>
                      <p className="text-purple-300/80">{selectedChallenge.week_details?.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-300/70 mb-1 text-sm">Status</h4>
                        <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                          selectedChallenge.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {selectedChallenge.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-300/70 mb-1 text-sm">Return</h4>
                        <p className="text-purple-400 font-semibold text-lg">{selectedChallenge.portfolio_return_pct}%</p>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-300/70 mb-1 text-sm">Total Trades</h4>
                        <p className="text-white font-semibold text-lg">{selectedChallenge.total_trades}</p>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-300/70 mb-1 text-sm">Starting Balance</h4>
                        <p className="text-white font-semibold text-lg">${selectedChallenge.starting_balance}</p>
                      </div>
                    </div>

                    {selectedChallenge.week_details?.tasks && (
                      <div>
                        <h3 className="font-semibold text-white mb-3">Tasks</h3>
                        <div className="space-y-2">
                          {selectedChallenge.week_details.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                              <div>
                                <p className="font-medium text-white">{task.title}</p>
                                <p className="text-sm text-purple-300/70">{task.description}</p>
                              </div>
                              {task.is_mandatory && (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Required</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                      onClick={() => setSelectedChallenge(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="inline-block animate-spin text-purple-400" size={48} />
          <p className="text-purple-300 mt-4 text-lg">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-8 py-6 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/admin/userspage')}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen text-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-200 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <div className="rounded-2xl border border-purple-500/30 bg-[#120B20]/60 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {userData.first_name?.charAt(0)}{userData.last_name?.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 ${userData.is_active ? 'bg-emerald-500' : 'bg-red-500'} rounded-full border-4 border-[#120B20] flex items-center justify-center`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {userData.full_name || `${userData.first_name} ${userData.last_name}`}
                  </h1>
                  <p className="text-white/80 text-base">{userData.role?.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-white/60 text-sm">User ID: {userData.id?.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">${userData.wallet?.balance || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#120B20]/80 p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="flex items-center gap-3">
                <Mail className="text-purple-400" size={20} />
                <div>
                  <p className="text-xs text-purple-300/70">Email</p>
                  <p className="font-medium text-white text-sm">{userData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-purple-400" size={20} />
                <div>
                  <p className="text-xs text-purple-300/70">Joined</p>
                  <p className="font-medium text-white text-sm">
                    {new Date(userData.date_joined).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="text-emerald-400" size={20} />
                <div>
                  <p className="text-xs text-purple-300/70">Last Login</p>
                  <p className="font-medium text-white text-sm">
                    {userData.last_login 
                      ? new Date(userData.last_login).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-purple-400" size={20} />
                <div>
                  <p className="text-xs text-purple-300/70">Mobile</p>
                  <p className="font-medium text-white text-sm">{userData.mobile || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-purple-500/20 bg-[#120B20]/40 overflow-hidden">
          <div className="flex space-x-0">
            {[
              { key: "overview", label: "Overview", icon: <Activity size={18} /> },
              { key: "closed", label: "Closed Trades", icon: <TrendingDown size={18} /> },
              { key: "active", label: "Active Trades", icon: <TrendingUpIcon size={18} /> },
              { key: "challenges", label: "Challenges", icon: <Trophy size={18} /> }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "text-purple-300/70 hover:text-white hover:bg-purple-500/10"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span className="hidden sm:inline text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">{renderTab()}</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;