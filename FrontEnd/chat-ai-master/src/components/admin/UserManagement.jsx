// src/pages/admin/UserManagement.jsx
import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  EyeOff,
  Eye,
  Download,
  Mail,
} from "lucide-react";
import useAdminUserApi from "@/hooks/admin/useAdminUserAPI";
import dayjs from "dayjs";
import SendEmailModal from "../SendEmailModal";

/** -------------------------------------------------------------------------
 * Trang quản lý User (Admin)
 * - Danh sách người dùng với tìm kiếm, tạo‑sửa‑xoá.
 * - Toggle Active / Inactive.
 * - Xuất Excel toàn bộ user.
 * - Đếm nhanh số user đang hoạt động.
 * ------------------------------------------------------------------------- */
export default function UserManagement() {
  const {
    getAllUser,
    createUser,
    updateUser,
    deleteUser,
    editActiveUser,
    exportUserData,
    getListActiveUser,
  } = useAdminUserApi();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCount, setActiveCount] = useState(0);
  const [form, setForm] = useState({ open: false, mode: "create", data: null });
  const [emailModal, setEmailModal] = useState({ open: false, user: null });

  /* ---------------------------------------------------------------------- */
  /* Fetch users + active count                                             */
  /* ---------------------------------------------------------------------- */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUser();
      setUsers(list);
      setError(null);
    } catch {
      setError("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCount = async () => {
    try {
      const actives = await getListActiveUser();
      setActiveCount(actives.length);
    } catch {
      setActiveCount(0);
    }
  };

  const hasFetchedRef = useRef(false);
  
  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (hasFetchedRef.current) return;
    
    hasFetchedRef.current = true;
    fetchUsers();
    fetchActiveCount();
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */
  const resetForm = () => setForm({ open: false, mode: "create", data: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { mode, data } = form;
    const { first_name, last_name, username, email, new_password } = data;
    try {
      if (mode === "create") {
        await createUser(first_name, last_name, username, email, new_password);
      } else {
        await updateUser(
          data.id,
          first_name,
          last_name,
          username,
          email,
          data.status
        );
      }
      resetForm();
      fetchUsers();
      fetchActiveCount();
    } catch (err) {
      alert("Lưu thất bại: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xác nhận xoá user?")) return;
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    fetchActiveCount();
  };

  const handleToggleActive = async (id) => {
    await editActiveUser(id);
    fetchUsers();
    fetchActiveCount();
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */
  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.username}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
          Số Lượng User: {activeCount}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded border text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none"
          />
          <button
            onClick={exportUserData}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={() =>
              setForm({
                open: true,
                mode: "create",
                data: {
                  first_name: "",
                  last_name: "",
                  username: "",
                  email: "",
                  new_password: "",
                },
              })
            }
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded"
          >
            <Plus size={16} /> Add User
          </button>
          <button
            onClick={() => {
              fetchUsers();
              fetchActiveCount();
            }}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th>Email</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <td className="p-2 whitespace-nowrap">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="whitespace-nowrap">{u.email}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        u.status === "Active"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="pr-4 space-x-2 text-right">
                    <button
                      onClick={() =>
                        setEmailModal({
                          open: true,
                          user: u,
                        })
                      }
                      className="text-green-600 hover:underline"
                      title="Gửi email"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setForm({
                          open: true,
                          mode: "edit",
                          data: { ...u, new_password: "" },
                        })
                      }
                      className="text-blue-600 hover:underline"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:underline"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className="text-amber-600 hover:underline"
                      title={u.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"}
                    >
                      {u.status === "Active" ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal form */}
      {form.open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={resetForm}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded shadow-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              {form.mode === "create" ? "Create User" : "Edit User"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              {[
                { label: "First name", key: "first_name" },
                { label: "Last name", key: "last_name" },
                { label: "Username", key: "username" },
                { label: "Email", key: "email", type: "email" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block mb-1 text-gray-600 dark:text-gray-300">
                    {label}
                  </label>
                  <input
                    type={type || "text"}
                    value={form.data[key] || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        data: { ...f.data, [key]: e.target.value },
                      }))
                    }
                    required={key !== "last_name"}
                    className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none"
                  />
                </div>
              ))}

              {/* Chỉ hiển thị Password khi tạo mới */}
              {form.mode === "create" && (
                <div>
                  <label className="block mb-1 text-gray-600 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.data.password || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        data: { ...f.data, password: e.target.value },
                      }))
                    }
                    required
                    className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      <SendEmailModal
        open={emailModal.open}
        onClose={() => setEmailModal({ open: false, user: null })}
        recipientEmail={emailModal.user?.email || ""}
        recipientName={
          emailModal.user
            ? `${emailModal.user.first_name} ${emailModal.user.last_name}`
            : ""
        }
      />
    </div>
  );
}
