import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Code, MessageSquare, Zap, Loader2 } from "lucide-react";
import { useChatApi } from "@/hooks/chatBotAI/useChatAPI";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Welcome({ onClose }) {
  const { createChat, getChats } = useChatApi();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleNew = async () => {
    if (isCreating) return; // Prevent multiple clicks
    
    setIsCreating(true);
    try {
      const chat = await createChat("New Chat");
      await getChats();
      toast.success("Đã tạo cuộc trò chuyện mới!");
      navigate(`/chat/${chat.id}`);
      onClose?.();
    } catch (error) {
      console.error("Failed to create chat:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Không thể tạo cuộc trò chuyện. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: Code,
      title: "Code Review",
      description: "Phân tích và đánh giá code của bạn một cách chi tiết",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: MessageSquare,
      title: "Hỏi đáp Thông minh",
      description: "Giải đáp mọi thắc mắc về lập trình và công nghệ",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "Phản hồi Nhanh",
      description: "Trải nghiệm AI mạnh mẽ với tốc độ xử lý tức thì",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-y-auto overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Animated Background Blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDelay: '1s' }}></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-full py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center max-w-4xl mx-auto px-4 sm:px-6 w-full"
        >
          {/* Logo with enhanced animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="mb-4 sm:mb-5 md:mb-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 relative overflow-hidden"
          >
            {/* Animated background glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl sm:rounded-3xl"
            />
            <Bot size={40} className="sm:w-12 sm:h-12 md:w-14 md:h-14 text-white relative z-10" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 text-center px-4"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent block">
              Chào mừng đến với
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent block">
              JarVis AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-center mb-4 sm:mb-6 md:mb-8 text-gray-600 dark:text-gray-400 max-w-2xl font-medium px-4"
          >
            Trợ lý lập trình thông minh của bạn - Học tập và làm việc hiệu quả hơn
          </motion.p>

          {/* Features Grid - 3 columns for better layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-10 w-full max-w-5xl px-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="group relative p-5 sm:p-6 md:p-7 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Icon with glow effect */}
                  <div className="relative z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.color} opacity-5 rounded-bl-full`}></div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Button with enhanced design */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            whileHover={{ 
              scale: isCreating ? 1 : 1.08, 
              boxShadow: isCreating ? "none" : "0 25px 50px rgba(99, 102, 241, 0.4)" 
            }}
            whileTap={{ scale: isCreating ? 1 : 0.95 }}
            onClick={handleNew}
            disabled={isCreating}
            className="relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 font-bold text-base sm:text-lg md:text-xl rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all flex items-center gap-3 sm:gap-4 group disabled:opacity-70 disabled:cursor-not-allowed mb-6 sm:mb-8 overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "linear",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin relative z-10" />
                <span className="relative z-10">Đang tạo cuộc trò chuyện...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform relative z-10" />
                <span className="relative z-10">Bắt đầu cuộc trò chuyện mới</span>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-rotate-12 transition-transform relative z-10" />
              </>
            )}
          </motion.button>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 text-center px-4 pb-2 sm:pb-4"
          >
            Powered by OpenAI • Được thiết kế cho lập trình viên
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
