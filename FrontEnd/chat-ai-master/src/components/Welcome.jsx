import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useChatApi } from "@/hooks/chatBotAI/useChatAPI";
import { useNavigate } from "react-router-dom";

export default function WelcomeScreen({ onClose }) {
  const { createChat, getChats } = useChatApi();
  const navigate = useNavigate();

  const handleNew = async () => {
    try {
      const chat = await createChat("New Chat");
      await getChats();
      navigate(`/chat/${chat.id}`);
      onClose?.();
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-800 dark:bg-black dark:text-gray-200 transition-colors duration-300">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="flex flex-col items-center"
      >
        <div className="p-6 rounded-full shadow-lg mb-6 bg-gray-100 dark:bg-gray-900">
          <Bot size={56} className="text-green-500" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Welcome to JarVis AI</h1>
        <p className="mb-8 text-center max-w-md text-gray-500 dark:text-gray-400">
          Start a new conversation or continue where you left off.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 font-semibold rounded-xl transition-all shadow-md bg-green-500 hover:bg-green-600 text-white"
          onClick={handleNew}
        >
          New Chat
        </motion.button>
      </motion.div>
    </div>
  );
}
