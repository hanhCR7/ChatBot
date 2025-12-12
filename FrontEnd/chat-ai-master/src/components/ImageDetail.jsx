import { useEffect, useRef, useState } from "react";
import {
  Trash2,
  Edit2,
  Download,
  Send,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useChatImage } from "@/hooks/chatBotAI/useChatImage";

export default function ImageDetail() {
  const { generateImage, getMyImages, updateImage, deleteImage } =
    useChatImage();

  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Load user's images
  const fetchImages = async () => {
    try {
      const data = await getMyImages();
      setImages(data);
    } catch {
      toast.error("Không tải được ảnh");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Handle scroll
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  useEffect(() => {
    if (isNearBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [images, isNearBottom]);

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) {
      toast.error("Vui lòng nhập prompt hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const newImg = await generateImage(text);
      setImages((prev) => [newImg, ...prev]);
      setPrompt("");
      toast.success("Tạo ảnh thành công!");
    } catch (error) {
      toast.error(error.message || "Tạo ảnh thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteImage(id);
      setImages(images.filter((img) => img.id !== id));
      toast.success("Đã xóa ảnh");
    } catch {
      toast.error("Xóa ảnh thất bại");
    }
  };

  const handleEdit = async (id) => {
    if(!editText || editText.trim() === ""){
      toast.error("Description không được để trống");
      return;
    }
    try {
      const updated = await updateImage(id, editText);
      setImages(images.map((img) => (img.id === id ? updated : img)));
      setEditingId(null);
      toast.success("Cập nhật thành công");
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleDownload = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "image.png";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Không thể tải ảnh");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* List images */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
      >
        {images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                <ImageIcon className="text-white" size={48} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Chưa có ảnh nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Nhập prompt bên dưới để tạo ảnh AI đầu tiên của bạn
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {images.map((img, index) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="relative group rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative">
                    <img
                      src={img.url}
                      alt={img.description}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Overlay actions */}
                  <AnimatePresence>
                    {editingId !== img.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 backdrop-blur-sm"
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setEditingId(img.id);
                            setEditText(img.description || "");
                          }}
                          className="p-3 rounded-full bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(img.id)}
                          className="p-3 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(img.url)}
                          className="p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={18} />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-4">
                    {editingId === img.id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <TextareaAutosize
                          minRows={2}
                          maxRows={4}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 p-3 border-2 border-blue-300 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(img.id)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all shadow-md hover:shadow-lg"
                          >
                            Hủy
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {img.description || (
                          <span className="text-gray-400 italic">
                            Không có mô tả
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-end"
          >
            <div className="flex-1 relative">
              <div className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500">
                <Sparkles size={20} />
              </div>
              <TextareaAutosize
                minRows={1}
                maxRows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập prompt để tạo ảnh AI... (Ví dụ: A beautiful sunset over mountains)"
                className="w-full pl-12 pr-4 py-3.5 resize-none rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className={`px-6 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                !prompt.trim() || loading
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="hidden sm:inline">Đang tạo...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span className="hidden sm:inline">Tạo ảnh</span>
                </>
              )}
            </motion.button>
          </motion.div>
          {images.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center"
            >
              Bạn có {images.length} {images.length === 1 ? "ảnh" : "ảnh"}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
