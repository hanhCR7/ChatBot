import { useEffect, useState } from "react";
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
} from "recharts";
import useAdminUserApi from "@/hooks/admin/useAdminUserAPI";
import dayjs from "dayjs";

const COLORS = ["#10A37F", "#F87171"]; // xanh lá - đỏ nhạt

const Dashboard = () => {
  const { getAllUser } = useAdminUserApi();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllUser();
        console.log("Full API response:", res);
        setUsers(res || []); // nhớ lấy đúng mảng users
      } catch (err) {
        setError("Không thể tải dữ liệu người dùng.");
      }
    })();
  }, []);

  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!users) return <p className="p-4">Đang tải dữ liệu...</p>;

  // Tính số active/inactive
  const statusLower = (u) => (u.status ?? "").toLowerCase();
  console.log("User list:", users);
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

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget tổng quan */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col justify-center items-center">
          <h2 className="text-lg font-semibold mb-2">Users new last 7 days</h2>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            {newLast7Days}
          </p>
        </div>

        {/* Biểu đồ donut */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">User Status Ratio</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ cột user overview */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">User Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pieData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#10A37F" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng 5 người dùng mới */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">5 Newest Users</h2>
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {latestUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="p-2">
                  {user.first_name} {user.last_name}
                </td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      (user.status || "").toLowerCase() === "active"
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-2">
                  {dayjs(user.created_at).format("DD/MM/YYYY")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
