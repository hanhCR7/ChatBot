import { useEffect, useState } from "react";
import useAdminRoleApi from "@/hooks/admin/useAdminRoleApi";
import useAdminUserApi from "@/hooks/admin/useAdminUserAPI";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function UserRoleManagement() {
  const { getAllRoles, getUserRoles, createUserRole, deleteUserRole } =
    useAdminRoleApi();
  const { getAllUser } = useAdminUserApi();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [selectedNewRole, setSelectedNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllUser().then((data) => setUsers(data || []));
    getAllRoles().then((data) => setRoles(data.roles || []));
  }, []);

  const handleUserChange = async (userId) => {
    setSelectedUserId(userId);
    setUserRoles([]);
    setLoading(true);
    try {
      const result = await getUserRoles(userId);
      setUserRoles(result.user_roles || []);
    } catch {
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedNewRole) return;
    await createUserRole(selectedUserId, selectedNewRole);
    setSelectedNewRole("");
    handleUserChange(selectedUserId);
  };

  const handleDeleteRole = async (roleName) => {
    await deleteUserRole(selectedUserId, roleName);
    handleUserChange(selectedUserId);
  };

  const availableRoles = roles.filter((r) => !userRoles.includes(r.name));

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h1 className="text-2xl font-bold">Quản lý vai trò người dùng</h1>

      {/* Select user */}
      <Select onValueChange={handleUserChange} value={selectedUserId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Chọn người dùng" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Vai trò hiện tại */}
      {selectedUserId && (
        <>
          <h2 className="text-lg font-semibold mt-4">Vai trò hiện tại</h2>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>Chưa có vai trò nào</TableCell>
                  </TableRow>
                ) : (
                  userRoles.map((r) => (
                    <TableRow key={r}>
                      <TableCell>{r}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteRole(r)}
                        >
                          Xoá
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Gán vai trò mới */}
          <div className="flex items-center gap-3 mt-6">
            <Select onValueChange={setSelectedNewRole} value={selectedNewRole}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Chọn vai trò cần gán" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAssignRole}
              disabled={!selectedNewRole}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Gán vai trò
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
