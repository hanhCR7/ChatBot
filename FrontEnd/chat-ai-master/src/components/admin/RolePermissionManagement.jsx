// src/pages/admin/RolePermissionManagement.jsx
import { useEffect, useState } from "react";
import useAdminRoleApi from "@/hooks/admin/useAdminRoleApi";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function RolePermissionManagement() {
  const {
    getRolePermissions,
    createRolePermission,
    updateRolePermission,
    deleteRolePermission,
  } = useAdminRoleApi();

  const [rolePermissions, setRolePermissions] = useState([]);
  const [form, setForm] = useState({
    open: false,
    mode: "create",
    data: { role_name: "", permission_name: "" },
  });
  const [loading, setLoading] = useState(true);

  const fetchRolePermissions = async () => {
    setLoading(true);
    try {
      const res = await getRolePermissions();
      setRolePermissions(res.role_permissions || []);
    } catch (err) {
      console.error("Lỗi khi tải quyền của vai trò", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolePermissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { mode, data } = form;
    try {
      if (mode === "create") {
        await createRolePermission(data.role_name, data.permission_name);
      } else {
        await updateRolePermission(
          data.id,
          data.role_name,
          data.permission_name
        );
      }
      setForm({
        open: false,
        mode: "create",
        data: { role_name: "", permission_name: "" },
      });
      fetchRolePermissions();
    } catch (err) {
      alert("Thao tác thất bại: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xoá quyền này?")) return;
    await deleteRolePermission(id);
    fetchRolePermissions();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Role Permission Management</h1>
        <button
          onClick={() =>
            setForm({
              open: true,
              mode: "create",
              data: { role_name: "", permission_name: "" },
            })
          }
          className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Role</th>
                <th>Permission</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.role_name}</td>
                  <td>{item.permission_name}</td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() =>
                        setForm({ open: true, mode: "edit", data: item })
                      }
                      className="text-blue-600 hover:underline"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {rolePermissions.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 p-4">
                    No role permissions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {form.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              {form.mode === "create"
                ? "Create Role Permission"
                : "Edit Role Permission"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block mb-1">Role Name</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={form.data.role_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      data: { ...f.data, role_name: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Permission Name</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={form.data.permission_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      data: { ...f.data, permission_name: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      open: false,
                      mode: "create",
                      data: { role_name: "", permission_name: "" },
                    })
                  }
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
