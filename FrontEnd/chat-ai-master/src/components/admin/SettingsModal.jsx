import { useState, useEffect } from "react";
import { X, Moon, Sun, Bell, Globe, Shield, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function SettingsModal({ open, onClose, darkMode, setDarkMode }) {
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    darkMode: darkMode,
    notifications: true,
    language: language,
    autoSave: true,
  });

  useEffect(() => {
    setSettings(prev => ({ ...prev, language: language }));
  }, [language]);

  const handleSave = () => {
    if (setDarkMode) {
      setDarkMode(settings.darkMode);
    }
    // Thay đổi ngôn ngữ
    changeLanguage(settings.language);
    // Lưu settings vào localStorage
    localStorage.setItem("admin_settings", JSON.stringify(settings));
    onClose();
  };

  if (!open) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: 'relative', margin: 'auto' }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t("settings.title")}
              </h2>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Dark Mode */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.darkMode ? (
                      <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t("settings.darkMode")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.darkModeDesc")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.darkMode ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.darkMode ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t("settings.notifications")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.notificationsDesc")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.notifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t("settings.language")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.languageDesc")}
                      </p>
                    </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Auto Save */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t("settings.autoSave")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.autoSaveDesc")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.autoSave ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.autoSave ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {t("settings.security")}
                      </label>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {t("settings.securityDesc")}
                      </p>
                    </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {t("settings.saveChanges")}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

