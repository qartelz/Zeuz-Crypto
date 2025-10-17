import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
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
  User,
  DollarSign,
  Activity,
  Star,
  Trophy,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Enhanced Data
  const performanceData = [
    { month: "Jan", profit: 400, trades: 25 },
    { month: "Feb", profit: 800, trades: 32 },
    { month: "Mar", profit: -200, trades: 18 },
    { month: "Apr", profit: 600, trades: 28 },
    { month: "May", profit: 1200, trades: 35 },
    { month: "Jun", profit: 1800, trades: 42 },
  ];

  const portfolioData = [
    { name: "Crypto", value: 45, color: "#f59e0b" },
    { name: "Forex", value: 30, color: "#10b981" },
    { name: "Stocks", value: 25, color: "#3b82f6" },
  ];

  const closedTrades = [
    { id: 1, symbol: "BTC/USDT", type: "Long", entry: 65000, exit: 67000, pnl: "+3.08%", amount: "+$2000", status: "Completed", date: "2025-09-08" },
    { id: 2, symbol: "ETH/USDT", type: "Short", entry: 3200, exit: 3100, pnl: "+3.12%", amount: "+$1560", status: "Completed", date: "2025-09-07" },
    { id: 3, symbol: "BNB/USDT", type: "Long", entry: 430, exit: 400, pnl: "-6.98%", amount: "-$1290", status: "Loss", date: "2025-09-06" },
    { id: 4, symbol: "SOL/USDT", type: "Long", entry: 140, exit: 155, pnl: "+10.71%", amount: "+$2340", status: "Completed", date: "2025-09-05" },
  ];

  const activeTrades = [
    { id: 1, symbol: "SOL/USDT", type: "Long", entry: 150, current: 165, pnl: "+10.0%", amount: "+$2250", status: "Ongoing", duration: "2d 4h" },
    { id: 2, symbol: "XRP/USDT", type: "Short", entry: 0.55, current: 0.52, pnl: "+5.45%", amount: "+$327", status: "Ongoing", duration: "1d 12h" },
    { id: 3, symbol: "ADA/USDT", type: "Long", entry: 0.45, current: 0.43, pnl: "-4.44%", amount: "-$178", status: "Ongoing", duration: "3h 25m" },
  ];

  const challenges = [
    { 
      id: 1, 
      title: "10K Profit Challenge", 
      status: "Ongoing", 
      score: 60, 
      progress: 60,
      description: "Make $10,000 profit within 1 month.",
      reward: "$500 Bonus",
      timeLeft: "12 days left"
    },
    { 
      id: 2, 
      title: "Consistency Master", 
      status: "Completed", 
      score: 95, 
      progress: 100,
      description: "Trade daily for 30 days without breaking rules.",
      reward: "$1000 Bonus",
      timeLeft: "Completed!"
    },
    { 
      id: 3, 
      title: "Risk Management Pro", 
      status: "Ongoing", 
      score: 45, 
      progress: 45,
      description: "Maintain risk/reward ratio under 1:2 for 15 trades.",
      reward: "$300 Bonus",
      timeLeft: "8 days left"
    },
  ];

  const StatCard = ({ icon, title, value, change, changeType, subtitle }) => (
    <div className="group bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 hover:scale-105 transform">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className={`p-3 rounded-xl mr-4 text-white shadow-lg transition-all duration-300 ${
              changeType === 'positive' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              changeType === 'negative' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
              'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
          </div>
          {change && (
            <div className={`flex items-center text-sm font-medium ${
              changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {changeType === 'positive' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TradeRow = ({ trade, isActive = false }) => (
    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-300">
      <td className="p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
            {trade.symbol.split('/')[0].slice(0, 2)}
          </div>
          <div>
            <span className="font-semibold text-gray-900">{trade.symbol}</span>
            {isActive && <p className="text-xs text-gray-500">{trade.duration}</p>}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          trade.type === 'Long' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {trade.type}
        </span>
      </td>
      <td className="p-4 font-medium text-gray-700">${trade.entry}</td>
      <td className="p-4 font-medium text-gray-700">${isActive ? trade.current : trade.exit}</td>
      <td className="p-4">
        <div className="text-right">
          <div className={`font-bold ${trade.pnl.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            {trade.pnl}
          </div>
          <div className={`text-sm ${trade.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            {trade.amount}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          trade.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
          trade.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {trade.status}
        </span>
      </td>
    </tr>
  );

  const ChallengeCard = ({ challenge }) => (
    <div
      className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 hover:scale-105 transform cursor-pointer overflow-hidden"
      onClick={() => setSelectedChallenge(challenge)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl mr-4 text-white shadow-lg ${
              challenge.status === 'Completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}>
              {challenge.status === 'Completed' ? <Trophy size={24} /> : <Target size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{challenge.title}</h3>
              <p className="text-sm text-gray-500">{challenge.timeLeft}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            challenge.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {challenge.status}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-indigo-600">{challenge.score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${challenge.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Reward: {challenge.reward}</span>
          <Eye size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
        </div>
      </div>
    </div>
  );

  // Render Tab Content
  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={<TrendingUp size={24} />} 
                title="Win Rate" 
                value="72.4%" 
                change="+2.1% this month"
                changeType="positive"
              />
              <StatCard 
                icon={<Activity size={24} />} 
                title="Total Trades" 
                value="180" 
                change="+15 this week"
                changeType="positive"
              />
              <StatCard 
                icon={<Award size={24} />} 
                title="Challenges" 
                value="8" 
                subtitle="3 ongoing"
                changeType="neutral"
              />
              <StatCard 
                icon={<DollarSign size={24} />} 
                title="Total PnL" 
                value="+$18,650" 
                change="+$3,200 this month"
                changeType="positive"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Performance Chart */}
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
                    <p className="text-gray-500 text-sm">Monthly profit trend</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Profit</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#profitGradient)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Portfolio Distribution */}
              <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/20">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {portfolioData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "closed":
        return (
          <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Closed Trades</h2>
              <p className="text-gray-500 text-sm mt-1">Your trading history and performance</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Symbol</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Entry</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Exit</th>
                    <th className="text-right p-4 font-semibold text-gray-900">PnL</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.map((trade) => (
                    <TradeRow key={trade.id} trade={trade} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "active":
        return (
          <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Active Trades</h2>
              <p className="text-gray-500 text-sm mt-1">Currently open positions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Symbol</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Entry</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Current</th>
                    <th className="text-right p-4 font-semibold text-gray-900">PnL</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map((trade) => (
                    <TradeRow key={trade.id} trade={trade} isActive={true} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "challenges":
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}

            {/* Enhanced Challenge Details Modal */}
            {selectedChallenge && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedChallenge.title}</h2>
                        <p className="text-indigo-100 mt-1">{selectedChallenge.timeLeft}</p>
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
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700">{selectedChallenge.description}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-900">Progress</h3>
                        <span className="text-2xl font-bold text-indigo-600">{selectedChallenge.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                          style={{ width: `${selectedChallenge.progress}%` }}
                        >
                          <span className="text-white text-xs font-bold">
                            {selectedChallenge.progress >= 20 ? `${selectedChallenge.progress}%` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-700 mb-1">Status</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedChallenge.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedChallenge.status}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-700 mb-1">Reward</h4>
                        <p className="text-indigo-600 font-semibold">{selectedChallenge.reward}</p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                        onClick={() => setSelectedChallenge(null)}
                      >
                        Continue Challenge
                      </button>
                      <button
                        className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedChallenge(null)}
                      >
                        Close
                      </button>
                    </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Profile Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src="https://i.pravatar.cc/120"
                    alt="User"
                    className="w-24 h-24 rounded-2xl border-4 border-white/20 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">John Doe</h1>
                  <p className="text-indigo-100 text-lg">Professional Trader</p>
                  <p className="text-indigo-200 text-sm">User ID: TRD12345</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <p className="text-indigo-100 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">$15,230</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="text-indigo-500" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">john@example.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="text-indigo-500" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">March 2024</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Activity className="text-emerald-500" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="font-medium text-gray-900">Sep 8, 2025</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="text-indigo-500" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">Kochi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex space-x-0">
            {[
              { key: "overview", label: "Overview", icon: <Activity size={20} /> },
              { key: "closed", label: "Closed Trades", icon: <TrendingUp size={20} /> },
              { key: "active", label: "Active Trades", icon: <Star size={20} /> },
              { key: "challenges", label: "Challenges", icon: <Trophy size={20} /> }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
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

          