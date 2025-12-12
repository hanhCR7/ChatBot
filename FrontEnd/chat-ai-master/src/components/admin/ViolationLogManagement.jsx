import { useEffect, useState, useCallback } from "react";
import useAdminViolationLogs from "@/hooks/admin/useAdminViolationLogs";
import { Trash2, Eye, Search, Filter, X, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { motion, AnimatePresence } from "framer-motion";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function ViolationLogManagement() {
  const { getAllViolationLogs, deleteViolationLog } = useAdminViolationLogs();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterUserId, setFilterUserId] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Lấy tất cả violation logs
  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    const limit = pagination.limit;
    try {
      const data = await getAllViolationLogs(page, limit);
      setLogs(data.violation_log || []);
      const total = data.total || data.violation_log?.length || 0;
      setTotalLogs(total);
      setTotalPages(Math.ceil(total / limit) || 1);
      setPagination((prev) => ({ ...prev, page }));
    } catch (err) {
      console.error("Failed to fetch violation logs", err);
    } finally {
      setLoading(false);
    }
  }, [getAllViolationLogs, pagination.limit]);

  // Lọc logs theo user_id
  const handleFilter = useCallback(async (page = 1) => {
    if (!filterUserId) {
      fetchLogs(page);
      return;
    }
    // Filter client-side vì API không hỗ trợ filter theo user_id
    const data = await getAllViolationLogs(1, 1000); // Lấy nhiều để filter
    const filtered = (data.violation_log || []).filter(
      (log) => log.user_id === parseInt(filterUserId)
    );
    setLogs(filtered);
    setTotalLogs(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pagination.limit) || 1);
    setPagination((prev) => ({ ...prev, page }));
  }, [filterUserId, getAllViolationLogs, pagination.limit, fetchLogs]);

  const handleReset = useCallback(() => {
    setFilterUserId("");
    fetchLogs(1);
  }, [fetchLogs]);

  const handleDelete = useCallback(async (logId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vi phạm này?")) return;
    try {
      await deleteViolationLog(logId);
      fetchLogs(pagination.page);
    } catch (err) {
      alert("Xóa vi phạm thất bại: " + err.message);
    }
  }, [deleteViolationLog, fetchLogs, pagination.page]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Hàm lấy màu và icon theo level
  const getLevelStyle = (level) => {
    switch (level) {
      case 1:
        return {
          color: "yellow",
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          text: "text-yellow-800 dark:text-yellow-300",
          icon: AlertTriangle,
          label: "Cảnh báo"
        };
      case 2:
        return {
          color: "orange",
          bg: "bg-orange-100 dark:bg-orange-900/30",
          text: "text-orange-800 dark:text-orange-300",
          icon: AlertTriangle,
          label: "Cảnh báo nghiêm trọng"
        };
      case 3:
        return {
          color: "red",
          bg: "bg-red-100 dark:bg-red-900/30",
          text: "text-red-800 dark:text-red-300",
          icon: ShieldAlert,
          label: "Vi phạm nghiêm trọng"
        };
      case 4:
        return {
          color: "red",
          bg: "bg-red-200 dark:bg-red-900/50",
          text: "text-red-900 dark:text-red-200",
          icon: ShieldAlert,
          label: "Khóa tài khoản"
        };
      default:
        return {
          color: "gray",
          bg: "bg-gray-100 dark:bg-gray-900/30",
          text: "text-gray-800 dark:text-gray-300",
          icon: AlertTriangle,
          label: `Level ${level}`
        };
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Nhật ký Vi phạm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Xem tất cả các vi phạm của người dùng trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Tổng: <strong className="text-red-600 dark:text-red-400">{totalLogs}</strong> vi phạm</span>
        </div>
      </motion.div>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              placeholder="Lọc theo User ID..."
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleFilter(1)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleFilter(1)}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Lọc
          </motion.button>
          {filterUserId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Reset
            </motion.button>
          )}
          <motion.button
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Đang tải vi phạm...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Mức độ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Nội dung vi phạm
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {logs.length > 0 ? (
                      logs.map((log, index) => {
                        const levelStyle = getLevelStyle(log.level);
                        const LevelIcon = levelStyle.icon;
                        return (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                #{log.user_id}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${levelStyle.bg} ${levelStyle.text}`}>
                                <LevelIcon className="w-4 h-4" />
                                {levelStyle.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900 dark:text-gray-100 max-w-md truncate">
                                {log.message || "Không có mô tả"}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <div>{dayjs(log.created_at).format("DD/MM/YYYY HH:mm:ss")}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  {dayjs(log.created_at).fromNow()}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setSelectedLog(log)}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(log.id)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                              Không có vi phạm nào
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              {filterUserId ? "Thử tìm kiếm với User ID khác" : "Chưa có vi phạm nào được ghi lại"}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hiển thị <strong className="text-gray-900 dark:text-gray-100">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </strong> - <strong className="text-gray-900 dark:text-gray-100">
                      {Math.min(pagination.page * pagination.limit, totalLogs)}
                    </strong> trong tổng số <strong className="text-gray-900 dark:text-gray-100">{totalLogs}</strong> vi phạm
                  </p>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={pagination.page === 1 || loading}
                      onClick={() => fetchLogs(pagination.page - 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Trang trước
                    </motion.button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      Trang {pagination.page} / {totalPages || 1}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={pagination.page === totalPages || totalPages === 0 || loading}
                      onClick={() => fetchLogs(pagination.page + 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Trang sau
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Chi tiết Vi phạm
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedLog(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User ID
                  </label>
                  <p className="mt-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                    #{selectedLog.user_id}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mức độ vi phạm
                  </label>
                  <div className="mt-1">
                    {(() => {
                      const levelStyle = getLevelStyle(selectedLog.level);
                      const LevelIcon = levelStyle.icon;
                      return (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${levelStyle.bg} ${levelStyle.text}`}>
                          <LevelIcon className="w-4 h-4" />
                          {levelStyle.label} (Level {selectedLog.level})
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nội dung vi phạm
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    {selectedLog.message || "Không có mô tả"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thời gian
                  </label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {dayjs(selectedLog.created_at).format("DD/MM/YYYY HH:mm:ss")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(selectedLog.created_at).fromNow()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Đóng
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
