import { useEffect, useRef, useState } from "react";
import { FaTrash, FaEdit, FaDownload, FaPaperPlane } from "react-icons/fa";
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
    <div className="flex flex-col h-full">
      {/* List images */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 bg-background"
      >
        {images.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Chưa có ảnh nào được tạo
          </p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-xl shadow-md overflow-hidden bg-card transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.description}
                    className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Overlay actions (chỉ hiện khi KHÔNG edit) */}
                {editingId !== img.id && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(img.id);
                        setEditText(img.description || "");
                      }}
                      className="p-2 rounded-full bg-yellow-500 text-white shadow hover:scale-110 transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-2 rounded-full bg-red-600 text-white shadow hover:scale-110 transition"
                    >
                      <FaTrash />
                    </button>
                    <button
                      onClick={() => handleDownload(img.url)}
                      className="p-2 rounded-full bg-blue-600 text-white shadow hover:scale-110 transition"
                    >
                      <FaDownload />
                    </button>
                  </div>
                )}

                <div className="p-3">
                  {editingId === img.id ? (
                    <div className="flex gap-2">
                      <TextareaAutosize
                        minRows={1}
                        maxRows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        onClick={() => handleEdit(img.id)}
                        className="bg-green-600 px-3 rounded text-white"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 px-3 rounded text-white"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {img.description || "Không có mô tả"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4 flex gap-3">
        <TextareaAutosize
          minRows={1}
          maxRows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập prompt để tạo ảnh..."
          className="flex-1 resize-none rounded-xl border bg-background px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading}
          className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
        >
          {loading ? (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </div>
    </div>
  );
}
