import { useEffect, useState } from "react";
import useAdminLogs from "@/hooks/admin/useAdminLogs";
import { Trash2, Eye } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";

export default function ViolationLogManagement() {
  const { getAllLog, getLogByUserId } = useAdminLogs();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterUserId, setFilterUserId] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  // Lấy tất cả logs
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getAllLog(page, pagination.limit);
      setLogs(data.logs || []);
      const total = data.total || data.logs?.length || 0;
      console.log(total)
      setTotalPages(Math.ceil(total / pagination.limit) || 1);
      setPagination((prev) => ({ ...prev, page }));
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc logs theo user_id
  const handleFilter = async (page = 1) => {
    if (!filterUserId) {
      fetchLogs(page);
      return;
    }
    setLoading(true);
    try {
      const data = await getLogByUserId(filterUserId, page, pagination.limit);
      setLogs(data.logs || []);
      const total = data.total || data.logs?.length || 0;
      setTotalPages(Math.ceil(total / pagination.limit) || 1);
      setPagination((prev) => ({ ...prev, page }));
    } catch (err) {
      console.error("Failed to fetch logs by user", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Violation Logs Management</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Filter by User ID"
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <button
          onClick={() => handleFilter(1)}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Filter
        </button>
        <button
          onClick={() => {
            setFilterUserId("");
            fetchLogs(1);
          }}
          className="px-3 py-2 bg-gray-300 rounded"
        >
          Reset
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-2 text-left">User ID</th>
                  <th>Message</th>
                  <th>Created At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-2">{log.user_id}</td>
                      <td>{log.action || log.message}</td>
                      <td>
                        {dayjs(log.timestamp || log.created_at).format(
                          "DD/MM/YYYY HH:mm:ss"
                        )}
                      </td>
                      <td className="text-right space-x-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:underline"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() =>
                            alert("Xóa log thường chỉ cho Admin cấp cao thôi!")
                          }
                          className="text-red-600 hover:underline"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 p-4">
                      No violation logs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() =>
                  filterUserId
                    ? handleFilter(pagination.page - 1)
                    : fetchLogs(pagination.page - 1)
                }
              >
                Trang trước
              </Button>
              <span>
                Trang {pagination.page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === totalPages || totalPages === 0}
                onClick={() =>
                  filterUserId
                    ? handleFilter(pagination.page + 1)
                    : fetchLogs(pagination.page + 1)
                }
              >
                Trang sau
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Log Detail</h2>
            <p>
              <strong>User ID:</strong> {selectedLog.user_id}
            </p>
            <p>
              <strong>Message:</strong>{" "}
              {selectedLog.action || selectedLog.message}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {dayjs(selectedLog.timestamp || selectedLog.created_at).format(
                "DD/MM/YYYY HH:mm:ss"
              )}
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
