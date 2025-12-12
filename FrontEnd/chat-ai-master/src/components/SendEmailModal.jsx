import { useState } from "react";
import { X, Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEmailAPI } from "@/hooks/useEmailAPI";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

export default function SendEmailModal({ open, onClose, recipientEmail = "", recipientName = "" }) {
  const { sendCustomEmail } = useEmailAPI();
  const [formData, setFormData] = useState({
    recipient: recipientEmail,
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.recipient) {
      toast.error("Vui lòng nhập email người nhận");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      toast.error("Email không hợp lệ");
      return;
    }

    if (!formData.subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề email");
      return;
    }

    if (!formData.body.trim()) {
      toast.error("Vui lòng nhập nội dung email");
      return;
    }

    try {
      setLoading(true);
      await sendCustomEmail({
        recipient: formData.recipient,
        subject: formData.subject,
        body: formData.body,
      });
      toast.success("Email đã được gửi thành công!");
      // Reset form
      setFormData({
        recipient: recipientEmail,
        subject: "",
        body: "",
      });
      onClose();
    } catch (error) {
      const errorMessage =
        error.detail || error.message || "Không thể gửi email. Vui lòng thử lại sau.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl relative overflow-hidden">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 z-10"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gửi Email
            </h2>
            {recipientName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gửi đến: {recipientName}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipient Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email người nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              disabled={!!recipientEmail} // Disable if pre-filled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Nhập tiêu đề email"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Nhập nội dung email (HTML được hỗ trợ)"
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Bạn có thể sử dụng HTML để định dạng email
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gửi Email
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
