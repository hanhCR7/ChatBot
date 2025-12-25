import { useState, useEffect } from "react";
import { X, Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEmailAPI } from "@/hooks/useEmailAPI";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function SendEmailModal({ open, onClose, recipientEmail = "", recipientName = "" }) {
  const { sendCustomEmail } = useEmailAPI();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    recipient: recipientEmail,
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset và cập nhật form khi modal mở hoặc recipientEmail thay đổi
  useEffect(() => {
    if (open) {
      setFormData({
        recipient: recipientEmail || "",
        subject: "",
        body: "",
      });
    }
  }, [open, recipientEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.recipient) {
      toast.error(t("messages.error.requiredField"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      toast.error(t("messages.error.invalidEmail"));
      return;
    }

    if (!formData.subject.trim()) {
      toast.error(t("messages.error.requiredField"));
      return;
    }

    if (!formData.body.trim()) {
      toast.error(t("messages.error.requiredField"));
      return;
    }

    try {
      setLoading(true);
      await sendCustomEmail({
        recipient: formData.recipient,
        subject: formData.subject,
        body: formData.body,
      });
      toast.success(t("messages.success.emailSent"));
      // Reset form
      setFormData({
        recipient: recipientEmail,
        subject: "",
        body: "",
      });
      onClose();
    } catch (error) {
      const errorMessage =
        error.detail || error.message || t("messages.error.updateFailed");
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
              {t("email.sendEmail")}
            </h2>
            {recipientName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("email.sendTo")}: {recipientName}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipient Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("email.recipientEmail")} <span className="text-red-500">*</span>
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
              {t("email.subject")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder={t("email.enterSubject")}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("email.content")} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder={t("email.enterContent")}
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("email.htmlSupported")}
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
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t("email.sendEmail")}
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
