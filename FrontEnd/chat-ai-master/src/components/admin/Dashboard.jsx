import { useEffect, useState, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, TrendingUp, Calendar } from "lucide-react";
import useAdminUserApi from "@/hooks/admin/useAdminUserAPI";
import dayjs from "dayjs";

const COLORS = ["#10A37F", "#F87171"]; // xanh lá - đỏ nhạt

const Dashboard = () => {
  const { getAllUser } = useAdminUserApi();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  const getAllUserRef = useRef(getAllUser);

  // Cập nhật ref khi function thay đổi
  useEffect(() => {
    getAllUserRef.current = getAllUser;
  }, [getAllUser]);

  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (hasFetchedRef.current) return;
    
    const fetchUsers = async () => {
      try {
        hasFetchedRef.current = true;
        const res = await getAllUserRef.current();
        setUsers(res || []);
      } catch (err) {
        setError("Không thể tải dữ liệu người dùng.");
        hasFetchedRef.current = false; // Reset để có thể retry
      }
    };
    
    fetchUsers();
  }, []); // Empty deps - chỉ chạy một lần

  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!users) return <p className="p-4">Đang tải dữ liệu...</p>;

  // Tính số active/inactive
  const statusLower = (u) => {
    if (!u.status) return "";
    // Xử lý cả trường hợp status là string hoặc object Enum
    const statusValue = typeof u.status === "string" ? u.status : (u.status.value || u.status);
    return String(statusValue).toLowerCase();
  };
  const active = users.filter((u) => statusLower(u) === "active").length;
  const inactive = users.length - active;

  // Biểu đồ donut
  const pieData = [
    { name: "Active", value: active },
    { name: "Inactive", value: inactive },
  ];

  // 5 user mới nhất, sắp xếp theo created_at giảm dần
  const latestUsers = [...users]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Tính số user tạo trong 7 ngày gần nhất
  const today = dayjs();
  const newLast7Days = users.filter((u) =>
    dayjs(u.created_at).isAfter(today.subtract(7, "day"))
  ).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tổng quan hệ thống và thống kê người dùng
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
          <p className="text-3xl font-bold">{users.length}</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <p className="text-emerald-100 text-sm font-medium mb-1">Active Users</p>
          <p className="text-3xl font-bold">{active}</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserX className="w-6 h-6" />
            </div>
          </div>
          <p className="text-red-100 text-sm font-medium mb-1">Inactive Users</p>
          <p className="text-3xl font-bold">{inactive}</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-purple-100 text-sm font-medium mb-1">New (7 days)</p>
          <p className="text-3xl font-bold">{newLast7Days}</p>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Biểu đồ donut */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            User Status Ratio
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                fill="#8884d8"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Biểu đồ cột */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
            User Overview
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pieData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="value" position="top" />
              </Bar>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10A37F" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Bảng 5 người dùng mới */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          5 Newest Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Name</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Email</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Created At</th>
              </tr>
            </thead>
            <tbody>
              {latestUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-white">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusLower(user) === "active"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {typeof user.status === "string" ? user.status : (user.status?.value || user.status || "N/A")}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {dayjs(user.created_at).format("DD/MM/YYYY")}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
