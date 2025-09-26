import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAllChatUsers from "@/hooks/admin/AllChatUsers";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function AdminAllChatUsers() {
  const { getAllChatUsers } = useAllChatUsers();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async (page = 1, keyword = search) => {
    try {
      setLoading(true);
      const res = await getAllChatUsers(page, pagination.limit, keyword);
      setUsers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handleViewDetail = (user_id) => {
    navigate(`/admin/chat-users/${user_id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Danh sách Chat của tất cả User</h1>

      {/* Ô tìm kiếm */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit">Tìm kiếm</Button>
        {search && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              fetchUsers(1, "");
            }}
          >
            Xoá lọc
          </Button>
        )}
      </form>

      {/* Bảng */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Số Chat</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell>{u.user_id}</TableCell>
                  <TableCell>{u.username || "-"}</TableCell>
                  <TableCell>{u.email || "-"}</TableCell>
                  <TableCell>{u.sessions.length}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleViewDetail(u.user_id)}
                    >
                      Xem chi tiết user
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={pagination.page === 1}
          onClick={() => fetchUsers(pagination.page - 1)}
        >
          Trang trước
        </Button>
        <span>
          Trang {pagination.page} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          disabled={pagination.page === totalPages || totalPages === 0}
          onClick={() => fetchUsers(pagination.page + 1)}
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
}
