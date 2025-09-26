import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <motion.h1
        className="text-6xl md:text-8xl font-extrabold mb-6 text-red-500 dark:text-red-400"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        404
      </motion.h1>

      <motion.p
        className="text-lg md:text-2xl mb-6 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </motion.p>

      <Link
        to="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors font-medium"
      >
        Quay về trang chủ
      </Link>
    </div>
  );
}
