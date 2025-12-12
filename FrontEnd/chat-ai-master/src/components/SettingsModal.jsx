import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, FileText, Users, Shield } from "lucide-react";
import { createPortal } from "react-dom";

export default function SettingsModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("notifications");

  if (!open) return null;

  const tabs = [
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "terms", label: "Điều khoản sử dụng", icon: FileText },
    { id: "policy", label: "Chính sách cộng đồng", icon: Users },
  ];

  const content = {
    notifications: {
      title: "Cài đặt thông báo",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Quản lý thông báo
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Tại đây bạn có thể quản lý các cài đặt thông báo cho tài khoản của mình.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Thông báo email</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo qua email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Thông báo bảo mật</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cảnh báo về hoạt động bảo mật</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Thông báo cập nhật</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thông báo về tính năng mới</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      ),
    },
    terms: {
      title: "Điều khoản sử dụng",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Điều khoản sử dụng JarVis AI
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-4 text-sm">
            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Chấp nhận điều khoản</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Bằng việc sử dụng dịch vụ JarVis AI, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản sử dụng này. 
                Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được phép sử dụng dịch vụ.
              </p>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Sử dụng dịch vụ</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Bạn được phép sử dụng JarVis AI cho mục đích hợp pháp và không được:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Sử dụng dịch vụ để tạo nội dung bất hợp pháp, có hại, đe dọa, lạm dụng, quấy rối hoặc vi phạm quyền của người khác</li>
                <li>Thử nghiệm, quét hoặc kiểm tra tính dễ bị tổn thương của hệ thống</li>
                <li>Thực hiện bất kỳ hoạt động nào có thể làm gián đoạn hoặc làm hỏng dịch vụ</li>
                <li>Sử dụng dịch vụ để tạo mã độc, virus hoặc phần mềm độc hại</li>
              </ul>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Quyền sở hữu trí tuệ</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Tất cả nội dung, tính năng và chức năng của dịch vụ, bao gồm nhưng không giới hạn ở văn bản, đồ họa, 
                logo, biểu tượng, hình ảnh và phần mềm, là tài sản của JarVis AI và được bảo vệ bởi luật bản quyền, 
                nhãn hiệu và các luật sở hữu trí tuệ khác.
              </p>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Giới hạn trách nhiệm</h4>
              <p className="text-gray-600 dark:text-gray-300">
                JarVis AI cung cấp dịch vụ "như hiện tại" và "như có sẵn" mà không có bất kỳ bảo đảm nào, 
                dù là rõ ràng hay ngụ ý. Chúng tôi không đảm bảo rằng dịch vụ sẽ không bị gián đoạn, an toàn hoặc không có lỗi.
              </p>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Thay đổi điều khoản</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào. Việc bạn tiếp tục sử dụng dịch vụ 
                sau khi có thay đổi được coi là bạn chấp nhận các điều khoản mới.
              </p>
            </section>
          </div>
        </div>
      ),
    },
    policy: {
      title: "Chính sách cộng đồng",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Chính sách cộng đồng JarVis AI
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Chúng tôi cam kết tạo ra một môi trường tích cực và tôn trọng cho tất cả người dùng.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-4 text-sm">
            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                1. Hành vi được khuyến khích
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Tôn trọng người khác và ý kiến của họ</li>
                <li>Sử dụng ngôn ngữ lịch sự và chuyên nghiệp</li>
                <li>Chia sẻ kiến thức và giúp đỡ cộng đồng</li>
                <li>Báo cáo hành vi không phù hợp</li>
                <li>Tuân thủ các quy tắc và hướng dẫn của cộng đồng</li>
              </ul>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                2. Hành vi bị cấm
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Quấy rối, đe dọa hoặc làm nhục người khác</li>
                <li>Phát tán nội dung spam, lừa đảo hoặc độc hại</li>
                <li>Vi phạm quyền sở hữu trí tuệ</li>
                <li>Sử dụng ngôn ngữ tục tĩu, phân biệt đối xử hoặc kích động thù địch</li>
                <li>Chia sẻ thông tin cá nhân của người khác mà không được phép</li>
                <li>Tạo nhiều tài khoản để tránh các biện pháp kỷ luật</li>
              </ul>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                3. Hậu quả vi phạm
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Vi phạm chính sách cộng đồng có thể dẫn đến:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Cảnh báo và yêu cầu sửa đổi hành vi</li>
                <li>Tạm thời khóa tài khoản (từ 1 ngày đến 30 ngày)</li>
                <li>Khóa tài khoản vĩnh viễn trong trường hợp vi phạm nghiêm trọng</li>
                <li>Xóa nội dung vi phạm</li>
              </ul>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                4. Báo cáo vi phạm
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Nếu bạn gặp phải hành vi vi phạm chính sách, vui lòng báo cáo cho chúng tôi ngay lập tức. 
                Chúng tôi sẽ xem xét và xử lý mọi báo cáo một cách nghiêm túc và kịp thời.
              </p>
            </section>

            <section className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                5. Cam kết của chúng tôi
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Chúng tôi cam kết duy trì một môi trường an toàn, tôn trọng và tích cực cho tất cả người dùng. 
                Chúng tôi sẽ không ngừng cải thiện các biện pháp bảo vệ và hỗ trợ cộng đồng của mình.
              </p>
            </section>
          </div>
        </div>
      ),
    },
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Cài đặt
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-all ${
                        activeTab === tab.id
                          ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {content[activeTab].title}
                    </h3>
                    {content[activeTab].content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

