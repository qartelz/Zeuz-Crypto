
import React from "react";
import { Users, CreditCard, TrendingUp, Activity, BarChart3, PieChart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const B2bDashboard = () => {
  // Dummy data for charts
  const chartData = [
    { name: 'Mon', active: 4000, new: 2400 },
    { name: 'Tue', active: 3000, new: 1398 },
    { name: 'Wed', active: 2000, new: 9800 },
    { name: 'Thu', active: 2780, new: 3908 },
    { name: 'Fri', active: 1890, new: 4800 },
    { name: 'Sat', active: 2390, new: 3800 },
    { name: 'Sun', active: 3490, new: 4300 },
  ];

  const stats = [
    {
      title: "Total Batches",
      value: "124",
      change: "+12.5%",
      icon: Users,
      color: "from-blue-500 to-cyan-400",
    },
    {
      title: "Active Users",
      value: "8,942",
      change: "+5.2%",
      icon: Activity,
      color: "from-purple-500 to-pink-400",
    },
    {
      title: "Total Revenue",
      value: "$142,390",
      change: "+18.2%",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-400",
    },
    {
      title: "Avg. Engagement",
      value: "86%",
      change: "+2.4%",
      icon: TrendingUp,
      color: "from-orange-500 to-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Dashboard Overview
          </h1>
          <p className="text-gray-400 mt-1">Welcome back to your command center</p>
        </div>
        <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md text-sm transition-all border border-white/10">
                Last 7 Days
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all">
                Download Report
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-[#0F0F1E] border border-white/5 p-6 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-20`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                <stat.icon className="text-white w-6 h-6" />
              </div>
              <span className="text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                {stat.change}
              </span>
            </div>
            
            <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#0F0F1E] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Activity Overview
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} />
                <YAxis stroke="#666" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="active" stroke="#8884d8" fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" dataKey="new" stroke="#82ca9d" fillOpacity={1} fill="url(#colorNew)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel / Recent Activity */}
        <div className="bg-[#0F0F1E] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-400" />
            Recent Actions
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300 font-medium">New Batch Created</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
                <Users className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 rounded-lg transition-all">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default B2bDashboard;
