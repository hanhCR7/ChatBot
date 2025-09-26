import axiosBannedKeywords from "@/utils/axoisBanedKeywordsApi";

const useBannedKeywordsApi = () => {
    // Lấy tất cả từ khóa bị cấm
    const getAllBannedKeywords = async () => {
        const res = await axiosBannedKeywords.get("api/chatbot_service/banned_keywords");
        return res.data;
    };

    // Thêm từ khóa bị cấm
    const addBannedKeyword = async (keyword) => {
        const res = await axiosBannedKeywords.post(
          "api/chatbot_service/banned_keywords",
          { keyword }
        );
        return res.data;
    };

    // Xóa từ khóa bị cấm
    const deleteBannedKeyword = async (keywordId) => {
        const res = await axiosBannedKeywords.delete(
          `api/chatbot_service/banned_keywords/${keywordId}`
        );
        return res.data;
    };
    // Danh sách các từ khóa bị cấm (PUBLIC)
    const getPublicBannedKeywords = async () => {
        const res = await axiosBannedKeywords.get(
          "api/chatbot_service/banned_keyword/public"
        );
        return res.data;
    };
    return {
        getAllBannedKeywords,
        addBannedKeyword,
        deleteBannedKeyword,
        getPublicBannedKeywords,
    };
}
export default useBannedKeywordsApi;