import { useEffect, useState } from "react";
import { 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Image as ImageIcon,
  Download,
  Eye,
  Grid3x3,
  List,
  Loader2,
  Calendar,
  User,
  FileImage,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAdminImg } from "@/hooks/admin/useAdminImg";
import TextareaAutosize from "react-textarea-autosize";

export default function ImageManagement() {
  const {
    getAllImgUsers,
    deleteImage,
    updateImageDesc,
    searchImages,
    getStats,
  } = useAdminImg();

  const [images, setImages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [form, setForm] = useState({
    open: false,
    id: null,
    description: "",
  });
  const [deletingId, setDeletingId] = useState(null);

  // Load all images
  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await getAllImgUsers();
      setImages(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách ảnh");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchStats();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!search.trim()) {
        await fetchImages();
      } else {
        const data = await searchImages(search);
        setImages(data || []);
      }
    } catch (error) {
      toast.error("Tìm kiếm thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error("Mô tả không được để trống");
      return;
    }
    try {
      await updateImageDesc(form.id, form.description.trim());
      toast.success("Cập nhật mô tả thành công");
      setForm({ open: false, id: null, description: "" });
      await fetchImages();
    } catch (error) {
      toast.error("Cập nhật thất bại");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteImage(id);
      toast.success("Xóa ảnh thành công");
      await fetchImages();
      await fetchStats();
    } catch (error) {
      toast.error("Xóa ảnh thất bại");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (url, description) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = description || "image.png";
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Đã tải ảnh xuống");
    } catch (error) {
      toast.error("Không thể tải ảnh");
      console.error(error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            Quản lý Ảnh
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và theo dõi tất cả ảnh được tạo bởi người dùng
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchImages}
            disabled={loading}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tổng số ảnh</p>
                <p className="text-3xl font-bold mt-2">{stats.total_images || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FileImage size={32} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Số người dùng</p>
                <p className="text-3xl font-bold mt-2">{stats.by_user?.length || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <User size={32} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Ảnh trung bình/User</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.total_images && stats.by_user?.length
                    ? Math.round(stats.total_images / stats.by_user.length)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Grid3x3 size={32} />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Search size={20} />
                Tìm kiếm
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Images Display */}
      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto text-blue-500" size={48} />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải ảnh...</p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <ImageIcon className="text-gray-400" size={40} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tìm thấy ảnh
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {search ? "Thử tìm kiếm với từ khóa khác" : "Chưa có ảnh nào trong hệ thống"}
          </p>
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all group"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <img
                    src={img.url}
                    alt={img.description}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    onClick={() => {
                      setSelectedImage(img);
                      setShowImageViewer(true);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <button
                      onClick={() => {
                        setSelectedImage(img);
                        setShowImageViewer(true);
                      }}
                      className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-900 font-medium hover:bg-white transition-colors flex items-center gap-2"
                    >
                      <Eye size={18} />
                      Xem
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3 min-h-[2.5rem]">
                    {img.description || (
                      <span className="text-gray-400 italic">Không có mô tả</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>User {img.user_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(img.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setForm({
                          open: true,
                          id: img.id,
                          description: img.description || "",
                        })
                      }
                      className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDownload(img.url, img.description)}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      disabled={deletingId === img.id}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === img.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {images.map((img) => (
                  <motion.tr
                    key={img.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={img.url}
                        alt={img.description}
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                          setSelectedImage(img);
                          setShowImageViewer(true);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white max-w-md">
                        {img.description || (
                          <span className="text-gray-400 italic">Không có mô tả</span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User size={16} />
                        <span>User {img.user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={16} />
                        <span>{formatDate(img.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedImage(img);
                            setShowImageViewer(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Xem ảnh"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() =>
                            setForm({
                              open: true,
                              id: img.id,
                              description: img.description || "",
                            })
                          }
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                          title="Sửa mô tả"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(img.url, img.description)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(img.id)}
                          disabled={deletingId === img.id}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          {deletingId === img.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {showImageViewer && selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageViewer(false)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowImageViewer(false)}
            >
              <div
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage.url}
                  alt={selectedImage.description}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-lg text-white text-sm max-w-2xl text-center">
                  <p>{selectedImage.description || "Không có mô tả"}</p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-300">
                    <span>User {selectedImage.user_id}</span>
                    <span>•</span>
                    <span>{formatDate(selectedImage.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowImageViewer(false)}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {form.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setForm({ open: false, id: null, description: "" })}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setForm({ open: false, id: null, description: "" })}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Pencil size={24} />
                      Chỉnh sửa mô tả
                    </h2>
                    <button
                      onClick={() => setForm({ open: false, id: null, description: "" })}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mô tả
                    </label>
                    <TextareaAutosize
                      minRows={4}
                      maxRows={8}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                      autoFocus
                      placeholder="Nhập mô tả cho ảnh..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setForm({ open: false, id: null, description: "" })}
                      className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
