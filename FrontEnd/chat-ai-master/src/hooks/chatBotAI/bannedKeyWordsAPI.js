import { useCallback } from "react";
import axios from "@/utils/axiosChat";

export default function useBannedKeywordsApi() {
  const getAllBannedKeywords = useCallback(async () => {
    try {
      const res = await axios.get("/api/chatbot_service/banned_keywords");
      return res.data || [];
    } catch (err) {
      console.error("Lỗi tải banned keywords:", err);
      return [];
    }
  }, []); // memo hóa, reference cố định

  return { getAllBannedKeywords };
}
