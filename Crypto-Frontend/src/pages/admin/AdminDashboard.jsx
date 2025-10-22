import {
    User,
    ClipboardList,
    CheckCircle,
    Trash2,
    Edit3,
    Eye,
  } from "lucide-react";
  import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
  } from "recharts";
  
  /* === Reusable Components === */
  function StatCard({ icon, title, value }) {
    return (
      <div className="bg-gradient-to-br from-[#4733A6] to-[#0F0F1E] p-6 rounded-xl shadow-lg flex items-center border border-white/20">
        <div className="bg-indigo-100 p-3 rounded-full mr-4 text-indigo-600">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-medium text-white/80">{title}</h2>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    );
  }
  
  function ChartCard({ title, children }) {
    return (
      <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 rounded-xl shadow-lg border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        {children}
      </div>
    );
  }
  
  function TableCard({ title, children }) {
    return (
      <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 rounded-xl shadow-lg border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <div className="overflow-x-auto">{children}</div>
      </div>
    );
  }
  
  /* === Dummy Data === */
  const challengesList = [
    {
      id: 1,
      title: "Daily Trading Challenge",
      participants: 120,
      status: "Active",
      progress: 80,
    },
    {
      id: 2,
      title: "Monthly Profit Tracker",
      participants: 85,
      status: "Active",
      progress: 60,
    },
    {
      id: 3,
      title: "Risk Management Task",
      participants: 65,
      status: "Inactive",
      progress: 30,
    },
  ];
  
  const usersList = [
    {
      id: "U001",
      name: "Alice",
      email: "alice@example.com",
      challenges: 5,
      status: "Active",
    },
    {
      id: "U002",
      name: "Bob",
      email: "bob@example.com",
      challenges: 3,
      status: "Active",
    },
    {
      id: "U003",
      name: "Charlie",
      email: "charlie@example.com",
      challenges: 2,
      status: "Banned",
    },
  ];
  
  const userGrowthData = [
    { month: "Jan", users: 400 },
    { month: "Feb", users: 800 },
    { month: "Mar", users: 1200 },
    { month: "Apr", users: 2000 },
    { month: "May", users: 2500 },
  ];
  
  const challengesData = [
    { name: "Completed", value: 320 },
    { name: "Failed", value: 120 },
    { name: "Pending", value: 60 },
  ];
  
  const performanceData = [
    { name: "Mon", score: 75 },
    { name: "Tue", score: 85 },
    { name: "Wed", score: 90 },
    { name: "Thu", score: 60 },
    { name: "Fri", score: 95 },
    { name: "Sat", score: 70 },
    { name: "Sun", score: 88 },
  ];
  
  const COLORS = ["#22c55e", "#ef4444", "#facc15"];
  
  /* === Main Component === */
  function AdminDashboard({ adminName = "Admin Name", totalUsers = 24780 }) {
    return (
      <div className="min-h-screen rounded-4xl p-8 space-y-8 bg-gradient-to-br from-[#0F0F1E] via-[#1a1635] to-[#4733A6]">
        {/* Greeting */}
        <div className="flex items-center space-x-3">
          <User className="text-indigo-400" size={36} strokeWidth={1.5} />
          <h1 className="text-3xl font-semibold text-white">
            Welcome back, {adminName}
          </h1>
        </div>
  
        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={<User />}
            title="Total Users"
            value={totalUsers.toLocaleString()}
          />
          <StatCard icon={<ClipboardList />} title="Active Challenges" value="12" />
          <StatCard icon={<CheckCircle />} title="Completed Challenges" value="505" />
        </div>
  
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users Growth */}
          <ChartCard title="User Growth">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="month" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
  
          {/* Challenges Pie Chart */}
          <ChartCard title="Challenges Status">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={challengesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {challengesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
  
          {/* Weekly Performance */}
          <ChartCard title="Weekly Performance">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="score" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
  
        {/* Challenges Table */}
        <TableCard title="Challenges">
          <table className="w-full text-left text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Participants</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challengesList.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-3">{c.id}</td>
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.participants}</td>
                  <td className="p-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          c.progress > 70 ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${c.progress}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        c.status === "Active"
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 flex space-x-2">
                    <button className="text-blue-400 hover:underline flex items-center">
                      <Edit3 size={16} className="mr-1" /> Edit
                    </button>
                    <button className="text-red-400 hover:underline flex items-center">
                      <Trash2 size={16} className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
  
        {/* Users Table */}
        
      </div>
    );
  }
  
  export default AdminDashboard;
  