import {
  User,
  ClipboardList,
  CheckCircle,
  Trash2,
  Edit3,
  Eye,
  Loader2,
  Coins,
  CreditCard,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";

/* === Reusable Components === */
function InfoTooltip({ text }) {
  return (
    <div className="group relative inline-block ml-2 z-50">
      <div className="cursor-help text-purple-400/50 hover:text-purple-400 transition-colors">
        <Info size={16} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1f1d2b] border border-purple-500/20 rounded-lg text-xs text-purple-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1f1d2b] box-content"></div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, tooltip }) {
  return (
    <div className="bg-[#13111C] border border-purple-500/20 p-6 rounded-2xl shadow-xl flex items-center hover:border-purple-500/40 transition-all duration-300 group">
      <div className="bg-purple-500/10 p-4 rounded-xl mr-5 group-hover:scale-110 transition-transform duration-300">
        <div className="text-purple-400">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-sm font-medium text-purple-200/60 mb-1 flex items-center gap-1">
          {title}
          {tooltip && <InfoTooltip text={tooltip} />}
        </h2>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children, tooltip }) {
  return (
    <div className="bg-[#13111C] border border-purple-500/20 p-6 rounded-2xl shadow-xl hover:border-purple-500/30 transition-all">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </h2>
      {children}
    </div>
  );
}

function TableCard({ title, children, tooltip }) {
  return (
    <div className="bg-[#13111C] border border-purple-500/20 p-6 rounded-2xl shadow-xl hover:border-purple-500/30 transition-all">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </h2>
      <div className="overflow-x-auto custom-scrollbar">{children}</div>
    </div>
  );
}

/* === Main Component === */
const baseURL = import.meta.env.VITE_API_BASE_URL;

function AdminDashboard({ adminName = "Admin" }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tokens = JSON.parse(localStorage.getItem("authTokens"));
        const response = await fetch(`${baseURL}challenges/admin/dashboard/stats/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard stats");

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-red-400">
        <div className="bg-[#13111C] p-8 rounded-2xl border border-red-500/20 text-center">
          <p className="text-xl font-bold mb-2">Error Loading Dashboard</p>
          <p className="text-sm opacity-70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 space-y-8 text-white">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20">
            <User className="text-purple-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{adminName}</span>
            </h1>
            <p className="text-purple-200/50 text-sm">Here's what's happening today.</p>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<User size={24} />}
          title="Total Users"
          value={stats?.overview?.total_users?.toLocaleString() || 0}
          tooltip="Total registered users on the platform"
        />
        <StatCard
          icon={<CreditCard size={24} />}
          title="Active Subs"
          value={stats?.overview?.active_subscriptions || 0}
          tooltip="Currently active subscriptions"
        />
        <StatCard
          icon={<Coins size={24} />}
          title="Total Revenue"
          value={`₹${stats?.overview?.total_revenue?.toLocaleString() || 0}`}
          tooltip="Total accumulated revenue from all subscriptions"
        />
        <StatCard
          icon={<ClipboardList size={24} />}
          title="Active Challenges"
          value={stats?.overview?.active_challenges || 0}
          tooltip="Challenges currently in progress"
        />
      </div>

      {/* Row 2: Charts Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <div className="lg:col-span-2">
          <ChartCard title="User Growth (6 Months)" tooltip="New user signups over the last 6 months">
            {stats?.charts?.user_growth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={stats.charts.user_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2b3b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f1d2b',
                      borderColor: 'rgba(6, 182, 212, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#e5e7eb' }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: '#06b6d4', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-purple-200/30 text-sm font-medium">
                No user growth data available
              </div>
            )}
          </ChartCard>
        </div>

        {/* Revenue Trend */}
        <div className="lg:col-span-1">
          <ChartCard title="Revenue Trend" tooltip="Monthly revenue for the last 6 months">
            {stats?.charts?.revenue_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.charts.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2b3b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    contentStyle={{
                      backgroundColor: '#1f1d2b',
                      borderColor: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px'
                    }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-purple-200/30 text-sm font-medium">
                No revenue data available
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Row 3: Plan Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="lg:col-span-1">
          <ChartCard title="Valid Plans" tooltip="Breakdown of active subscriptions by plan type">
            {stats?.charts?.plan_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={stats.charts.plan_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.charts.plan_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#3b82f6", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f1d2b',
                      borderColor: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px'
                    }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-purple-200/30 text-sm font-medium">
                No subscription plan data
              </div>
            )}
          </ChartCard>
        </div>

        {/* Recent Activity Table */}
        <div className="lg:col-span-2">
          <TableCard title="Recent Signups" tooltip="The 5 most recent users to join the platform">
            <div className="overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-purple-500/5 text-purple-200/50 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {stats?.recent_activity?.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-purple-500/5 transition-colors duration-200"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{user.name}</p>
                            <p className="text-xs text-purple-200/40 truncate max-w-[120px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(user.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
