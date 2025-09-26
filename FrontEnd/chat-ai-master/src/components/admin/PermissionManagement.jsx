// src/pages/admin/PermissionManagement.jsx
import { useEffect, useState } from "react";
import useAdminRoleApi from "@/hooks/admin/useAdminRoleApi";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function PermissionManagement() {
  const {
    getAllPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  } = useAdminRoleApi();
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({
    open: false,
    mode: "create",
    data: { name: "", description: "" },
  });
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const data = await getAllPermissions();
      setPermissions(data.permissions || []);
    } catch (err) {
      console.error("Failed to fetch permissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { mode, data } = form;
    try {
      if (mode === "create") {
        await createPermission(data.name, data.description);
      } else {
        await updatePermission(data.id, data.name, data.description);
      }
      setForm({
        open: false,
        mode: "create",
        data: { name: "", description: "" },
      });
      fetchPermissions();
    } catch (err) {
      console.error("Failed to save permission", err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Permission Management</h1>
        <button
          onClick={() =>
            setForm({
              open: true,
              mode: "create",
              data: { name: "", description: "" },
            })
          }
          className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700"
        >
          <Plus size={16} /> Add Permission
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Name</th>
                <th>Description</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td>{p.description}</td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() =>
                        setForm({ open: true, mode: "edit", data: p })
                      }
                      className="text-blue-600 hover:underline"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() =>
                        deletePermission(p.id).then(fetchPermissions)
                      }
                      className="text-red-600 hover:underline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 p-4">
                    No permissions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {form.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              {form.mode === "create" ? "Create Permission" : "Edit Permission"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={form.data.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      data: { ...f.data, name: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  value={form.data.description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      data: { ...f.data, description: e.target.value },
                    }))
                  }
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({ open: false, mode: "create", data: {} })
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
